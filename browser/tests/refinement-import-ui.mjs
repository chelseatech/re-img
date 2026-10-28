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
require('esbuild').buildSync({entryPoints:['app/prep.tsx'],outfile:'work/refinement-import-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
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
const React=await import('react'),{createRoot}=await import('react-dom/client'),Prep=require('../work/refinement-import-qa.cjs').default;
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
function resolution(width,height){assert.equal((document.querySelector('.resolution output')?.textContent??null),`${width} px × ${height} px`);assert.equal(document.querySelectorAll('.dimensions input').length,0,'dimensions remain locked');assert.equal(document.querySelectorAll('.settings input[type=number]').length,0,'no free width/height fields');}
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

const search=()=>document.querySelector('input[type=search]');
async function query(value){fill(search(),value);await tick();}
function esc(target,time,repeat=false){const e=new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true,repeat});Object.defineProperty(e,'timeStamp',{value:time});target.dispatchEvent(e);}
function paste(file,target=document.body){const e=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(e,'clipboardData',{value:{items:[{kind:'file',type:file.type,getAsFile:()=>file}],files:[file]}});target.dispatchEvent(e);return e;}
try{
 await ready();await until(()=>document.activeElement===search(),'initial site search focus');drop([await fixture(900,500,'hero.png')]);await until(()=>document.querySelector('.source-filename')?.textContent==='hero.png'&&!preset().disabled,'loaded drop');await until(()=>document.activeElement===search(),'search autofocus after drop');
 assert.equal(document.querySelector('.settings .preset-reference'),null);assert.ok(document.querySelector('.preview .editing-reference'));assert.equal(document.querySelector('.preset-table-selection'),null);
 await select(preset(),'uo-20');await format('png');assert.ok(document.querySelector('.hero-preview-caption'));assert.match(document.querySelector('.hero-preview-caption').textContent,/pas exportés/);await cropKeys('+','ArrowRight');
 const before=await single(),beforeBytes=Buffer.from(await before.blob.arrayBuffer()),beforeRequest=structuredClone(latestExport());assert.ok(!JSON.stringify(beforeRequest).includes('heroPreview'),'overlay never reaches export engine');
 const raw=await sharp(beforeBytes).raw().toBuffer({resolveWithObject:true});assert.deepEqual([...raw.data.subarray(0,raw.info.channels)],[...raw.data.subarray(raw.data.length-raw.info.channels)],'uniform PNG has no preview gradient/text burned into export');
 await query('headshot');const countBefore=total,imagesBefore=engineRequests.length,formatBefore=document.querySelector('.format-control input:checked').value,resolutionBefore=(document.querySelector('.resolution output')?.textContent??null);
 esc(search(),1000);await tick();assert.equal(search().value,'headshot');esc(search(),1100,true);await tick();assert.equal(search().value,'headshot');esc(search(),1250);await tick();assert.equal(search().value,'');assert.equal(preset().value,'uo-20');assert.equal(document.querySelector('.format-control input:checked').value,formatBefore);assert.equal((document.querySelector('.resolution output')?.textContent??null),resolutionBefore);assert.equal(total,countBefore);assert.equal(engineRequests.length,imagesBefore);assert.equal(document.querySelector('.source-filename').textContent,'hero.png');
 const after=await single();assert.deepEqual(Buffer.from(await after.blob.arrayBuffer()),beforeBytes,'double Escape preserves all export pixels, crop and format');
 await select(preset(),'uo-01');assert.equal(document.querySelector('.hero-preview-caption'),null,'other full-width/article hero has no requested overlay');await select(preset(),'uo-23');assert.equal(document.querySelector('.hero-preview-caption'),null,'homepage hero is excluded');await select(preset(),'uo-20');
 const other=document.querySelector('.theme-toggle');other.focus();drop([await fixture(400,300,'no-steal.png')]);document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'a',bubbles:true}));await until(()=>document.querySelector('.source-filename')?.textContent==='no-steal.png'&&!preset().disabled,'second drop');assert.equal(document.activeElement,other,'activity during import cancels autofocus');
 other.focus();drop([new File([new Uint8Array([1,2,3])],'broken.png',{type:'image/png'})]);await until(()=>document.querySelector('.source-filename')?.textContent==='broken.png'&&!preset().disabled,'failed drop');assert.equal(document.activeElement,other,'failed imports do not focus search');assert.ok(document.querySelector('.settings .warning'));
 const pasted=await fixture(640,360,'pasted.png');assert.equal(paste(pasted).defaultPrevented,true);await until(()=>document.querySelector('.source-filename')?.textContent==='pasted.png'&&!preset().disabled,'pasted image');await until(()=>document.activeElement===search(),'search autofocus after paste');
 await query('image');const beforePaste=engineRequests.length;assert.equal(paste(pasted,search()).defaultPrevented,false,'normal editing/paste in search is untouched');await tick();assert.equal(engineRequests.length,beforePaste);assert.equal(search().value,'image');
 document.querySelector('.preset-search-clear').click();await tick();other.focus();await addNew(await fixture(500,300,'picker.png'));assert.equal(document.activeElement,other,'ordinary file picker does not steal focus into search');
 document.querySelector('.language').click();await tick();assert.match(document.querySelector('.hero-preview-caption').textContent,/not exported/);assert.match(document.querySelector('.editing-reference a').href,/\/en\/brand-design/);assert.match(document.querySelector('.format-control legend').textContent,/Save format/);
 console.log('PASS actual Prep/WASM: successful drop/paste focus, no focus theft during activity or failed imports, normal text paste preserved, picker unaffected, filter-only double Escape preserves image/crop/format/counts and export bytes, hero-only caption and unchanged gradient-free PNG pixels, reference below editor and EN/FR.');
}finally{root.unmount();dom.window.close();}
