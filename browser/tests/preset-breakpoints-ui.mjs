// Actual React/WASM preset regression; controlled HTTP and source files only.
// No native browser, clipboard, production events, database or publication.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomFillSync} from 'node:crypto';
import {execute} from '../public/engine/abi.mjs';
import {starters} from '../lib/preferences.mjs';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
require('esbuild').buildSync({entryPoints:['app/prep.tsx'],outfile:'work/preset-breakpoints-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const {JSDOM}=await import('../work/qa-runtime/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<div id="root"></div>',{url:'http://preset-breakpoints-fixture.test',pretendToBeVisual:true}),w=dom.window;
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLCanvasElement','Event','MouseEvent','Image','localStorage'])globalThis[key]=key==='window'?w:w[key];
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
const blobs=new Map(),downloads=[],engineRequests=[],counterReports=[];let serial=0,total=0,preferencesReads=0;
let preferenceFixture={presets:[{...starters[0],id:'uo-23',name:'Legacy homepage hero',width:null,height:null,maxKB:1000,byteBase:1000}],selected:'uo-23',revision:7,language:'fr'};
globalThis.URL.createObjectURL=blob=>{const url='blob:preset-breakpoints-'+serial++;blobs.set(url,blob);return url;};
globalThis.URL.revokeObjectURL=url=>blobs.delete(url);
w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
globalThis.Worker=class{
 dead=false;terminate(){this.dead=true;}
 postMessage({id,input,request}){
  engineRequests.push(structuredClone(request));
  setTimeout(()=>{if(this.dead)return;let data;try{data={id,...execute(instance.exports,new Uint8Array(input),request)};}catch(error){data={id,error:error.message};}this.onmessage?.({data});},1);
 }
};
globalThis.fetch=async(path,options={})=>{
 if(path==='/api/preferences'){
  assert.equal(options.method??'GET','GET');preferencesReads++;
  return {ok:true,status:200,json:async()=>structuredClone(preferenceFixture)};
 }
 assert.equal(path,'/api/downloads','all requests remain in the fixture');
 if(options.method==='POST'){const report=JSON.parse(options.body);assert.deepEqual(Object.keys(report).sort(),['count','requestId']);counterReports.push(report);total+=report.count;}
 return {ok:true,status:200,json:async()=>({total})};
};
const React=await import('react'),{createRoot}=await import('react-dom/client'),Prep=require('../work/preset-breakpoints-qa.cjs').default;
let root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:false}));
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
async function until(condition,label){for(let n=0;n<800;n++){if(condition())return;await tick();}throw Error('Timed out: '+label+' '+document.body.textContent);}
const preset=()=>document.querySelector('.preset-table-row[aria-pressed=true]')||document.querySelector('.preset-table-row'),ratio=()=>document.querySelector('.ratio-control select'),rows=()=>[...document.querySelectorAll('.file')],zipButton=()=>document.querySelector('.sidebar-zip');
async function ready(){await until(()=>preset()&&!preset().disabled,'ready');}
async function select(element,value){assert.ok(element);if(element.matches('.preset-table-row')){const row=[...document.querySelectorAll('.preset-table-row')].find(b=>b.value===value);assert.ok(row,'requested preset exists: '+value);row.click();await tick();return;}assert.ok([...element.options].some(option=>option.value===value),'requested option exists: '+value);element.value=value;element.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();}
async function mode(index){document.querySelectorAll('.header-preferences .mode-bar button')[index].click();await tick();}
async function format(value){document.querySelector('.format-control input[value="'+value+'"]').click();await tick();}
function fill(element,value){Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new w.Event('input',{bubbles:true}));element.dispatchEvent(new w.Event('change',{bubbles:true}));}
async function clear(){if(!document.querySelector('aside'))await mode(1);[...document.querySelectorAll('button')].find(button=>button.textContent==='Vider'||button.textContent==='Clear').click();await tick();assert.equal(rows().length,0);}
function drop(files){const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files'],files}});document.querySelector('.image-drop-target').dispatchEvent(event);assert.ok(event.defaultPrevented);}
async function addNew(file){const input=document.querySelector('.new-image input');assert.ok(input);Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await until(()=>document.querySelector('.source-filename')?.textContent===file.name&&!preset().disabled,'new image '+file.name);}
function resolution(width,height){const rendered=document.querySelector('.resolution output');if(document.querySelector('.ratio-control select'))assert.equal(rendered?.textContent,`${width} px × ${height} px`);else assert.equal(rendered,null,'fixed resolution is already in the preset row');assert.equal(document.querySelectorAll('.dimensions input').length,0,'dimensions remain locked');assert.equal(document.querySelectorAll('.settings input[type=number]').length,0,'no free width/height fields');}
function warning(scope=document){return scope.querySelector('.image-size-warning');}
function viewport(width){Object.defineProperty(w,'innerWidth',{configurable:true,value:width});w.dispatchEvent(new w.Event('resize'));}
async function single(){const previous=downloads.length;document.querySelector('.single-download').click();await until(()=>downloads.length===previous+1,'individual dispatch');await ready();return downloads.at(-1);}
async function individual(index){const previous=downloads.length;rows()[index].querySelector('.file-download').click();await until(()=>downloads.length===previous+1,'row dispatch');await ready();return downloads.at(-1);}
async function archive(){const previous=downloads.length;zipButton().click();await until(()=>downloads.length===previous+1,'ZIP dispatch');await ready();return downloads.at(-1);}
async function decoded(download,expected){assert.ok(download.blob);const bytes=Buffer.from(await download.blob.arrayBuffer()),meta=await sharp(bytes).metadata();assert.deepEqual([meta.width,meta.height,meta.format],expected);assert.ok(bytes.length<=1200000,'global byte guard');return {bytes,meta};}
async function zipEntries(download){const bytes=Buffer.from(await download.blob.arrayBuffer()),files=[];let position=0;while(bytes.readUInt32LE(position)===0x04034b50){const size=bytes.readUInt32LE(position+18),length=bytes.readUInt16LE(position+26),extra=bytes.readUInt16LE(position+28),start=position+30+length+extra;files.push({name:bytes.toString('utf8',position+30,position+30+length),bytes:bytes.subarray(start,start+size)});position=start+size;}return files;}
const latestExport=()=>engineRequests.filter(request=>request.mode==='export').at(-1);
async function cropKeys(...keys){for(const key of keys){document.querySelector('canvas').dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true}));await tick();}}
async function fixture(width,height,name){const bytes=await sharp({create:{width,height,channels:4,background:{r:30,g:100,b:180,alpha:.65}}}).png().toBuffer();return new File([bytes],name,{type:'image/png'});}

