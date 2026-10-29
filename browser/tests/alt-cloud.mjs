import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleAltText,readAltGenerationTotal} from '../lib/alt-cloud.mjs';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==','base64'));
function setup(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE ai_generation_totals(id INTEGER PRIMARY KEY,total INTEGER NOT NULL DEFAULT 0); CREATE TABLE ai_daily_usage(day TEXT PRIMARY KEY,requests INTEGER NOT NULL,last_minute INTEGER NOT NULL,minute_requests INTEGER NOT NULL,input_tokens INTEGER NOT NULL DEFAULT 0,output_tokens INTEGER NOT NULL DEFAULT 0)');
 const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){return sqlite.prepare(sql).run(...values);}};}};
 const calls=[],AI={async run(model,input){calls.push({model,input});return {response:'{"en":"Two people embracing beside a pond.","fr":"Deux personnes s’enlacent au bord d’un étang."}',usage:{prompt_tokens:1200,completion_tokens:80}};}};
 return {DB,AI,sqlite,calls};
}
const request=(origin='https://re-img.test',body=png)=>new Request('https://re-img.test/api/alt-text',{method:'POST',headers:{origin,'content-type':'image/png','sec-fetch-site':'same-origin'},body});
test('cloud generation returns both languages and records only aggregate usage',async()=>{
 const env=setup(),r=await handleAltText(request(),env);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{en:'Two people embracing beside a pond.',fr:'Deux personnes s’enlacent au bord d’un étang.'});
 const row=env.sqlite.prepare('SELECT * FROM ai_daily_usage').get();assert.equal(row.requests,1);assert.equal(row.input_tokens,1200);assert.equal(row.output_tokens,80);
 assert.equal(env.calls[0].model,'@cf/meta/llama-4-scout-17b-16e-instruct');
 assert.match(env.calls[0].input.messages[1].content[1].image_url.url,/^data:image\/png;base64,/);assert.ok(env.calls[0].input.max_tokens<=256);
});
test('cross-origin and oversized images cannot reach AI or spend quota',async()=>{
 const env=setup();assert.equal((await handleAltText(request('https://other.test'),env)).status,403);
 assert.equal((await handleAltText(request(undefined,new Uint8Array(3000001)),env)).status,413);
 assert.equal(env.calls.length,0);assert.equal(env.sqlite.prepare('SELECT COUNT(*) n FROM ai_daily_usage').get().n,0);
});
test('daily quota reservation remains bounded across concurrent requests',async()=>{
 const env=setup(),options={dailyLimit:2,minuteLimit:10,now:()=>Date.UTC(2026,9,27)};
 const responses=await Promise.all([1,2,3].map(()=>handleAltText(request(),env,options)));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,200,429]);assert.equal(env.calls.length,2);
 assert.equal(env.sqlite.prepare('SELECT requests FROM ai_daily_usage').get().requests,2);
});
test('failed inference and malformed results keep quota consumed without returning invented text',async()=>{
 const env=setup();env.AI.run=async()=>({response:'not json'});
 const r=await handleAltText(request(),env);assert.equal(r.status,502);assert.equal((await r.json()).error,'generation_failed');
 assert.equal(env.sqlite.prepare('SELECT requests FROM ai_daily_usage').get().requests,1);
});
test('invalid PNG dimensions are rejected before quota allocation',async()=>{
 const env=setup(),image=png.slice();new DataView(image.buffer).setUint32(16,769);
 assert.equal((await handleAltText(request(undefined,image),env)).status,400);assert.equal(env.calls.length,0);
});
test('burst limit resets after one minute and daily usage resets at UTC midnight',async()=>{
 const env=setup();let time=Date.UTC(2026,9,27,23,58);
 const options={dailyLimit:100,minuteLimit:1,now:()=>time};
 assert.equal((await handleAltText(request(),env,options)).status,200);
 assert.equal((await handleAltText(request(),env,options)).status,429);
 time+=60000;assert.equal((await handleAltText(request(),env,options)).status,200);
 time+=60000;assert.equal((await handleAltText(request(),env,options)).status,200);
 const rows=env.sqlite.prepare('SELECT day,requests FROM ai_daily_usage ORDER BY day').all();
 assert.deepEqual(rows.map(row=>[row.day,row.requests]),[['2026-10-27',2],['2026-10-28',1]]);
});

test('alt savings count only validated successful generation uses, and persist separately from quota',async()=>{
 const env=setup();
 assert.deepEqual(await (await readAltGenerationTotal(env)).json(),{total:0});
 await handleAltText(request(),env);
 assert.deepEqual(await (await readAltGenerationTotal(env)).json(),{total:1});
 env.AI.run=async()=>({response:'invalid'});
 await handleAltText(request(),env);
 await handleAltText(request('https://other.test'),env);
 assert.deepEqual(await (await readAltGenerationTotal(env)).json(),{total:1});
 assert.equal(env.sqlite.prepare('SELECT requests FROM ai_daily_usage').get().requests,2);
});
test('unavailable alt counter returns an error rather than a false zero',async()=>{
 assert.equal((await readAltGenerationTotal({DB:{prepare(){throw Error('offline');}}})).status,503);
});
