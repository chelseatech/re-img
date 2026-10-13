use image::{DynamicImage, ImageDecoder, ImageEncoder, ImageReader, GenericImageView};
use image::codecs::{jpeg::JpegEncoder, png::{PngEncoder, CompressionType, FilterType}, webp::WebPEncoder};
use serde::{Deserialize, Serialize};
use moxcms::{ColorProfile, DataColorSpace, Layout, ProfileClass, RenderingIntent, TransformOptions};
use std::{fs::{self, OpenOptions}, io::Write, path::{Path, PathBuf}};

mod colour_metadata;
const MAX_DECODE_BYTES: u64 = 256 * 1024 * 1024;
const COLOUR_FALLBACK: &str = "Convert a copy to sRGB in a colour-managed editor and retry; the original has not been changed.";

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Options {
    pub width: u32, pub height: u32, pub max_bytes: Option<u64>,
    pub format: String, pub quality: u8, pub background: Option<[u8; 3]>,
    pub center_x: f64, pub center_y: f64, pub zoom: f64,
    pub allow_smaller: bool, pub uottawa: bool,
}
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Crop { pub x: u32, pub y: u32, pub width: u32, pub height: u32 }
#[derive(Serialize)]
pub struct ExportResult { pub path: String, pub bytes: usize, pub width: u32, pub height: u32, pub quality: Option<u8>, pub warning: Option<String> }

pub fn validate(o: &Options) -> Result<(), String> {
    if o.width == 0 || o.height == 0 || o.width > 10000 || o.height > 10000 { return Err("Output dimensions must be between 1 and 10000 px.".into()); }
    if !o.center_x.is_finite() || !o.center_y.is_finite() || !o.zoom.is_finite() || o.zoom < 1.0 || o.zoom > 10.0 { return Err("Invalid crop position or zoom.".into()); }
    if !(1..=100).contains(&o.quality) { return Err("Quality must be 1–100.".into()); }
    if !["jpeg", "png", "webp"].contains(&o.format.as_str()) { return Err("Unsupported export format.".into()); }
    if o.uottawa && o.format == "webp" { return Err("uOttawa profiles permit JPEG and PNG only.".into()); }
    if o.max_bytes == Some(0) { return Err("Size limit must be positive or unset.".into()); }
    Ok(())
}

pub fn crop_rect(sw: u32, sh: u32, o: &Options) -> Result<Crop, String> {
    validate(o)?;
    if sw == 0 || sh == 0 { return Err("Empty source.".into()); }
    let ratio = o.width as f64 / o.height as f64;
    let w = (sw as f64).min(sh as f64 * ratio) / o.zoom;
    let h = w / ratio;
    let cw = (w.floor() as u32).max(1).min(sw);
    let ch = (h.floor() as u32).max(1).min(sh);
    let x = (o.center_x.clamp(0.0, 1.0) * sw as f64 - cw as f64 / 2.0).round().clamp(0.0, (sw - cw) as f64) as u32;
    let y = (o.center_y.clamp(0.0, 1.0) * sh as f64 - ch as f64 / 2.0).round().clamp(0.0, (sh - ch) as f64) as u32;
    Ok(Crop { x, y, width: cw, height: ch })
}

pub fn load(path: &Path) -> Result<DynamicImage, String> {
    if fs::metadata(path).map_err(|e| e.to_string())?.len() > 100_000_000 { return Err("Source exceeds the 100 MB prototype input limit.".into()); }
    let mut reader = ImageReader::open(path).map_err(|e| e.to_string())?.with_guessed_format().map_err(|e| e.to_string())?;
    if !matches!(reader.format(), Some(image::ImageFormat::Jpeg | image::ImageFormat::Png | image::ImageFormat::WebP)) { return Err("Use JPEG, PNG or WebP. HEIC, RAW and animated formats are deferred.".into()); }
    let has_icc = colour_metadata::has_icc(path, reader.format().unwrap())
        .map_err(|e| format!("Cannot validate source ICC/colour metadata: {e}. {COLOUR_FALLBACK}"))?;
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(16000); limits.max_image_height = Some(16000); limits.max_alloc = Some(MAX_DECODE_BYTES);
    reader.limits(limits);
    let mut decoder = reader.into_decoder().map_err(|e| e.to_string())?;
    let (w, h) = decoder.dimensions();
    if w as u64 * h as u64 > 64_000_000 { return Err("Source exceeds the 64 megapixel prototype limit.".into()); }
    // from_decoder bypasses ImageReader::decode's output-buffer reservation.
    if decoder.total_bytes() > MAX_DECODE_BYTES { return Err("Source exceeds the 256 MiB decoded-pixel limit.".into()); }
    let icc = decoder.icc_profile().map_err(|e| format!("Cannot read embedded ICC profile: {e}. Convert a copy to sRGB in a colour-managed editor and retry."))?;
    if has_icc && icc.is_none() { return Err(format!("Invalid or unreadable embedded ICC profile. {COLOUR_FALLBACK}")); }
    let orientation = decoder.orientation().map_err(|e| e.to_string())?;
    let mut img = DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    if let Some(profile) = icc {
        convert_to_srgb(&mut img, &profile)?;
    }
    img.apply_orientation(orientation);
    Ok(img)
}

