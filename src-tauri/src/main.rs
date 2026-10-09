#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::{collections::HashMap, path::PathBuf, sync::{Mutex, atomic::{AtomicU64, Ordering}}};
use tauri::State;

#[derive(Default)]
struct Registry { paths: Mutex<HashMap<u64, PathBuf>>, next: AtomicU64 }
#[derive(Serialize)]
struct Imported { id: u64, name: String, width: u32, height: u32, bytes: u64, alpha: bool, thumbnail: String, warning: String }

#[tauri::command]
async fn import_image(path: String, state: State<'_, Registry>) -> Result<Imported, String> {
    let source = PathBuf::from(path).canonicalize().map_err(|e| e.to_string())?;
    let copy = source.clone();
    let (width, height, bytes, alpha, thumbnail) = tauri::async_runtime::spawn_blocking(move || {
        let img = prep_core::load(&copy)?;
        Ok::<_, String>((img.width(), img.height(), std::fs::metadata(&copy).map_err(|e| e.to_string())?.len(), prep_core::has_alpha(&img), STANDARD.encode(prep_core::thumbnail(&img)?)))
    }).await.map_err(|e| e.to_string())??;
    let id = state.next.fetch_add(1, Ordering::Relaxed);
    let name = source.file_name().unwrap_or_default().to_string_lossy().into_owned();
    state.paths.lock().map_err(|_| "Image registry unavailable.")?.insert(id, source);
    Ok(Imported { id, name, width, height, bytes, alpha, thumbnail: format!("data:image/png;base64,{thumbnail}"), warning: "Embedded RGB ICC profiles are converted to sRGB. Untagged input is assumed sRGB. Derivatives include an sRGB profile and omit EXIF/GPS.".into() })
}

#[tauri::command]
async fn export_image(id: u64, directory: String, options: prep_core::Options, state: State<'_, Registry>) -> Result<prep_core::ExportResult, String> {
    let source = state.paths.lock().map_err(|_| "Image registry unavailable.")?.get(&id).cloned().ok_or("Import the image first.")?;
    let dir = PathBuf::from(directory).canonicalize().map_err(|e| e.to_string())?;
    tauri::async_runtime::spawn_blocking(move || prep_core::export(&source, &dir, &options)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn forget_image(id: u64, state: State<'_, Registry>) -> Result<(), String> {
    state.paths.lock().map_err(|_| "Image registry unavailable.")?.remove(&id); Ok(())
}

fn main() {
    tauri::Builder::default().plugin(tauri_plugin_dialog::init()).manage(Registry::default())
        .invoke_handler(tauri::generate_handler![import_image, export_image, forget_image])
        .run(tauri::generate_context!()).expect("Could not start Web image prep");
}
