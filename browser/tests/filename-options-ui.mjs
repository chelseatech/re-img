import {messages} from '../lib/i18n.mjs';
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
require('esbuild').buildSync({entryPoints:['app/prep.tsx'],outfile:'work/filename-options-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
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
const React=await import('react'),{createRoot}=await import('react-dom/client'),Prep=require('../work/filename-options-qa.cjs').default;
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
 await ready();w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};assert.equal(document.querySelectorAll('.help-button').length,1);document.querySelector('.help-button').click();await tick();assert.equal(document.querySelector('.help-content').firstElementChild.className,'help-preset-shortcuts');assert.match(document.querySelector('.help-content').firstElementChild.textContent,/Échap/);document.querySelector('.help-heading button').click();await tick();drop([await fixture(240,180,'Original Photo.png')]);await until(()=>document.querySelector('.source-filename')?.textContent==='Original Photo.png'&&!preset().disabled,'source');await select(preset(),'uo-02');
 let options=document.querySelector('.single-export .filename-options');assert.ok(options);assert.equal(options.tagName,'DIV');assert.equal(options.closest('details'),null);assert.equal(options.querySelector('summary'),null,'filename inputs are always expanded');assert.equal(document.querySelector('.resolution'),null,'fixed preset has no duplicate resolution');assert.equal(document.querySelector('.ratio-control'),null);assert.equal((await single()).name,'original-photo-80x80.jpg');
 let name=options.querySelector('.filename-control input'),suffix=options.querySelector('input[type=checkbox]');name.focus();fill(name,'Final Photo');await tick();name.blur();await tick();suffix.click();await tick();assert.equal(name.value,'final-photo');assert.equal(suffix.checked,false);assert.match(document.querySelector('.filename-preview').textContent,/final-photo\.jpg/);
 assert.equal(name.value,'final-photo');assert.equal(suffix.checked,false);let out=await single();assert.equal(out.name,'final-photo.jpg');await decoded(out,[80,80,'jpeg']);
 await format('png');out=await single();assert.equal(out.name,'final-photo.png');await decoded(out,[80,80,'png']);assert.equal(name.value,'final-photo');assert.equal(suffix.checked,false);
 document.querySelector('.language').click();await tick();assert.equal(document.querySelector('.single-export .filename-control').firstChild.textContent,messages.en.filenameBase);assert.equal(document.querySelectorAll('header .download-counter').length,1);assert.equal(document.querySelector('.release-status .download-counter'),null);document.querySelector('.language').click();await tick();assert.equal(document.querySelector('.single-export .filename-control').firstChild.textContent,messages.fr.filenameBase);
 await select(preset(),'uo-05');assert.ok(document.querySelector('.ratio-control select'),'required ratio choice retained');assert.ok(document.querySelector('.resolution output'),'actual output dimensions remain for variable/multi-size presets');await select(ratio(),'4:5');resolution(600,750);await select(preset(),'uo-23');assert.ok(document.querySelector('.settings .source-guidance'),'advisory note placement unchanged');assert.equal(document.querySelector('.resolution'),null);await select(preset(),'uo-02');
 await mode(1);await addNew(await fixture(300,200,'second.png'));await select(preset(),'uo-02');await format('png');assert.equal(rows().length,2);assert.ok(rows().every(row=>row.querySelector('.filename-options')?.tagName==='DIV'&&!row.querySelector('.filename-options summary')),'batch filename controls remain expanded');assert.equal(rows()[0].querySelector('.filename-control input').value,'final-photo');assert.equal(rows()[0].querySelector('.suffix-control input').checked,false);
 let second=rows()[1].querySelector('.filename-options');let secondName=second.querySelector('.filename-control input');secondName.focus();fill(secondName,'Second Edit');await tick();secondName.blur();await tick();assert.equal(secondName.value,'second-edit');assert.equal(second.tagName,'DIV');
 const entries=await zipEntries(await archive());assert.deepEqual(entries.map(e=>e.name),['final-photo.png','second-edit-80x80.png']);for(const e of entries){const m=await sharp(e.bytes).metadata();assert.deepEqual([m.width,m.height,m.format],[80,80,'png']);}assert.ok(document.querySelector('header .time-saved'),'time metric remains in header');
 console.log('PASS filename options: always expanded single/batch inputs, EN/FR labels, edited name/suffix retention, real JPEG/PNG names and bytes, independent batch options/ZIP names, fixed-resolution removal, required ratio/dynamic dimensions and advisory placement unchanged.');
}finally{root.unmount();dom.window.close();}
