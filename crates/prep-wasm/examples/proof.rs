use image::{ImageEncoder, codecs::png::PngEncoder};
use moxcms::ColorProfile;
use serde_json::json;
fn main() {
    let dir = std::path::PathBuf::from(std::env::args().nth(1).unwrap()); std::fs::create_dir_all(&dir).unwrap();
    let pixels = image::RgbaImage::from_fn(120,80,|x,y|image::Rgba([x as u8 * 2,y as u8 * 3,64,170]));
    let mut bytes = vec![]; let mut encoder = PngEncoder::new(&mut bytes);
    encoder.set_icc_profile(ColorProfile::new_adobe_rgb().encode().unwrap()).unwrap();
    encoder.write_image(&pixels,120,80,image::ExtendedColorType::Rgba8).unwrap();
    let request = json!({"mode":"export","fit":"crop","options":{"width":80,"height":80,"max_bytes":null,"format":"png","quality":85,"background":null,"center_x":0.5,"center_y":0.5,"zoom":1.0,"allow_smaller":true,"uottawa":false}}).to_string();
    let (meta,data) = prep_wasm::execute(&bytes,&request).unwrap();
    std::fs::write(dir.join("source.png"),bytes).unwrap(); std::fs::write(dir.join("native.png"),data).unwrap();
    std::fs::write(dir.join("request.json"),request).unwrap(); std::fs::write(dir.join("native.json"),meta.to_string()).unwrap();
}
