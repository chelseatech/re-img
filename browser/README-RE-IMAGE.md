# RE-IMAGE

Browser application in `browser/`; the existing Tauri desktop interface remains in `src/` and `src-tauri/`.

The Web Worker runs the real `prep-core` Rust engine via `crates/prep-wasm`. Image bytes and filenames stay on-device. `/api/preferences` accepts only deliberately saved preset/settings records, authenticates each operation with Sites identity, and isolates D1 records by the stable Site user ID. Optimistic revisions reject concurrent overwrites. Generic presets only.

## Build

Rust 1.88+ with the wasm32-unknown-unknown target:

```text
cargo test --locked --manifest-path crates/prep-core/Cargo.toml
cargo build --locked --release --target wasm32-unknown-unknown --manifest-path crates/prep-wasm/Cargo.toml
```

Copy `crates/prep-wasm/target/wasm32-unknown-unknown/release/prep_wasm.wasm` to `browser/public/engine/prep_wasm.wasm`. The binary is tracked so Sites can build without a Rust runtime.

Use the current Sites skill for dependency installation, migrations, build, source synchronization and owner-private deployment. On Lappy, Cloudflare workerd requires x64 Node; an isolated portable x64 Node works under Windows ARM emulation. The system ARM64 Node cannot install workerd. If a Windows npm shell shim resolves npm relative to the checkout, call the portable runtime's npm JavaScript entrypoint directly.

## Engine proof

```text
cargo run --locked --manifest-path crates/prep-wasm/Cargo.toml --example proof -- browser/work/proof
cd browser
node tests/proof.mjs work/proof
```

The synthetic Adobe RGB PNG proof compares actual native and WASM compressed-pixel scanlines and output ICC data. Only the ICC creation timestamp differs across native and WASM; profile colour data is identical. No personal photo fixtures are used.

## Validation

Native engine: 28 tests passed; 61 native/WASM outcome comparisons and 48 pixel-identical decoded outputs passed. The production build, TypeScript check, authenticated local D1 persistence/user isolation and Chrome batch/keyboard/responsive/download checks passed. See the repository root RE_IMAGE_VALIDATION.md for the complete evidence and limits. Publication uses an owner-private Sites audience. No public sharing or paid services are used. Actual Safari and real two-device hosted sync remain owner acceptance checks.
