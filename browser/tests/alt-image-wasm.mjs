// Real source-image engine: a zoomed analysis crop keeps detail while CMS output stays exact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {execute} from '../public/engine/abi.mjs';
import {altAnalysisSettings} from '../lib/alt-image.mjs';
const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
const source=await sharp({create:{width:2000,height:1000,channels:3,background:'#0000ff'}}).png().toBuffer();
const options={width:80,height:80,format:'jpeg',quality:95,background:[255,255,255],center_x:1,center_y:.5,zoom:4,allow_smaller:true,uottawa:false,max_bytes:null};
const analysis=execute(instance.exports,source,{mode:'export',fit:'crop',options:altAnalysisSettings(options)});
const exported=execute(instance.exports,source,{mode:'export',fit:'crop_exact',options});
assert.deepEqual([analysis.meta.width,analysis.meta.height],[250,250],'retain all pixels of the zoomed source crop');
assert.equal((await sharp(analysis.data).metadata()).format,'png');
assert.deepEqual([exported.meta.width,exported.meta.height],[80,80],'university output dimensions remain unchanged');
assert.equal((await sharp(exported.data).metadata()).format,'jpeg');
console.log('PASS actual WASM: 250px source detail after zoom, lossless AI input, unchanged 80px JPEG export.');