try{
 await ready();const cases=JSON.parse(fs.readFileSync('tests/authoritative-sizes.json','utf8').replace(/^\uFEFF/,''));
 drop([await fixture(600,400,'sheet.png')]);await until(()=>document.querySelector('.source-filename')?.textContent==='sheet.png'&&!preset().disabled,'source');
 for(const [id,width,height,choice] of cases){
  await select(preset(),id);if(choice)await select(ratio(),choice);else assert.equal(ratio(),null,`${id} has no obsolete size choices`);
  for(const value of ['jpeg','png']){await format(value);resolution(width,height);const out=await single();assert.equal(out.name,`sheet-${width}x${height}.${value==='jpeg'?'jpg':'png'}`);const {bytes,meta}=await decoded(out,[width,height,value]);assert.equal(latestExport().fit,'crop_exact');assert.equal(latestExport().options.width,width);assert.equal(latestExport().options.height,height);assert.ok(bytes.length<=latestExport().options.max_bytes);if(id==='uo-02'&&value==='png'){const {data,info}=await sharp(bytes).raw().toBuffer({resolveWithObject:true});assert.ok(info.channels===4&&data[3]>0,'circle export retains image corners: framing guide only');}}
 }
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const lang of ['fr','en']){if(document.documentElement.lang!==lang){document.querySelector('.language').click();await tick();}await select(preset(),'uo-05');document.querySelector('.help-button').click();await tick();const help=document.querySelector('.help-dialog');assert.ok(help.open);for(const size of ['600 x 337','600 x 400','600 x 750','380 x 474'])assert.ok(help.textContent.includes(size));assert.ok(help.textContent.includes(lang==='fr'?'Les anciens':'older')||help.textContent.includes('anciens guides'));document.querySelector('.help-heading button').click();await tick();}
 if(document.documentElement.lang!=='fr'){document.querySelector('.language').click();await tick();}
 await select(preset(),'uo-40');assert.equal(document.querySelector('.single-download').disabled,true,'blank Featured person size cannot export');assert.equal(document.querySelector('.resolution output'),null);
 await select(preset(),'uo-05');await select(ratio(),'4:5');await format('png');await cropKeys('+','ArrowRight');await mode(1);
 await addNew(await fixture(333,222,'quote.png'));await select(preset(),'uo-29');await format('jpeg');
 await addNew(await fixture(400,400,'circle.png'));await select(preset(),'uo-31-2');await format('png');
 assert.deepEqual(rows().map(row=>row.querySelector('.image-preset-label select').value),['uo-05','uo-29','uo-31-2']);
 let files=await zipEntries(await archive());assert.deepEqual(files.map(f=>f.name),['sheet-600x750.png','quote-710x540.jpg','circle-450x450.png']);
 for(const [i,file] of files.entries()){const m=await sharp(file.bytes).metadata();assert.deepEqual([m.width,m.height,m.format],[[600,750,'png'],[710,540,'jpeg'],[450,450,'png']][i]);}
 rows()[0].querySelector('.file-select').click();await tick();assert.equal(ratio().value,'4:5');resolution(600,750);viewport(360);resolution(600,750);viewport(1920);resolution(600,750);
 await select(ratio(),'16:9');files=await zipEntries(await archive());assert.equal(files[0].name,'sheet-600x337.png');assert.equal(files[1].name,'quote-710x540.jpg');const bodyRequest=engineRequests.filter(r=>r.mode==='export'&&r.options.width===600&&r.options.height===337).at(-1);assert.equal(bodyRequest.options.zoom,1.1);assert.equal(bodyRequest.options.center_x,.51);
 rows()[2].querySelector('.file-select').click();await tick();document.querySelector('.apply-all').click();await tick();files=await zipEntries(await archive());for(const file of files){const m=await sharp(file.bytes).metadata();assert.deepEqual([m.width,m.height],[450,450]);}
 // The existing lossless byte-cap/no-partial-ZIP and JPEG retry checks remain exercised in mixed-presets-ui.mjs.
 let expectedCount=0;for(const download of downloads)expectedCount+=download.name.endsWith('.zip')?(await zipEntries(download)).length:1;await until(()=>counterReports.length===downloads.length,'counter reports');assert.equal(total,expectedCount);
 // Cloudflare deliberately has no account sync; injected legacy sign-in props do not fetch settings.
 root.unmount();await tick();root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:true}));await ready();
 assert.equal(preferencesReads,0,'Cloudflare must never request Sites account preferences');
 assert.equal(document.querySelector('.preset-table-row[aria-pressed=true]'),null,'fresh editing starts without an implicit preset');
 console.log(`PASS ${cases.length} sheet/preserved targets via actual React/WASM in JPEG and PNG; decoded exact pixels, circle corners, ratio selection/rounding, missing-size export guard, mixed batch ZIP, per-image settings, Apply all, crop/viewport retention, no account syncing, byte caps and download counts. No live calls or publication.`);
}finally{root.unmount();dom.window.close();}
