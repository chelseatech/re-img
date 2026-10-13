#!/usr/bin/env bash
set -euo pipefail
set -x
test "$(uname -s)" = Darwin
: "${MAC_TARGET:?}" "${MAC_ARCHITECTURE:?}" "${MAC_BUILD_LABEL:?}" "${RUNNER_TEMP:?}" "${GITHUB_WORKSPACE:?}"

bundle="$CARGO_TARGET_DIR/$MAC_TARGET/release/bundle"
app="$bundle/macos/re-image.app"
test -d "$app"
executable=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$app/Contents/Info.plist")
binary="$app/Contents/MacOS/$executable"
test -x "$binary"
test -f "$app/Contents/Resources/icon.icns"
test "$(lipo -archs "$binary")" = "$MAC_ARCHITECTURE"
shopt -s nullglob
dmgs=("$bundle/dmg/"*.dmg)
test "${#dmgs[@]}" -eq 1
dmg="${dmgs[0]}"
hdiutil verify "$dmg"

output="$GITHUB_WORKSPACE/macos-artifact"
mkdir -p "$output"
name="re-image-0.1.2-macos-$MAC_BUILD_LABEL-unsigned-test"
cp "$dmg" "$output/$name.dmg"
ditto -c -k --sequesterRsrc --keepParent "$app" "$output/$name-app.zip"
mountpoint=$(mktemp -d "$RUNNER_TEMP/web-image-prep-dmg.XXXXXX")
trap 'hdiutil detach "$mountpoint" >/dev/null 2>&1 || true' EXIT
hdiutil attach -readonly -nobrowse -mountpoint "$mountpoint" "$dmg"
mounted="$mountpoint/re-image.app/Contents/MacOS/$executable"
test -x "$mounted"
test "$(lipo -archs "$mounted")" = "$MAC_ARCHITECTURE"
cmp "$mounted" "$binary"
hdiutil detach "$mountpoint"
trap - EXIT

startup=failed
"$binary" >"$output/startup-$MAC_BUILD_LABEL.log" 2>&1 &
app_pid=$!
trap 'kill "$app_pid" >/dev/null 2>&1 || true' EXIT
sleep 15
if kill -0 "$app_pid" 2>/dev/null; then startup=passed; fi
kill "$app_pid" >/dev/null 2>&1 || true
wait "$app_pid" 2>/dev/null || true
trap - EXIT

export PACKAGE_APP="$app" PACKAGE_BINARY="$binary" PACKAGE_DMG="$output/$name.dmg" PACKAGE_ZIP="$output/$name-app.zip" PACKAGE_STARTUP="$startup"
python3 - <<'PY'
import hashlib,json,os,pathlib,plistlib,subprocess
output=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'macos-artifact'
plist=plistlib.loads((pathlib.Path(os.environ['PACKAGE_APP'])/'Contents/Info.plist').read_bytes())
files=[pathlib.Path(os.environ[k]) for k in ('PACKAGE_DMG','PACKAGE_ZIP')]
for p in files:
    if p.stat().st_size>100_000_000: raise SystemExit('Package exceeds 100 MB safety limit')
hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(output/'SHA256SUMS.txt').write_text(''.join(f'{value}  {name}\n' for name,value in hashes.items()))
record={'commit':os.environ['GITHUB_SHA'],'target':os.environ['MAC_TARGET'],'architecture':os.environ['MAC_ARCHITECTURE'],
 'host':subprocess.check_output(['sw_vers'],text=True),'version':plist.get('CFBundleShortVersionString'),
 'minimum_system_version':plist.get('LSMinimumSystemVersion'),'startup_15_seconds':os.environ['PACKAGE_STARTUP'],
 'dmg_verified':True,'mounted_app_matches':True,'distribution':'unsigned tester package','sha256':hashes,
 'not_tested':['Downloaded-file Gatekeeper acceptance','interactive file picker/drop/crop/export','VoiceOver','different Mac hardware/OS versions']}
(output/'VERIFICATION.json').write_text(json.dumps(record,indent=2)+'\n')
(output/'READ-ME-FIRST.txt').write_text('re-image 0.1.2 macOS tester build\n\n'+
 'Choose the package matching Apple Silicon or Intel. The DMG contains the app; the ZIP contains the same .app bundle. Rust is not required to run it.\n\n'+
 'This is an unsigned test package. macOS may block a browser-downloaded copy.\n\n'+
 'It preserves the existing desktop interface and local-only image engine. See VERIFICATION.json for exactly what passed and what remains untested.\n'+
 'Source commit: '+os.environ['GITHUB_SHA']+'\n')
PY
cat "$output/VERIFICATION.json" >> "$GITHUB_STEP_SUMMARY"
test "$startup" = passed
