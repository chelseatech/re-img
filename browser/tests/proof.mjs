import fs from 'node:fs'; import assert from 'node:assert/strict'; import {inflateSync} from 'node:zlib';
import {execute} from '../public/engine/abi.mjs';
const dir=process.argv[2];
const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
const result=execute(instance.exports,fs.readFileSync(`${dir}/source.png`),JSON.parse(fs.readFileSync(`${dir}/request.json`)));
assert.deepEqual(result.meta,JSON.parse(fs.readFileSync(`${dir}/native.json`)));
function chunks(b){const out={};for(let i=8;i<b.length;){const n=b.readUInt32BE(i),k=b.toString('ascii',i+4,i+8);(out[k]??=[]).push(b.subarray(i+8,i+8+n));i+=n+12;}return out;}
const a=chunks(Buffer.from(result.data)),b=chunks(fs.readFileSync(`${dir}/native.png`));
assert.deepEqual(inflateSync(Buffer.concat(a.IDAT)),inflateSync(Buffer.concat(b.IDAT)));
const profile=x=>{const p=inflateSync(x.iCCP[0].subarray(x.iCCP[0].indexOf(0)+2));p.fill(0,24,36);return p;};
assert.deepEqual(profile(a),profile(b));
console.log('PASS: Adobe RGB PNG, alpha, crop — native/WASM pixels and ICC identical apart from profile creation time');