// Both preview and export call load, so they use the same colour conversion.
// The normal transform supports both matrix and LUT RGB profiles. moxcms's
// in-place API only supports matrix profiles and may ignore an available LUT.
// One reusable output row avoids another full-size image allocation.
fn convert_to_srgb(img: &mut DynamicImage, icc: &[u8]) -> Result<(), String> {
    let fallback = COLOUR_FALLBACK;
    colour_metadata::validate_profile_size(icc).map_err(|e| format!("{e}. {fallback}"))?;
    let source = ColorProfile::new_from_slice(icc)
        .map_err(|e| format!("Invalid or unsupported embedded ICC profile: {e}. {fallback}"))?;
    // The JPEG decoder has already converted CMYK to RGB. Applying a CMYK
    // profile to those RGB samples would produce incorrect colours.
    if source.color_space != DataColorSpace::Rgb || !matches!(source.profile_class,
        ProfileClass::InputDevice | ProfileClass::DisplayDevice | ProfileClass::OutputDevice | ProfileClass::ColorSpace) {
        return Err(format!("Unsupported embedded ICC colour space or profile class ({:?}, {:?}); this app supports RGB profiles. {fallback}", source.color_space, source.profile_class));
    }
    let destination = ColorProfile::new_srgb();
    let options = TransformOptions { rendering_intent: RenderingIntent::RelativeColorimetric, ..TransformOptions::default() };
    let conversion_error = |e| format!("Cannot convert embedded ICC profile to sRGB: {e}. {fallback}");
    macro_rules! transform {
        ($pixels:expr, $layout:expr, $create:ident) => {{
            let pixels = $pixels;
            let stride = pixels.width() as usize * if $layout == Layout::Rgba { 4 } else { 3 };
            let transform = source.$create($layout, &destination, $layout, options).map_err(conversion_error)?;
            let mut converted = vec![0; stride];
            for row in pixels.as_mut().chunks_exact_mut(stride) {
                transform.transform(row, &mut converted).map_err(conversion_error)?;
                row.copy_from_slice(&converted);
            }
        }};
    }
    match img {
        DynamicImage::ImageRgb8(pixels) => transform!(pixels, Layout::Rgb, create_transform_8bit),
        DynamicImage::ImageRgba8(pixels) => transform!(pixels, Layout::Rgba, create_transform_8bit),
        DynamicImage::ImageRgb16(pixels) => transform!(pixels, Layout::Rgb, create_transform_16bit),
        DynamicImage::ImageRgba16(pixels) => transform!(pixels, Layout::Rgba, create_transform_16bit),
        _ => return Err(format!("Embedded RGB ICC profile does not match the decoded image colour channels. {fallback}")),
    }
    Ok(())
}

pub fn has_alpha(img: &DynamicImage) -> bool { img.to_rgba8().pixels().any(|p| p[3] < 255) }

pub fn prepare(img: &DynamicImage, o: &Options) -> Result<(DynamicImage, Option<String>), String> {
    let (sw, sh) = img.dimensions();
    let c = crop_rect(sw, sh, o)?;
    let scale = (c.width as f64 / o.width as f64).min(c.height as f64 / o.height as f64).min(1.0);
    let w = (o.width as f64 * scale).floor().max(1.0) as u32;
    let h = (o.height as f64 * scale).floor().max(1.0) as u32;
    let small = w < o.width || h < o.height;
    if small && !o.allow_smaller { return Err(format!("Source crop is too small: available {}×{}, requested {}×{}. Choose a larger source or explicitly allow a smaller derivative.", c.width, c.height, o.width, o.height)); }
    let mut out = img.crop_imm(c.x, c.y, c.width, c.height).resize_exact(w, h, image::imageops::FilterType::Lanczos3);
    if o.format == "jpeg" && has_alpha(&out) {
        let bg = o.background.ok_or("Transparency needs an explicit JPEG background. Choose PNG to preserve it.")?;
        let rgba = out.to_rgba8();
        let rgb = image::RgbImage::from_fn(w, h, |x, y| {
            let p = rgba.get_pixel(x, y); let a = p[3] as u32;
            image::Rgb(std::array::from_fn(|i| ((p[i] as u32 * a + bg[i] as u32 * (255 - a) + 127) / 255) as u8))
        }); out = DynamicImage::ImageRgb8(rgb);
    }
    Ok((out, small.then(|| format!("Smaller derivative {}×{} exported without upscaling.", w, h))))
}

