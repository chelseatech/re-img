// Synthetic reports are permitted ONLY against the loopback preview database.
import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {localQuery,localRun,preferencesSnapshot} from './local-counter-db.mjs';
import {reportDownload} from '../lib/download-count.mjs';import {starters} from '../lib/preferences.mjs';
const origin=process.argv[2]??'http://127.0.0.1:5180';const url=new URL(origin);
assert.ok(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname),'LOCAL ONLY: production events forbidden');
const before=preferencesSnapshot();
const headers={Origin:origin,'Content-Type':'application/json'};
let previewRestarts=0;
async function previewFetch(relative,options={}){
 for(let attempt=0;attempt<4;attempt++){
  const r=await fetch(origin+relative,{...(typeof options==='function'?options():options),redirect:'error'});
  // Retry only Wrangler's identifiable development restart response. Application
  // errors remain test failures; valid POST bodies keep the same dispatch ID.
  if(r.status===503&&(await r.clone().text()).includes('worker restarted mid-request')){previewRestarts++;await new Promise(resolve=>setTimeout(resolve,250));continue;}
  return r;
 }
 throw Error('Local preview kept restarting');
}
const read=async()=>{const r=await previewFetch('/api/downloads');assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);return (await r.json()).total;};
async function post(count,requestId=randomUUID(),extra={}){const r=await previewFetch('/api/downloads',{method:'POST',headers:{...headers,...extra},body:JSON.stringify({requestId,count})});return {status:r.status,data:await r.json(),requestId};}
async function raw(body,extra={},method='POST'){const r=await previewFetch('/api/downloads',{method,headers:{...headers,Connection:'close',...extra},body});return r.status;}
// Permit repeatable local runs without dropping durable IDs or waiting a minute.
localRun('UPDATE download_dispatches SET created_at=?',Date.now()-120000);
const start=await read(),empty=localQuery('SELECT COUNT(*) AS n FROM download_dispatches')[0].n;
if(empty===0)assert.equal(start,0,'fresh empty schema has no fabricated history');
const single=await post(1),zip=await post(3);assert.equal(single.status,200);assert.equal(zip.status,200);assert.equal(await read(),start+4);
// Two independent anonymous clients share the aggregate, with no client identity.
const clientA=async count=>post(count),clientB=async count=>post(count);
assert.equal((await clientA(2)).status,200);assert.equal((await clientB(4)).status,200);assert.equal(await read(),start+10);
const duplicate=randomUUID(),repeated=await Promise.all(Array.from({length:40},()=>post(7,duplicate)));assert.ok(repeated.every(r=>r.status===200));assert.equal(await read(),start+17);
assert.equal((await post(7,duplicate.toUpperCase())).status,200);assert.equal((await post(8,duplicate)).status,409);assert.equal(await read(),start+17);
const counts=Array.from({length:60},(_,n)=>n%5+1),concurrent=await Promise.all(counts.map(count=>post(count)));assert.ok(concurrent.every(r=>r.status===200));assert.equal(await read(),start+17+counts.reduce((a,b)=>a+b,0));
// Lose an actual committed response: helper retry must not add a second event.
const lostId=randomUUID();let attempts=0,reportedTotal,committedResponseDiscarded=false;
await reportDownload(3,value=>{reportedTotal=value;},async(relative,options)=>{const r=await previewFetch(relative,{...options,headers:{...options.headers,Origin:origin}});if(attempts++===0){assert.equal(r.status,200);await r.json();committedResponseDiscarded=true;throw Error('Fixture lost committed response');}return r;},lostId);
assert.equal(committedResponseDiscarded,true);assert.equal(attempts,2);assert.equal(reportedTotal,start+200);assert.equal(await read(),start+200);
const validId=randomUUID(),valid={requestId:validId,count:1},beforeInvalid=await read();
for(const body of [null,[],{}, {...valid,count:0},{...valid,count:51},{...valid,count:1.5},{...valid,count:'1'},{...valid,requestId:'not-a-uuid'},{...valid,requestId:[validId]},{...valid,filename:'must-not-store.png'},{...valid,userId:'must-not-store'}])assert.equal(await raw(JSON.stringify(body)),400);
assert.equal(await raw('{'),400);assert.equal(await raw('x'.repeat(513)),413);assert.equal(await raw(JSON.stringify(valid),{'Content-Type':'text/plain'}),415);assert.equal(await raw(JSON.stringify(valid),{Origin:'https://other.test'}),403);assert.equal(await raw(JSON.stringify(valid),{Origin:''}),403);assert.equal(await raw(JSON.stringify(valid),{'Sec-Fetch-Site':'cross-site'}),403);assert.equal(await raw('{}',{},'PUT'),405);
const chunkResponse=await previewFetch('/api/downloads',()=>({method:'POST',headers,body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(' '.repeat(400)));controller.enqueue(new TextEncoder().encode(' '.repeat(200)));controller.close();}}),duplex:'half'}));assert.equal(chunkResponse.status,413,'stream bounded without Content-Length');assert.equal(await read(),beforeInvalid);
assert.deepEqual(localQuery('PRAGMA table_info(download_dispatches)').map(row=>row.name),['request_id','count','created_at']);
assert.deepEqual(preferencesSnapshot(),before,'all pre-existing owner records unchanged by counter reports');
// Test inconsistent aggregate failures locally, restoring the exact verified value.
const verified=await read(),ledgerSize=localQuery('SELECT COUNT(*) AS n FROM download_dispatches')[0].n;try{
 localRun('DELETE FROM download_totals WHERE id=1');let missing=await previewFetch('/api/downloads');assert.equal(missing.status,503);assert.deepEqual(await missing.json(),{error:'Counter unavailable.'});
 assert.equal((await post(1)).status,503);assert.equal(localQuery('SELECT COUNT(*) AS n FROM download_dispatches')[0].n,ledgerSize);assert.equal(localQuery('SELECT COUNT(*) AS n FROM download_totals')[0].n,0);
 localRun('INSERT INTO download_totals(id,total) VALUES(1,?)',verified);
 for(const invalid of [0,-1,1.5,9007199254740992]){localRun('UPDATE download_totals SET total=? WHERE id=1',invalid);const r=await previewFetch('/api/downloads');assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'Counter unavailable.'});assert.equal((await post(1)).status,503);assert.equal(localQuery('SELECT COUNT(*) AS n FROM download_dispatches')[0].n,ledgerSize);assert.equal(localQuery('SELECT COUNT(*) AS n FROM download_totals WHERE total=?',invalid)[0].n,1);}
}finally{localRun('INSERT INTO download_totals(id,total) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET total=excluded.total',verified);}
assert.equal(await read(),verified);
// Rate-window fixture adjustments touch only the LOCAL counter ledger timestamp.
localRun('UPDATE download_dispatches SET created_at=?',Date.now()-120000);
const intake=await Promise.all(Array.from({length:300},()=>post(1)));assert.equal(intake.filter(r=>r.status===200).length,250);assert.equal(intake.filter(r=>r.status===429).length,50);assert.equal(await read(),verified+250);
assert.equal((await post(7,duplicate)).status,200,'known retry succeeds even when new intake is capped');assert.equal((await post(8,duplicate)).status,409);assert.equal(await read(),verified+250);
// A refreshed rate window can accept new work; never discard durable retry IDs.
localRun('UPDATE download_dispatches SET created_at=?',Date.now()-120000);assert.equal((await post(1)).status,200);assert.equal(await read(),verified+251);
assert.equal(localQuery('SELECT SUM(count) AS n FROM download_dispatches')[0].n,await read(),'atomic aggregate matches every committed ledger row');assert.deepEqual(preferencesSnapshot(),before);
// Owner account fixtures prove counter reports cannot change account payloads.
const prefix='counter-owner-'+randomUUID();
async function owner(id,method='GET',body){const r=await previewFetch('/api/preferences',{method,headers:{...headers,'oai-authenticated-user-id':prefix+'-'+id,'oai-authenticated-user-email':id+'@sites.test'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
try{
 const a=await owner('a','PUT',{revision:0,presets:starters,selected:'wide',language:'fr'}),b=await owner('b','PUT',{revision:0,presets:starters.map(p=>({...p,width:333})),selected:'square',language:'en'});assert.equal(a.status,200);assert.equal(b.status,200);const ownerBefore=preferencesSnapshot();assert.equal((await post(2)).status,200);assert.deepEqual((await owner('a')).data,a.data);assert.deepEqual((await owner('b')).data,b.data);assert.deepEqual(preferencesSnapshot(),ownerBefore);
 assert.equal((await previewFetch('/api/preferences')).status,401);assert.equal((await owner('a','PUT',{revision:0,presets:starters,selected:'wide'})).status,409);
}finally{localRun('DELETE FROM preferences WHERE user_id IN (?,?)',prefix+'-a',prefix+'-b');}
assert.deepEqual(preferencesSnapshot(),before,'only exact new fixture IDs cleaned up; original owner records intact');
console.log(JSON.stringify({scope:'LOCAL ONLY',start,final:await read(),duplicateConcurrentReports:40,uniqueConcurrentReports:60,rateAccepted:250,rateRejected:50,presetRowsPreserved:before.rows,privacyColumns:['request_id','count','created_at'],ownerIsolation:true,lostResponseIdempotent:true,inconsistentAggregate503:true,previewRestarts,productionEvents:0}));
