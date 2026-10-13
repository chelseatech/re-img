import assert from 'node:assert/strict';import {starters} from '../lib/preferences.mjs';
const origin=process.argv[2]??'http://127.0.0.1:5180';
const prefix=`qa-${Date.now()}`;
async function req(user,method='GET',body,extra={}){const r=await fetch(`${origin}/api/preferences`,{method,headers:{Origin:origin,'Content-Type':'application/json',...(user?{'oai-authenticated-user-id':`${prefix}-${user}`,'oai-authenticated-user-email':`${user}@sites.test`}:{}),...extra},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
assert.equal((await req()).status,401);
const payload={revision:0,presets:starters,selected:'wide'};
assert.equal((await req('a')).data.revision,0);
const saved=await req('a','PUT',payload);assert.equal(saved.status,200);assert.equal(saved.data.revision,1);
assert.deepEqual((await req('a')).data.presets,saved.data.presets);
assert.equal((await req('b')).data.revision,0);
const changed={...payload,revision:1,presets:starters.map(p=>({...p,width:333}))};
assert.equal((await req('a','PUT',changed)).data.revision,2);
assert.equal((await req('a','PUT',payload)).status,409);
assert.equal((await req('b','PUT',payload)).data.revision,1);
assert.equal((await req('a')).data.presets[0].width,333);
assert.equal((await req('b')).data.presets[0].width,1600);
assert.equal((await req('a','PUT',{...payload,userId:`${prefix}-b`})).status,400);
assert.equal((await req('a','PUT',payload,{Origin:'https://other.example'})).status,403);
console.log('PASS: real local D1 persistence, two-user isolation, anonymous rejection, revision conflicts, user-key injection and origin protection');