pub fn encode(img: &DynamicImage, format: &str, q: u8) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    let srgb = ColorProfile::new_srgb().encode().map_err(|e| format!("Cannot encode sRGB profile: {e}"))?;
    match format {
        "jpeg" => { let mut encoder = JpegEncoder::new_with_quality(&mut bytes, q); encoder.set_icc_profile(srgb).map_err(|e| e.to_string())?; encoder.encode_image(&DynamicImage::ImageRgb8(img.to_rgb8())).map_err(|e| e.to_string())?; },
        "png" => { let p = img.to_rgba8(); let mut encoder = PngEncoder::new_with_quality(&mut bytes, CompressionType::Best, FilterType::Adaptive); encoder.set_icc_profile(srgb).map_err(|e| e.to_string())?; encoder.write_image(&p, p.width(), p.height(), image::ExtendedColorType::Rgba8).map_err(|e| e.to_string())?; },
        "webp" => { let p = img.to_rgba8(); let mut encoder = WebPEncoder::new_lossless(&mut bytes); encoder.set_icc_profile(srgb).map_err(|e| e.to_string())?; encoder.write_image(&p, p.width(), p.height(), image::ExtendedColorType::Rgba8).map_err(|e| e.to_string())?; },
        _ => return Err("Unsupported format.".into()),
    }
    Ok(bytes)
}

pub fn fit_bytes(img: &DynamicImage, o: &Options) -> Result<(Vec<u8>, Option<u8>), String> {
    validate(o)?;
    let start = if o.format == "jpeg" { o.quality } else { 1 };
    for q in (1..=start).rev() {
        let data = encode(img, &o.format, q)?;
        if o.max_bytes.is_none_or(|cap| data.len() as u64 <= cap) { return Ok((data, (o.format == "jpeg").then_some(q))); }
    }
    Err(format!("Cannot meet the {} byte limit at these dimensions. No file was written. Increase the cap or reduce dimensions; PNG/WebP are lossless.", o.max_bytes.unwrap_or(0)))
}

pub fn thumbnail(img: &DynamicImage) -> Result<Vec<u8>, String> { encode(&img.thumbnail(img.width().min(1100), img.height().min(850)), "png", 100) }

pub fn safe_stem(source: &Path) -> String {
    let raw = source.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
    let clean: String = raw.chars().take(70).map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c } else { '_' }).collect();
    if clean.is_empty() { "image".into() } else { clean }
}

pub fn write_unique(dir: &Path, stem: &str, extension: &str, data: &[u8]) -> Result<PathBuf, String> {
    if !dir.is_dir() { return Err("Choose an existing output folder.".into()); }
    for n in 0..10000 {
        let name = if n == 0 { format!("{stem}.{extension}") } else { format!("{stem}-{n}.{extension}") };
        let path = dir.join(name);
        match OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(mut file) => {
                if let Err(e) = file.write_all(data).and_then(|_| file.sync_all()) { drop(file); let _ = fs::remove_file(&path); return Err(e.to_string()); }
                return Ok(path);
            },
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.to_string()),
        }
    }
    Err("Too many filename collisions; select another output folder.".into())
}

