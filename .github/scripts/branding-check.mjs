import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRESET_STORAGE_KEY } from '../../src/presets.js';
const config=JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json','utf8'));
const credit='Created by Ryan O\u2019Connor';
assert.equal(config.productName,'re-image');
assert.equal(config.app.windows[0].title,'re-image');
assert.equal(config.identifier,'ca.ryan.webimageprep');
assert.equal(PRESET_STORAGE_KEY,'web-image-prep-presets');
assert.match(fs.readFileSync('index.html','utf8'),/<title>re-image<\/title>/);
assert.ok(fs.readFileSync('src/main.js','utf8').includes('<h1>re-image</h1>'));
assert.ok(fs.readFileSync('src/main.js','utf8').includes(credit));
if(process.argv.includes('--built')){
 const assets=fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync('dist/assets/'+f,'utf8')).join('\n');
 assert.ok(assets.includes(credit),'Creator credit is embedded in compiled assets');
 assert.ok(assets.includes('<h1>re-image</h1>'),'Product name is embedded in compiled assets');
}
console.log('PASS: re-image product/UI/creator credit; stable app identifier and preset storage key'+(process.argv.includes('--built')?'; compiled assets verified':''));
