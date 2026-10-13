use image::{ImageEncoder,DynamicImage,codecs::{png::PngEncoder,jpeg::JpegEncoder,webp::WebPEncoder}};
use moxcms::ColorProfile;use serde_json::{json,Value};use std::{fs,path::PathBuf};
fn tagged(p:&image::RgbaImage,icc:Option<Vec<u8>>,orientation:u8)->Vec<u8>{
 let mut b=vec![];let mut e=PngEncoder::new(&mut b);if let Some(i)=icc{e.set_icc_profile(i).unwrap();}
 if orientation>0{let mut exif=b"II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x01\0\0\0\0\0\0\0".to_vec();exif[18]=orientation;e.set_exif_metadata(exif).unwrap();}
 e.write_image(p,p.width(),p.height(),image::ExtendedColorType::Rgba8).unwrap();b
}
fn main(){let args:Vec<String>=std::env::args().collect();let dir=PathBuf::from(&args[1]);
 if args.get(2).is_some_and(|a|a=="verify") {let cases:Vec<Value>=serde_json::from_slice(&fs::read(dir.join("cases.json")).unwrap()).unwrap();let mut count=0;
 for c in cases {if c.get("error").is_some(){continue;}let id=c["id"].as_str().unwrap();let native=image::load_from_memory(&fs::read(dir.join(format!("{id}-native.bin"))).unwrap()).unwrap();let wasm=image::load_from_memory(&fs::read(dir.join(format!("{id}-wasm.bin"))).unwrap()).unwrap();assert_eq!((native.width(),native.height()),(wasm.width(),wasm.height()),"{id}");assert_eq!(native.to_rgba8(),wasm.to_rgba8(),"{id}");count+=1;}println!("PASS: {count} native/WASM decoded outputs pixel-identical");return;}
 fs::create_dir_all(&dir).unwrap();let pixels=image::RgbaImage::from_fn(12,8,|x,y|image::Rgba([30+x as u8*15,40+y as u8*20,90,40+x as u8*15]));
 let opts=json!({"width":8,"height":8,"max_bytes":null,"format":"png","quality":85,"background":[255,255,255],"center_x":0.5,"center_y":0.5,"zoom":1.0,"allow_smaller":true,"uottawa":false});let mut sources=vec![];
 for (name,profile) in [("untagged",None),("srgb",Some(ColorProfile::new_srgb().encode().unwrap())),("adobe",Some(ColorProfile::new_adobe_rgb().encode().unwrap())),("p3",Some(ColorProfile::new_display_p3().encode().unwrap()))]{sources.push((name.to_string(),tagged(&pixels,profile,0)));}
 for n in 1..=8 {sources.push((format!("orientation-{n}"),tagged(&pixels,Some(ColorProfile::new_srgb().encode().unwrap()),n)));}
 sources.push(("bad-profile".into(),tagged(&pixels,Some(b"broken profile".to_vec()),0)));
 let mut bad=ColorProfile::new_srgb().encode().unwrap();bad[16..20].copy_from_slice(b"CMYK");sources.push(("unsupported-cmyk-profile".into(),tagged(&pixels,Some(bad),0)));
 let mut bad=ColorProfile::new_srgb().encode().unwrap();bad[..4].copy_from_slice(&132u32.to_be_bytes());sources.push(("bad-profile-size".into(),tagged(&pixels,Some(bad),0)));
 let mut jpg=vec![];let mut e=JpegEncoder::new_with_quality(&mut jpg,95);e.set_icc_profile(ColorProfile::new_adobe_rgb().encode().unwrap()).unwrap();e.encode_image(&DynamicImage::ImageRgb8(DynamicImage::ImageRgba8(pixels.clone()).to_rgb8())).unwrap();sources.push(("adobe-jpeg".into(),jpg));
 let mut webp=vec![];let mut e=WebPEncoder::new_lossless(&mut webp);e.set_icc_profile(ColorProfile::new_display_p3().encode().unwrap()).unwrap();e.write_image(&pixels,12,8,image::ExtendedColorType::Rgba8).unwrap();sources.push(("p3-webp".into(),webp));
 let p16=image::ImageBuffer::<image::Rgba<u16>,Vec<u16>>::from_pixel(4,2,image::Rgba([32896,24672,16448,12345]));let mut b16=vec![];let mut e=PngEncoder::new(&mut b16);e.set_icc_profile(ColorProfile::new_adobe_rgb().encode().unwrap()).unwrap();e.write_image(bytemuck_bytes(p16.as_raw()),4,2,image::ExtendedColorType::Rgba16).unwrap();sources.push(("adobe-16bit".into(),b16));
 sources.push(("malformed".into(),b"not an image".to_vec()));let mut cases=vec![];
 for (name,source) in sources {for format in ["png","jpeg","webp"]{let id=format!("{name}-{format}");let mut o=opts.clone();o["format"]=json!(format);let request=json!({"mode":"export","fit":"crop","options":o});let result=prep_wasm::execute(&source,&request.to_string());fs::write(dir.join(format!("{id}-source.bin")),&source).unwrap();let mut case=json!({"id":id,"request":request});match result{Ok((meta,data))=>{case["meta"]=meta;fs::write(dir.join(format!("{id}-native.bin")),data).unwrap();},Err(error)=>case["error"]=json!(error)}cases.push(case);}}
 let source=tagged(&pixels,None,0);for (id,fit,w,h,cap) in [("no-upscale","crop",1600,900,None),("contain","contain",1600,900,None),("impossible-cap","crop",8,8,Some(1)),("zoom","crop",8,8,None)]{let mut o=opts.clone();o["width"]=json!(w);o["height"]=json!(h);o["max_bytes"]=json!(cap);if id=="zoom"{o["zoom"]=json!(3);o["center_x"]=json!(1);o["center_y"]=json!(0);}let request=json!({"mode":"export","fit":fit,"options":o});let mut c=json!({"id":id,"request":request});fs::write(dir.join(format!("{id}-source.bin")),&source).unwrap();match prep_wasm::execute(&source,&request.to_string()){Ok((meta,data))=>{c["meta"]=meta;fs::write(dir.join(format!("{id}-native.bin")),data).unwrap();},Err(error)=>c["error"]=json!(error)}cases.push(c);}
 fs::write(dir.join("cases.json"),serde_json::to_vec_pretty(&cases).unwrap()).unwrap();println!("Generated {} cases",cases.len());
}
fn bytemuck_bytes(p:&[u16])->&[u8]{unsafe{std::slice::from_raw_parts(p.as_ptr() as *const u8,p.len()*2)}}