pub fn export(source: &Path, dir: &Path, o: &Options) -> Result<ExportResult, String> {
    let img = load(source)?;
    let (out, warning) = prepare(&img, o)?;
    let (bytes, quality) = fit_bytes(&out, o)?;
    let ext = if o.format == "jpeg" { "jpg" } else { &o.format };
    let stem = format!("{}-web-{}x{}", safe_stem(source), out.width(), out.height());
    let path = write_unique(dir, &stem, ext, &bytes)?;
    Ok(ExportResult { path: path.to_string_lossy().into_owned(), bytes: bytes.len(), width: out.width(), height: out.height(), quality, warning })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    fn options() -> Options { Options { width: 80, height: 80, max_bytes: None, format: "png".into(), quality: 85, background: None, center_x: 0.5, center_y: 0.5, zoom: 1.0, allow_smaller: false, uottawa: true } }
    #[test] fn crop_edges_and_zoom() { let mut o = options(); o.center_x = 0.0; assert_eq!(crop_rect(300, 200, &o).unwrap(), Crop { x: 0, y: 0, width: 200, height: 200 }); o.center_x = 1.0; assert_eq!(crop_rect(300, 200, &o).unwrap().x, 100); o.zoom = 2.0; assert_eq!(crop_rect(300, 200, &o).unwrap().width, 100); }
    #[test] fn no_upscale_and_explicit_opt_in() { let img = DynamicImage::new_rgba8(20, 20); let mut o = options(); assert!(prepare(&img, &o).is_err()); o.allow_smaller = true; let (out, warning) = prepare(&img, &o).unwrap(); assert_eq!(out.dimensions(), (20, 20)); assert!(warning.is_some()); }
    #[test] fn transparency_requires_choice() { let img = DynamicImage::new_rgba8(100, 100); let mut o = options(); o.format = "jpeg".into(); assert!(prepare(&img, &o).is_err()); o.background = Some([255; 3]); let (out, _) = prepare(&img, &o).unwrap(); assert_eq!(out.to_rgb8().get_pixel(0, 0).0, [255; 3]); o.format = "png".into(); let (out, _) = prepare(&img, &o).unwrap(); assert_eq!(out.to_rgba8().get_pixel(0, 0)[3], 0); }
    #[test] fn impossible_cap_and_uottawa_formats() { let img = DynamicImage::new_rgb8(80, 80); let mut o = options(); o.max_bytes = Some(1); assert!(fit_bytes(&img, &o).is_err()); o.format = "webp".into(); assert!(validate(&o).is_err()); }
    #[test] fn invalid_numbers_are_rejected() { let mut o = options(); o.zoom = f64::NAN; assert!(crop_rect(100, 100, &o).is_err()); }
    #[test] fn rounded_crop_keeps_exact_requested_output() { let img = DynamicImage::new_rgb8(1500, 1000); let mut o = options(); o.width = 830; o.height = 553; let (out, warning) = prepare(&img, &o).unwrap(); assert_eq!(out.dimensions(), (830, 553)); assert!(warning.is_none()); }
    #[test] fn orientation_precedes_crop() { let mut img = DynamicImage::ImageRgb8(image::RgbImage::from_fn(120, 80, |x, _| if x < 60 { image::Rgb([255, 0, 0]) } else { image::Rgb([0, 0, 255]) })); img.apply_orientation(image::metadata::Orientation::Rotate90); assert_eq!(img.dimensions(), (80, 120)); let mut o = options(); o.center_y = 0.0; let (out, _) = prepare(&img, &o).unwrap(); assert_eq!(out.to_rgb8().get_pixel(40, 0).0, [255, 0, 0]); }
    #[test] fn collision_keeps_original_bytes() { let dir = std::env::temp_dir().join(format!("prep-core-test-{}-{}", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos())); fs::create_dir(&dir).unwrap(); let a = write_unique(&dir, "photo-web-80x80", "png", b"original").unwrap(); let b = write_unique(&dir, "photo-web-80x80", "png", b"derivative").unwrap(); assert_ne!(a, b); assert_eq!(fs::read(&a).unwrap(), b"original"); assert_eq!(fs::read(&b).unwrap(), b"derivative"); fs::remove_file(a).unwrap(); fs::remove_file(b).unwrap(); fs::remove_dir(dir).unwrap(); }
    #[test] fn derivative_roundtrip_and_metadata_removed() { let img = DynamicImage::new_rgb8(100, 100); for format in ["jpeg", "png", "webp"] { let data = encode(&img, format, 85).unwrap(); let mut decoder = ImageReader::new(Cursor::new(data)).with_guessed_format().unwrap().into_decoder().unwrap(); assert!(decoder.exif_metadata().unwrap().is_none()); let profile = ColorProfile::new_from_slice(&decoder.icc_profile().unwrap().unwrap()).unwrap(); assert_eq!(profile.color_space, DataColorSpace::Rgb); assert!(profile.description.is_some()); } }

    fn fixture_dir() -> PathBuf {
        static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let stamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
        fixture_dir_at(&std::env::temp_dir(), stamp, &NEXT)
    }
    fn fixture_dir_at(base: &Path, stamp: u128, next: &std::sync::atomic::AtomicU64) -> PathBuf {
        loop {
            let serial = next.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            let dir = base.join(format!("prep-icc-{}-{stamp}-{serial}", std::process::id()));
            match fs::create_dir(&dir) {
                Ok(()) => return dir,
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => panic!("Cannot reserve test fixture directory {}: {error}", dir.display()),
            }
        }
    }
    #[test] fn fixture_directories_are_unique_with_a_fixed_clock_and_parallel_tests() {
        let root = fixture_dir();
        let occupied = root.join(format!("prep-icc-{}-42-0", std::process::id()));
        fs::create_dir(&occupied).unwrap();
        fs::write(occupied.join("keep.txt"), b"existing fixture").unwrap();
        let next = std::sync::atomic::AtomicU64::new(0);
        let dirs = std::thread::scope(|scope| {
            let handles: Vec<_> = (0..32).map(|_| scope.spawn(|| fixture_dir_at(&root, 42, &next))).collect();
            handles.into_iter().map(|handle| handle.join().unwrap()).collect::<Vec<_>>()
        });
        assert_eq!(dirs.iter().collect::<std::collections::HashSet<_>>().len(), 32);
        assert!(dirs.iter().all(|dir| dir != &occupied && dir.parent() == Some(root.as_path())));
        assert_eq!(fs::read(occupied.join("keep.txt")).unwrap(), b"existing fixture");
        assert_eq!(next.load(std::sync::atomic::Ordering::Relaxed), 33);
        for dir in dirs { fs::remove_dir(dir).unwrap(); }
        fs::remove_file(occupied.join("keep.txt")).unwrap();
        fs::remove_dir(occupied).unwrap(); fs::remove_dir(root).unwrap();
    }
    fn tagged_png(img: &image::RgbaImage, profile: Vec<u8>) -> Vec<u8> {
        let mut data = Vec::new();
        let mut encoder = PngEncoder::new(&mut data);
        encoder.set_icc_profile(profile).unwrap();
        encoder.write_image(img, img.width(), img.height(), image::ExtendedColorType::Rgba8).unwrap();
        data
    }
    use moxcms::{LutDataType, LutStore, LutType, LutWarehouse, Matrix3d};
    fn rgb_profile_with_black_lut() -> Vec<u8> {
        let mut source = ColorProfile::new_srgb();
        source.lut_a_to_b_colorimetric = Some(LutWarehouse::Lut(LutDataType {
            num_input_channels: 3,
            num_output_channels: 3,
            num_clut_grid_points: 2,
            matrix: Matrix3d { v: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]] },
            num_input_table_entries: 2,
            num_output_table_entries: 2,
            input_table: LutStore::Store16(vec![0, 65535, 0, 65535, 0, 65535]),
            clut_table: LutStore::Store16(vec![0; 2 * 2 * 2 * 3]),
            output_table: LutStore::Store16(vec![0, 65535, 0, 65535, 0, 65535]),
            lut_type: LutType::Lut16,
        }));
        source.encode().unwrap()
    }


    #[test] fn mixed_matrix_and_lut_icc_uses_lut_and_preserves_alpha() {
        let pixels = image::RgbaImage::from_pixel(5, 3, image::Rgba([128, 96, 64, 170]));
        let mut img = DynamicImage::ImageRgba8(pixels);
        convert_to_srgb(&mut img, &rgb_profile_with_black_lut()).unwrap();
        for pixel in img.to_rgba8().pixels() { assert_eq!(pixel.0, [0, 0, 0, 170]); }
    }
    fn jpeg_with_segments(segments: &[(u8, Vec<u8>)]) -> Vec<u8> {
        let mut jpeg = Vec::new();
        JpegEncoder::new_with_quality(&mut jpeg, 95).encode_image(&DynamicImage::new_rgb8(100, 100)).unwrap();
        let mut output = jpeg[..2].to_vec();
        for (marker, payload) in segments {
            output.extend_from_slice(&[0xff, *marker]);
            output.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes());
            output.extend_from_slice(payload);
        }
        output.extend_from_slice(&jpeg[2..]); output
    }
    fn icc_segment(sequence: u8, count: u8, profile: &[u8]) -> (u8, Vec<u8>) {
        let mut bytes = b"ICC_PROFILE\0".to_vec();
        bytes.extend_from_slice(&[sequence, count]); bytes.extend_from_slice(profile);
        (0xe2, bytes)
    }
    fn assert_import_rejected_unchanged(bytes: &[u8], extension: &str) {
        let dir = fixture_dir(); let path = dir.join(format!("corrupt.{extension}"));
        fs::write(&path, bytes).unwrap();
        let error = export(&path, &dir, &options()).err().expect("Corrupt ICC must not become untagged sRGB");
        assert!(error.contains("ICC"), "{error}");
        assert!(error.contains("Convert a copy to sRGB"), "{error}");
        assert_eq!(fs::read(&path).unwrap(), bytes);
        assert_eq!(fs::read_dir(&dir).unwrap().count(), 1);
        fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn incomplete_duplicate_and_inconsistent_jpeg_icc_are_rejected() {
        let profile = ColorProfile::new_adobe_rgb().encode().unwrap();
        for segments in [
            vec![icc_segment(1, 2, &profile)],
            vec![icc_segment(1, 2, &profile), icc_segment(1, 2, &profile)],
            vec![icc_segment(1, 2, &profile), icc_segment(2, 3, &profile)],
            vec![icc_segment(0, 1, &profile)],
        ] { assert_import_rejected_unchanged(&jpeg_with_segments(&segments), "jpg"); }
    }
    #[test] fn incorrect_icc_declared_size_is_rejected() {
        let pixels = image::RgbaImage::from_pixel(100, 100, image::Rgba([100; 4]));
        let mut profile = ColorProfile::new_srgb().encode().unwrap();
        profile[..4].copy_from_slice(&132u32.to_be_bytes());
        assert_import_rejected_unchanged(&tagged_png(&pixels, profile), "png");
    }
    fn png_chunk(kind: &[u8; 4], payload: &[u8]) -> Vec<u8> {
        let mut chunk = (payload.len() as u32).to_be_bytes().to_vec();
        chunk.extend_from_slice(kind); chunk.extend_from_slice(payload);
        let mut crc = u32::MAX;
        for byte in &chunk[4..] {
            crc ^= *byte as u32;
            for _ in 0..8 { crc = (crc >> 1) ^ (0xedb88320u32 & (0u32.wrapping_sub(crc & 1))); }
        }
        chunk.extend_from_slice(&(!crc).to_be_bytes()); chunk
    }
    #[test] fn malformed_png_compressed_profile_is_not_treated_as_untagged() {
        let mut clean = Vec::new(); let pixels = image::RgbaImage::new(100, 100);
        PngEncoder::new(&mut clean).write_image(&pixels, 100, 100, image::ExtendedColorType::Rgba8).unwrap();
        // A valid ancillary CRC with invalid ICC compression, after IHDR.
        let chunk = png_chunk(b"iCCP", b"Profile\0\0not zlib data");
        clean.splice(33..33, chunk);
        assert_import_rejected_unchanged(&clean, "png");
    }
    #[test] fn duplicate_and_late_png_icc_chunks_are_rejected() {
        let pixels = image::RgbaImage::new(100, 100);
        let png = tagged_png(&pixels, ColorProfile::new_srgb().encode().unwrap());
        let length = u32::from_be_bytes(png[33..37].try_into().unwrap()) as usize + 12;
        assert_eq!(&png[37..41], b"iCCP");
        let chunk = &png[33..33 + length];
        let mut duplicate = png.clone(); duplicate.splice(33..33, chunk.iter().copied());
        assert_import_rejected_unchanged(&duplicate, "png");
        let mut late = png.clone(); late.drain(33..33 + length);
        late.splice(late.len() - 12..late.len() - 12, chunk.iter().copied());
        assert_import_rejected_unchanged(&late, "png");
    }
    #[test] fn webp_icc_flag_and_duplicate_chunks_are_validated() {
        let webp = encode(&DynamicImage::new_rgb8(100, 100), "webp", 90).unwrap();
        assert_eq!(&webp[12..16], b"VP8X");
        let mut start = 12;
        while &webp[start..start + 4] != b"ICCP" {
            let size = u32::from_le_bytes(webp[start + 4..start + 8].try_into().unwrap()) as usize;
            start += 8 + size + size % 2;
        }
        let size = u32::from_le_bytes(webp[start + 4..start + 8].try_into().unwrap()) as usize;
        let end = start + 8 + size + size % 2;
        let mut missing = webp.clone(); missing.drain(start..end);
        let length = (missing.len() - 8) as u32; missing[4..8].copy_from_slice(&length.to_le_bytes());
        assert_import_rejected_unchanged(&missing, "webp");
        let mut duplicate = webp.clone(); duplicate.splice(start..start, webp[start..end].iter().copied());
        let length = (duplicate.len() - 8) as u32; duplicate[4..8].copy_from_slice(&length.to_le_bytes());
        assert_import_rejected_unchanged(&duplicate, "webp");
        let mut flag_missing = webp; flag_missing[20] &= !0x20;
        assert_import_rejected_unchanged(&flag_missing, "webp");
    }
    #[test] fn four_component_jpeg_is_rejected_before_naive_rgb_conversion() {
        // Four-component SOF, rejected before entropy decode even if tagged RGB.
        let frame = vec![8, 0, 100, 0, 100, 4, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0, 4, 0x11, 0];
        let profile = ColorProfile::new_srgb().encode().unwrap();
        let bytes = jpeg_with_segments(&[icc_segment(1, 1, &profile), (0xc0, frame.clone())]);
        assert_import_rejected_unchanged(&bytes, "jpg");
        assert_import_rejected_unchanged(&jpeg_with_segments(&[(0xc0, frame)]), "jpg");
    }
    #[test] fn out_of_order_complete_jpeg_profile_is_accepted() {
        let profile = ColorProfile::new_srgb().encode().unwrap();
        let split = profile.len() / 2;
        let bytes = jpeg_with_segments(&[icc_segment(2, 2, &profile[split..]), icc_segment(1, 2, &profile[..split])]);
        let dir = fixture_dir(); let path = dir.join("ordered.jpg"); fs::write(&path, &bytes).unwrap();
        assert_eq!(load(&path).unwrap().dimensions(), (100, 100));
        assert_eq!(fs::read(&path).unwrap(), bytes); fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn display_p3_webp_import_converts_rgb_and_keeps_alpha() {
        let pixels = image::RgbaImage::from_pixel(4, 2, image::Rgba([180, 90, 60, 71]));
        let mut bytes = Vec::new(); let mut encoder = WebPEncoder::new_lossless(&mut bytes);
        encoder.set_icc_profile(ColorProfile::new_display_p3().encode().unwrap()).unwrap();
        encoder.write_image(&pixels, 4, 2, image::ExtendedColorType::Rgba8).unwrap();
        let dir = fixture_dir(); let path = dir.join("p3.webp"); fs::write(&path, &bytes).unwrap();
        let loaded = load(&path).unwrap().to_rgba8();
        // Display-P3 matrix with the sRGB transfer curve gives approximately [194, 83, 49].
        let pixel = loaded.get_pixel(0, 0).0;
        for (actual, expected) in pixel[..3].iter().zip([194u8, 83, 49]) { assert!(actual.abs_diff(expected) <= 2, "{pixel:?}"); }
        assert_eq!(pixel[3], 71);
        assert_eq!(fs::read(&path).unwrap(), bytes); fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn untagged_pixels_are_unchanged() {
        let pixels = image::RgbaImage::from_fn(8, 3, |x, y| image::Rgba([x as u8 * 30, y as u8 * 90, 61, 81]));
        let dir = fixture_dir(); let path = dir.join("untagged.png");
        pixels.save(&path).unwrap(); assert_eq!(load(&path).unwrap().to_rgba8(), pixels);
        fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn sixteen_bit_decode_buffer_limit_is_checked_before_allocation() {
        let mut bytes = b"\x89PNG\r\n\x1a\n".to_vec();
        let mut header = 8000u32.to_be_bytes().to_vec(); header.extend_from_slice(&5000u32.to_be_bytes());
        header.extend_from_slice(&[16, 6, 0, 0, 0]); // RGBA16: 320 MB decoded.
        bytes.extend(png_chunk(b"IHDR", &header));
        bytes.extend(png_chunk(b"IDAT", &[0x78, 0x9c, 3, 0, 0, 0, 0, 1]));
        bytes.extend(png_chunk(b"IEND", &[]));
        let dir = fixture_dir(); let path = dir.join("large.png"); fs::write(&path, &bytes).unwrap();
        assert!(load(&path).unwrap_err().contains("256 MiB"));
        assert_eq!(fs::read(&path).unwrap(), bytes); fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn all_exif_orientations_are_applied_once_and_removed_from_derivatives() {
        let pixels = image::RgbaImage::from_fn(3, 2, |x, y| image::Rgba([((y * 3 + x + 1) * 30) as u8, 70, 100, 170]));
        let expected = [[1,2,3,4,5,6], [3,2,1,6,5,4], [6,5,4,3,2,1], [4,5,6,1,2,3],
            [1,4,2,5,3,6], [4,1,5,2,6,3], [6,3,5,2,4,1], [3,6,2,5,1,4]];
        let dir = fixture_dir(); let path = dir.join("oriented.png");
        for orientation in 1u8..=8 {
            let mut exif = b"II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x01\0\0\0\0\0\0\0".to_vec();
            exif[18] = orientation;
            let mut bytes = Vec::new(); let mut encoder = PngEncoder::new(&mut bytes);
            encoder.set_icc_profile(ColorProfile::new_srgb().encode().unwrap()).unwrap();
            encoder.set_exif_metadata(exif).unwrap();
            encoder.write_image(&pixels, 3, 2, image::ExtendedColorType::Rgba8).unwrap(); fs::write(&path, &bytes).unwrap();
            let loaded = load(&path).unwrap(); let dimensions = if orientation < 5 { (3,2) } else { (2,3) };
            assert_eq!(loaded.dimensions(), dimensions);
            let labels: Vec<u8> = loaded.to_rgba8().pixels().map(|p| p[0] / 30).collect();
            assert_eq!(labels, expected[(orientation - 1) as usize], "Orientation {orientation}");
            let mut o = options(); o.width = dimensions.0; o.height = dimensions.1;
            let result = export(&path, &dir, &o).unwrap();
            assert_eq!(load(Path::new(&result.path)).unwrap().to_rgba8(), loaded.to_rgba8());
            let mut decoder = ImageReader::open(&result.path).unwrap().into_decoder().unwrap();
            assert!(decoder.exif_metadata().unwrap().is_none()); assert!(decoder.xmp_metadata().unwrap().is_none()); assert!(decoder.iptc_metadata().unwrap().is_none());
            assert_eq!(decoder.orientation().unwrap(), image::metadata::Orientation::NoTransforms);
            assert_eq!(fs::read(&path).unwrap(), bytes); fs::remove_file(result.path).unwrap();
        }
        fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn srgb_tagged_input_preserves_pixels_and_alpha() {
        let pixels = image::RgbaImage::from_fn(5, 3, |x, y| image::Rgba([40 + x as u8 * 30, 60 + y as u8 * 25, 100, x as u8 * 50]));
        let dir = fixture_dir(); let path = dir.join("srgb.png");
        let data = tagged_png(&pixels, ColorProfile::new_srgb().encode().unwrap()); fs::write(&path, &data).unwrap();
        let loaded = load(&path).unwrap().to_rgba8();
        for (source, converted) in pixels.pixels().zip(loaded.pixels()) {
            for channel in 0..3 { assert!(source[channel].abs_diff(converted[channel]) <= 1); }
            assert_eq!(source[3], converted[3]);
        }
        assert_eq!(fs::read(&path).unwrap(), data); fs::remove_file(path).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn adobe_rgb_preview_and_exports_are_converted_without_overwriting() {
        let dir = fixture_dir(); let source = dir.join("camera.png");
        let pixels = image::RgbaImage::from_pixel(120, 80, image::Rgba([128, 96, 64, 170]));
        let original = tagged_png(&pixels, ColorProfile::new_adobe_rgb().encode().unwrap()); fs::write(&source, &original).unwrap();
        let loaded = load(&source).unwrap();
        // Independent Adobe RGB (1998) gamma/matrix -> sRGB reference, rounded to 8 bits.
        let converted = loaded.to_rgba8().get_pixel(0, 0).0;
        for (actual, expected) in converted[..3].iter().zip([140u8, 96, 60]) { assert!(actual.abs_diff(expected) <= 2, "{converted:?}"); }
        assert_eq!(converted[3], 170); assert_ne!(converted[..3], [128, 96, 64]);
        let preview = image::load_from_memory(&thumbnail(&loaded).unwrap()).unwrap().to_rgba8();
        assert_eq!(preview.get_pixel(40, 40).0, converted);
        let mut o = options();
        for format in ["png", "webp", "jpeg"] {
            o.format = format.into(); o.uottawa = false; o.background = Some([255; 3]); o.quality = 95;
            let a = export(&source, &dir, &o).unwrap(); let b = export(&source, &dir, &o).unwrap(); assert_ne!(a.path, b.path);
            let output = load(Path::new(&a.path)).unwrap(); assert_eq!(output.dimensions(), (80, 80));
            if format != "jpeg" { assert_eq!(output.to_rgba8().get_pixel(40, 40).0, converted); }
            assert_eq!(fs::read(&source).unwrap(), original);
            fs::remove_file(a.path).unwrap(); fs::remove_file(b.path).unwrap();
        }
        fs::remove_file(source).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn malformed_and_unsupported_profiles_fail_without_writing_exports() {
        let dir = fixture_dir(); let source = dir.join("bad.png"); let pixels = image::RgbaImage::from_pixel(100, 100, image::Rgba([128, 96, 64, 255]));
        let mut cmyk = ColorProfile::new_srgb().encode().unwrap(); cmyk[16..20].copy_from_slice(b"CMYK");
        let mut link = ColorProfile::new_srgb().encode().unwrap(); link[12..16].copy_from_slice(b"link");
        for profile in [b"not an ICC profile".to_vec(), cmyk, link] {
            let original = tagged_png(&pixels, profile); fs::write(&source, &original).unwrap();
            let error = export(&source, &dir, &options()).err().unwrap(); assert!(error.contains("ICC")); assert!(error.contains("Convert a copy to sRGB"));
            assert_eq!(fs::read(&source).unwrap(), original); assert_eq!(fs::read_dir(&dir).unwrap().count(), 1);
        }
        fs::remove_file(source).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn sixteen_bit_rgb_profile_conversion_keeps_precision_and_alpha() {
        let pixels = image::ImageBuffer::<image::Rgba<u16>, Vec<u16>>::from_pixel(2, 2, image::Rgba([32896, 24672, 16448, 12345]));
        let mut img = DynamicImage::ImageRgba16(pixels);
        convert_to_srgb(&mut img, &ColorProfile::new_adobe_rgb().encode().unwrap()).unwrap();
        let pixel = img.as_rgba16().unwrap().get_pixel(0, 0).0;
        assert_eq!(pixel[3], 12345); assert!(pixel[0] > 35000); assert!(pixel[2] < 16448);
    }
    #[test] fn split_jpeg_icc_and_exif_use_the_same_load_for_preview_and_export() {
        let dir = fixture_dir(); let source = dir.join("camera.jpg");
        let pixels = DynamicImage::ImageRgb8(image::RgbImage::from_pixel(120, 80, image::Rgb([128, 96, 64])));
        // Make an untagged JPEG, then insert a multi-segment Adobe RGB profile.
        let mut clean = Vec::new(); JpegEncoder::new_with_quality(&mut clean, 100).encode_image(&pixels).unwrap();
        let profile = ColorProfile::new_adobe_rgb().encode().unwrap();
        let mut original = vec![0xff, 0xd8];
        for (i, segment) in profile.chunks(profile.len().div_ceil(2)).enumerate() {
            let mut payload = b"ICC_PROFILE\0".to_vec(); payload.extend_from_slice(&[i as u8 + 1, 2]); payload.extend_from_slice(segment);
            original.extend_from_slice(&[0xff, 0xe2]); original.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes()); original.extend_from_slice(&payload);
        }
        let exif = b"Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x06\0\0\0\0\0\0\0";
        original.extend_from_slice(&[0xff, 0xe1]); original.extend_from_slice(&((exif.len() + 2) as u16).to_be_bytes()); original.extend_from_slice(exif); original.extend_from_slice(&clean[2..]);
        fs::write(&source, &original).unwrap();
        let loaded = load(&source).unwrap(); assert_eq!(loaded.dimensions(), (80, 120));
        let converted = loaded.to_rgb8().get_pixel(40, 40).0; assert!(converted[0] > 135); assert!(converted[2] < 64);
        let preview = image::load_from_memory(&thumbnail(&loaded).unwrap()).unwrap(); assert_eq!(preview.dimensions(), (80, 120));
        let result = export(&source, &dir, &options()).unwrap(); let output = load(Path::new(&result.path)).unwrap(); assert_eq!(output.dimensions(), (80, 80)); assert_eq!(output.to_rgb8().get_pixel(40, 40).0, converted);
        assert_eq!(fs::read(&source).unwrap(), original);
        fs::remove_file(result.path).unwrap(); fs::remove_file(source).unwrap(); fs::remove_dir(dir).unwrap();
    }
    #[test] fn embedded_exif_orientation_is_applied_on_load() {
        let img = DynamicImage::new_rgb8(120, 80);
        let jpeg = encode(&img, "jpeg", 90).unwrap();
        // Synthetic EXIF: little-endian TIFF, one SHORT Orientation=6 (rotate 90).
        let payload = b"Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x06\0\0\0\0\0\0\0";
        let mut oriented = vec![0xff, 0xd8, 0xff, 0xe1];
        oriented.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes());
        oriented.extend_from_slice(payload); oriented.extend_from_slice(&jpeg[2..]);
        let path = std::env::temp_dir().join(format!("prep-orientation-{}-{}.jpg", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let mut file = OpenOptions::new().write(true).create_new(true).open(&path).unwrap(); file.write_all(&oriented).unwrap(); drop(file);
        let decoded = load(&path); fs::remove_file(&path).unwrap();
        assert_eq!(decoded.unwrap().dimensions(), (80, 120));
    }
}
