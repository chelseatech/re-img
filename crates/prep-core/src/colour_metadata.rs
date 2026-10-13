//! Check colour metadata envelopes before permissive image decoders can discard
//! malformed ICC chunks and make a tagged image look like untagged sRGB.
use std::io::{Cursor, Read, Seek, SeekFrom};

struct Source<'a> {
    reader: Cursor<&'a [u8]>,
    length: u64,
}

impl Source<'_> {
    fn read<const N: usize>(&mut self) -> Result<[u8; N], String> {
        let mut bytes = [0; N];
        self.reader.read_exact(&mut bytes).map_err(|e| e.to_string())?;
        Ok(bytes)
    }

    fn skip(&mut self, length: u64) -> Result<(), String> {
        let end = self.reader.stream_position().map_err(|e| e.to_string())?
            .checked_add(length).ok_or("Invalid metadata length")?;
        if end > self.length { return Err("Truncated image metadata".into()); }
        self.reader.seek(SeekFrom::Start(end)).map_err(|e| e.to_string())?;
        Ok(())
    }
}

pub(super) fn has_icc(bytes: &[u8], format: image::ImageFormat) -> Result<bool, String> {
    let mut source = Source { reader: Cursor::new(bytes), length: bytes.len() as u64 };
    match format {
        image::ImageFormat::Jpeg => jpeg(&mut source),
        image::ImageFormat::Png => png(&mut source),
        image::ImageFormat::WebP => webp(&mut source),
        _ => Ok(false),
    }
}

fn jpeg(source: &mut Source) -> Result<bool, String> {
    if source.read::<2>()? != [0xff, 0xd8] { return Err("Invalid JPEG header".into()); }
    let mut expected = None;
    let mut sequences = [false; 256];
    let mut found = 0;
    loop {
        if source.read::<1>()? != [0xff] { return Err("Invalid JPEG marker".into()); }
        let mut marker = source.read::<1>()?[0];
        while marker == 0xff { marker = source.read::<1>()?[0]; }
        if marker == 0xda || marker == 0xd9 { break; } // Start of scan / end of image.
        if marker == 0x01 || (0xd0..=0xd8).contains(&marker) { continue; }
        let size = u16::from_be_bytes(source.read::<2>()?).checked_sub(2)
            .ok_or("Invalid JPEG segment length")? as u64;
        if marker == 0xe2 && size >= 12 {
            let signature = source.read::<12>()?;
            if &signature == b"ICC_PROFILE\0" {
                if size < 15 { return Err("Empty or truncated JPEG ICC segment".into()); }
                let [sequence, count] = source.read::<2>()?;
                if count == 0 || sequence == 0 || sequence > count
                    || expected.is_some_and(|value| value != count)
                    || sequences[sequence as usize] {
                    return Err("Inconsistent or duplicate JPEG ICC segments".into());
                }
                expected = Some(count);
                sequences[sequence as usize] = true;
                found += 1;
                source.skip(size - 14)?;
            } else { source.skip(size - 12)?; }
        } else if (0xc0..=0xcf).contains(&marker) && ![0xc4, 0xc8, 0xcc].contains(&marker) {
            if size < 6 { return Err("Truncated JPEG frame header".into()); }
            let header = source.read::<6>()?;
            // image's JPEG decoder converts CMYK/YCCK into RGB before exposing
            // pixels, and does not expose the original channel count. Reject
            // here even when there is no profile or an incorrectly attached RGB profile.
            if header[5] == 4 { return Err("CMYK/YCCK JPEG colour conversion is not supported".into()); }
            source.skip(size - 6)?;
        } else { source.skip(size)?; }
    }
    if expected.is_some_and(|count| found != count as usize) {
        return Err("Missing JPEG ICC segments".into());
    }
    Ok(expected.is_some())
}

fn png(source: &mut Source) -> Result<bool, String> {
    if source.read::<8>()? != *b"\x89PNG\r\n\x1a\n" { return Err("Invalid PNG header".into()); }
    let mut has_icc = false;
    let mut saw_pixels = false;
    loop {
        let size = u32::from_be_bytes(source.read::<4>()?) as u64;
        let kind = source.read::<4>()?;
        if &kind == b"iCCP" {
            if has_icc || saw_pixels { return Err("Duplicate or misplaced PNG ICC profile".into()); }
            has_icc = true;
        }
        saw_pixels |= &kind == b"IDAT";
        source.skip(size + 4)?; // Data and CRC; the decoder validates/decompresses the chunk.
        if &kind == b"IEND" { return Ok(has_icc); }
    }
}

fn webp(source: &mut Source) -> Result<bool, String> {
    if source.read::<4>()? != *b"RIFF" { return Err("Invalid WebP header".into()); }
    let end = u32::from_le_bytes(source.read::<4>()?) as u64 + 8;
    if source.read::<4>()? != *b"WEBP" || end != source.length { return Err("Invalid WebP length".into()); }
    let mut has_icc = false;
    let mut declares_icc = false;
    let mut saw_extended_header = false;
    while source.reader.stream_position().map_err(|e| e.to_string())? < end {
        let kind = source.read::<4>()?;
        let size = u32::from_le_bytes(source.read::<4>()?) as u64;
        if &kind == b"ICCP" {
            if has_icc || size == 0 { return Err("Duplicate or empty WebP ICC profile".into()); }
            has_icc = true;
        }
        if &kind == b"VP8X" && size > 0 {
            if saw_extended_header { return Err("Duplicate WebP extended header".into()); }
            saw_extended_header = true;
            declares_icc = source.read::<1>()?[0] & 0x20 != 0;
            source.skip(size - 1 + size % 2)?;
        } else { source.skip(size + size % 2)?; }
    }
    if declares_icc != has_icc { return Err("Inconsistent WebP ICC flag and profile".into()); }
    Ok(has_icc)
}

pub(super) fn validate_profile_size(icc: &[u8]) -> Result<(), String> {
    if icc.len() < 132 || u32::from_be_bytes(icc[..4].try_into().unwrap()) as usize != icc.len() {
        return Err("Invalid embedded ICC profile size".into());
    }
    let count = u32::from_be_bytes(icc[128..132].try_into().unwrap()) as usize;
    let table_end = count.checked_mul(12).and_then(|n| n.checked_add(132))
        .filter(|&n| n <= icc.len()).ok_or("Invalid embedded ICC tag table")?;
    for tag in icc[132..table_end].chunks_exact(12) {
        let offset = u32::from_be_bytes(tag[4..8].try_into().unwrap()) as usize;
        let size = u32::from_be_bytes(tag[8..12].try_into().unwrap()) as usize;
        if offset < table_end || size < 8
            || offset.checked_add(size).is_none_or(|end| end > icc.len()) {
            return Err("Invalid embedded ICC tag bounds".into());
        }
    }
    Ok(())
}
