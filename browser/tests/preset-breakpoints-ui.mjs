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
const preset=()=>document.querySelector('.profile-control select'),ratio=()=>document.querySelector('.ratio-control select'),rows=()=>[...document.querySelectorAll('.file')],zipButton=()=>document.querySelector('.sidebar-zip');
async function ready(){await until(()=>preset()&&!preset().disabled,'ready');}
async function select(element,value){assert.ok(element);assert.ok([...element.options].some(option=>option.value===value),'requested option exists: '+value);element.value=value;element.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();}
async function mode(index){document.querySelectorAll('.header-preferences .mode-bar button')[index].click();await tick();}
async function format(value){document.querySelector('.format-control input[value="'+value+'"]').click();await tick();}
function fill(element,value){Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new w.Event('input',{bubbles:true}));element.dispatchEvent(new w.Event('change',{bubbles:true}));}
async function clear(){if(!document.querySelector('aside'))await mode(1);[...document.querySelectorAll('button')].find(button=>button.textContent==='Vider'||button.textContent==='Clear').click();await tick();assert.equal(rows().length,0);}
function drop(files){const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files'],files}});document.querySelector('.image-drop-target').dispatchEvent(event);assert.ok(event.defaultPrevented);}
async function addNew(file){const input=document.querySelector('.new-image input');assert.ok(input);Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await until(()=>document.querySelector('.source-filename')?.textContent===file.name&&!preset().disabled,'new image '+file.name);}
function resolution(width,height){assert.equal(document.querySelector('.resolution output').textContent,`${width} px × ${height} px`);assert.equal(document.querySelectorAll('.dimensions input').length,0,'dimensions remain locked');assert.equal(document.querySelectorAll('.settings input[type=number]').length,0,'no free width/height fields');}
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
 await ready();await select(preset(),'uo-27');assert.deepEqual([...ratio().options].map(option=>option.value),['1.6:1','5:4']);
 assert.notEqual(ratio().options[0].textContent,'1.6:1','ratio label explains the S breakpoint');assert.notEqual(ratio().options[1].textContent,'5:4','ratio label explains larger breakpoints');
 assert.equal(ratio().value,'1.6:1');assert.ok(!document.querySelector('.source-guidance')?.textContent?.includes('Choisir un autre'),'quick links are configured, not blocked as unresolved');
 const large=await fixture(1600,1200,'links.png');drop([large]);await until(()=>document.querySelector('.single-download')&&!document.querySelector('.single-download').disabled,'large links');
 resolution(1200,750);assert.equal(warning(),null,'large native crop exceeds minimum');
 let out=await single();assert.equal(out.name,'links-1200x750.jpg');await decoded(out,[1200,750,'jpeg']);assert.equal(latestExport().options.max_bytes,1200000);assert.equal(latestExport().fit,'crop');
 await select(ratio(),'5:4');resolution(1200,960);out=await single();assert.equal(out.name,'links-1200x960.jpg');await decoded(out,[1200,960,'jpeg']);
 await cropKeys('+','ArrowRight');await format('png');out=await single();await decoded(out,[1200,960,'png']);assert.equal(latestExport().options.zoom,1.1);assert.equal(latestExport().options.center_x,.51);
 await mode(1);assert.equal(rows().length,1);assert.equal(rows()[0].querySelector('.image-preset-label select').value,'uo-27');
 await addNew(await fixture(1600,1200,'hero.png'));await select(preset(),'uo-23');await format('jpeg');
 assert.equal(ratio(),null,'fixed hero has no ratio picker');resolution(1000,667);assert.equal(warning(rows()[1]),null);await cropKeys('+','ArrowLeft');
 viewport(360);out=await individual(1);assert.equal(out.name,'hero-1000x667.jpg');await decoded(out,[1000,667,'jpeg']);assert.equal(latestExport().fit,'crop_exact');assert.equal(latestExport().options.max_bytes,1000000,'hero source 1 MB cap stays stricter than global cap');
 const heroCrop={zoom:latestExport().options.zoom,x:latestExport().options.center_x,y:latestExport().options.center_y};assert.equal(heroCrop.zoom,1.1);assert.equal(heroCrop.x,.49);
 viewport(1920);fill(rows()[1].querySelector('.filename-control input'),'hero-desktop');await tick();out=await individual(1);assert.equal(out.name,'hero-desktop-1000x667.jpg');await decoded(out,[1000,667,'jpeg']);resolution(1000,667);
 await mode(0);resolution(1000,667);assert.equal(ratio(),null);await mode(1);rows()[0].querySelector('.file-select').click();await tick();assert.equal(preset().value,'uo-27');assert.equal(ratio().value,'5:4');resolution(1200,960);assert.equal(document.querySelector('.format-control input[value=png]').checked,true);
 fill(rows()[0].querySelector('.filename-control input'),'links-zip');fill(rows()[1].querySelector('.filename-control input'),'hero-zip');await tick();
 const beforeMixed=engineRequests.filter(request=>request.mode==='export').length;let files=await zipEntries(await archive());assert.deepEqual(files.map(file=>file.name),['links-zip-1200x960.png','hero-zip-1000x667.jpg']);
 for(const [index,file] of files.entries()){const meta=await sharp(file.bytes).metadata();assert.deepEqual([meta.width,meta.height,meta.format],index===0?[1200,960,'png']:[1000,667,'jpeg']);assert.ok(file.bytes.length<=(index===0?1200000:1000000));}
 const mixedRequests=engineRequests.filter(request=>request.mode==='export').slice(beforeMixed);assert.equal(mixedRequests.length,2);assert.deepEqual(mixedRequests.map(request=>[request.fit,request.options.width,request.options.height,request.options.zoom,request.options.center_x,request.options.max_bytes]),[['crop',1200,960,1.1,.51,1200000],['crop_exact',1000,667,heroCrop.zoom,heroCrop.x,1000000]]);
 await select(ratio(),'1.6:1');resolution(1200,750);files=await zipEntries(await archive());assert.deepEqual(files.map(file=>file.name),['links-zip-1200x750.png','hero-zip-1000x667.jpg'],'changing one ratio preserves the other image preset and filename');
 rows()[1].querySelector('.file-select').click();await tick();assert.equal(preset().value,'uo-23');assert.equal(ratio(),null);resolution(1000,667);rows()[0].querySelector('.file-select').click();await tick();assert.equal(ratio().value,'1.6:1');
 await clear();await mode(0);await select(preset(),'uo-27');await format('jpeg');drop([await fixture(600,400,'native.png')]);await until(()=>!!document.querySelector('.single-download')&&!document.querySelector('.single-download').disabled,'native links');resolution(600,375);assert.equal(warning(),null);await decoded(await single(),[600,375,'jpeg']);await select(ratio(),'5:4');resolution(500,400);assert.equal(warning(),null,'exact 500 px cropped output does not warn');await decoded(await single(),[500,400,'jpeg']);
 await cropKeys('+');resolution(454,363);assert.ok(warning()?.textContent.includes('500'),'crop below 500 warns');await decoded(await single(),[454,363,'jpeg']);
 await addNew(await fixture(400,300,'below-minimum.png'));await select(preset(),'uo-27');await select(ratio(),'1.6:1');resolution(400,250);assert.ok(warning()?.textContent.includes('500'));await decoded(await single(),[400,250,'jpeg']);await select(ratio(),'5:4');resolution(375,300);assert.ok(warning()?.textContent.includes('500'));await decoded(await single(),[375,300,'jpeg']);
 await addNew(await fixture(333,222,'small-hero.png'));await select(preset(),'uo-23');await format('png');resolution(1000,667);assert.ok(warning()?.textContent.includes('1000'),'fixed hero keeps small-source upscale warning');out=await single();assert.equal(out.name,'small-hero-1000x667.png');await decoded(out,[1000,667,'png']);assert.equal(latestExport().fit,'crop_exact');assert.equal(latestExport().options.max_bytes,1000000);
 await clear();await mode(0);await select(preset(),'uo-23');await format('png');
 const noise=randomFillSync(Buffer.alloc(1000*667*3)),dense=await sharp(noise,{raw:{width:1000,height:667,channels:3}}).png().toBuffer();drop([new File([dense],'dense-hero.png',{type:'image/png'})]);await until(()=>!!document.querySelector('.single-download')&&!document.querySelector('.single-download').disabled,'dense hero');
 let dispatched=downloads.length,reportsBefore=counterReports.length;document.querySelector('.single-download').click();await until(()=>!!document.querySelector('.warning')&&!preset().disabled,'lossless hero byte cap');assert.equal(downloads.length,dispatched,'oversized hero PNG never dispatches');assert.equal(counterReports.length,reportsBefore,'failed generation never reports');assert.equal(latestExport().options.max_bytes,1000000);
 await mode(1);zipButton().click();await until(()=>!!document.querySelector('.notice')&&!zipButton().disabled&&!!rows()[0].querySelector('.file-status.error'),'oversized hero ZIP blocked');assert.equal(downloads.length,dispatched);assert.equal(counterReports.length,reportsBefore);assert.ok(document.querySelector('.notice'),'failed member prevents partial ZIP');
 await format('jpeg');out=await individual(0);const denseDecoded=await decoded(out,[1000,667,'jpeg']);assert.ok(denseDecoded.bytes.length<=1000000,'JPEG retries compress inside source cap at exact hero dimensions');
 assert.ok(engineRequests.filter(request=>request.mode==='export').every(request=>request.options.max_bytes>0&&request.options.max_bytes<=1200000));
 let expectedCount=0;for(const download of downloads)expectedCount+=download.name.endsWith('.zip')?(await zipEntries(download)).length:1;await until(()=>counterReports.length===downloads.length,'fixture dispatch reports');assert.equal(total,expectedCount,'counter still counts only actual successful dispatches');
 root.unmount();await tick();root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:true}));await ready();await until(()=>preset().value==='uo-23','legacy null hero restore');resolution(1000,667);assert.equal(ratio(),null);assert.equal(preferencesReads,1,'legacy fixture settings read once, never written');
 root.unmount();await tick();preferenceFixture={presets:[{...starters[0],id:'uo-27',name:'Saved 5:4 quick links',width:1000,height:800}],selected:'uo-27',revision:9,language:'fr'};root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:true}));await ready();await until(()=>preset().value==='uo-27','saved 5:4 quick links restore');assert.equal(ratio().value,'5:4');resolution(1200,960);assert.equal(preferencesReads,2,'saved ratio read independently without a preference write');drop([await fixture(600,400,'restored-quick-links.png')]);await until(()=>!!document.querySelector('.single-download')&&!document.querySelector('.single-download').disabled,'restored native quick links');resolution(500,400);assert.equal(warning(),null);await decoded(await single(),[500,400,'jpeg']);
 console.log('PASS actual React/WASM: manual quick-link 1.6:1/5:4 choices;1200 cap/no enlargement;500px cropped-output warning without blocking; locked exact1000x667 hero independent of viewport;hero1MB/global1.2MB byte guards;per-image preset/format/crop/ratio retention;Single/Batch mixed ZIP;PNG cap failure/no partial ZIP/JPEG retry;legacy null hero and saved5:4 ratio restore;successful-dispatch-only fixture counter. No native browser/clipboard/production/DB/publication.');
}finally{root.unmount();dom.window.close();}
