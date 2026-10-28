import fs from 'node:fs';import assert from 'node:assert/strict';import {execute} from '../public/engine/abi.mjs';
const dir=process.argv[2],cases=JSON.parse(fs.readFileSync(`${dir}/cases.json`));const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
for(const c of cases){const source=fs.readFileSync(`${dir}/${c.id}-source.bin`);if(c.error){assert.throws(()=>execute(instance.exports,source,c.request),{message:c.error});}else{const r=execute(instance.exports,source,c.request);assert.deepEqual(r.meta,c.meta,c.id);fs.writeFileSync(`${dir}/${c.id}-wasm.bin`,r.data);}}
console.log(`PASS: ${cases.length} native/WASM metadata, malformed input and byte-cap outcomes match`);
