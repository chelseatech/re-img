use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
pub struct Request { pub options: prep_core::Options, pub mode: String, pub fit: String }

pub fn execute(bytes: &[u8], request: &str) -> Result<(serde_json::Value, Vec<u8>), String> {
    let req: Request = serde_json::from_str(request).map_err(|e| e.to_string())?;
    let img = prep_core::load_bytes(bytes)?;
    if req.mode == "preview" || req.mode == "detail" {
        let bytes = if req.mode == "detail" { prep_core::encode(&img,"png",100)? } else { prep_core::thumbnail(&img)? };
        return Ok((json!({"width":img.width(),"height":img.height(),"alpha":prep_core::has_alpha(&img)}), bytes));
    }
    if req.mode != "export" { return Err("Unknown operation".into()); }
    let mut options = req.options;
    options.uottawa = false;
    let (out, warning) = match req.fit.as_str() {
        "crop" => prep_core::prepare(&img,&options)?,
        "contain" => prep_core::prepare_contain(&img,&options)?,
        _ => return Err("Unknown fit mode".into()),
    };
    let (data, quality) = prep_core::fit_bytes(&out, &options)?;
    Ok((json!({"width":out.width(),"height":out.height(),"quality":quality,"warning":warning}), data))
}

// Small explicit byte ABI: no filesystem or network imports; execution is in a Worker.
#[no_mangle]
pub extern "C" fn allocate(length: usize) -> *mut u8 {
    let data = vec![0u8; length].into_boxed_slice(); Box::into_raw(data) as *mut u8
}
#[no_mangle]
pub unsafe extern "C" fn release(ptr: *mut u8, length: usize) {
    drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, length)));
}
#[no_mangle]
pub unsafe extern "C" fn process(ptr: *const u8, length: usize, request: *const u8, request_len: usize) -> *mut u8 {
    let input = std::slice::from_raw_parts(ptr, length);
    let request = std::str::from_utf8(std::slice::from_raw_parts(request, request_len));
    let (meta, data) = match request.map_err(|e| e.to_string()).and_then(|r| execute(input,r)) {
        Ok(value) => value, Err(error) => (json!({"error":error}),vec![])
    };
    let header = serde_json::to_vec(&meta).unwrap();
    let mut packet = Vec::with_capacity(8 + header.len() + data.len());
    packet.extend_from_slice(&((8 + header.len() + data.len()) as u32).to_le_bytes());
    packet.extend_from_slice(&(header.len() as u32).to_le_bytes());
    packet.extend(header); packet.extend(data);
    Box::into_raw(packet.into_boxed_slice()) as *mut u8
}
