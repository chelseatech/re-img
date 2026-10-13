import {test} from 'node:test';import assert from 'node:assert/strict';
import {filename,dimensions} from '../lib/naming.mjs';import {starters,cleanPayload} from '../lib/preferences.mjs';import {zip} from '../lib/zip.mjs';
test('actual dimensions, Unicode, reserved paths and safe case-insensitive collisions',()=>{
const used=new Set();assert.equal(filename('{name}-{width}x{height}.{format}','photo.JPG',20,10,'jpeg','Wide',1,used),'photo-20x10.jpg');assert.equal(filename('{name}-{width}x{height}.{format}','PHOTO.png',20,10,'jpeg','Wide',2,used),'PHOTO-20x10-2.jpg');assert.equal(filename('{name}.{format}','../../CON.png',1,1,'png','x',1),'image-CON.png');assert.equal(filename('{name}-{preset}-{sequence}.{format}','été 🦆.jpeg',1,1,'webp','Hero / banner',2),'été-Hero-banner-02.webp');assert.equal(filename('{name}.{format}','.png',1,1,'png','x',1),'image.png');
assert.deepEqual(dimensions(20,10,starters[0]),[17,9]);assert.deepEqual(dimensions(20,10,{...starters[0],fit:'contain'}),[20,10]);
});
test('sync accepts only whitelisted recipe/settings fields',()=>{
const body={revision:0,presets:starters,selected:'wide'};assert.equal(cleanPayload(body).presets.length,3);for(const extra of [{file:'secret.jpg'},{userId:'another'},{imageBytes:[1]},{path:'C:/private'}])assert.throws(()=>cleanPayload({...body,...extra}));assert.throws(()=>cleanPayload({...body,presets:[{...starters[0],width:NaN}]}));assert.throws(()=>cleanPayload({...body,presets:[{...starters[0],naming:'{secret}'}]}));
});
test('ZIP stores UTF8 names and original bytes with CRC and valid directory',async()=>{
const b=new Uint8Array(await zip([{name:'été.png',bytes:new Uint8Array([1,2,3])}]).arrayBuffer());const v=new DataView(b.buffer);assert.equal(v.getUint32(0,true),0x04034b50);assert.equal(v.getUint16(6,true),0x800);assert.equal(v.getUint32(b.length-22,true),0x06054b50);assert.equal(v.getUint16(b.length-14,true),1);assert.equal(v.getUint32(14,true),0x55bc801d);
});
