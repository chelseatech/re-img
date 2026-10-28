// Actual Prep/CSS/WASM, controlled file/HTTP/download fixtures.
// Run from browser/ with node tests/upload-limit-ui.mjs; standalone drafts also work.
// This does not invoke an OS picker, read clipboard, or contact production/a database.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const draft=path.resolve(import.meta.dirname,'..');
const localBase=fs.existsSync(path.join(draft,'package.json'))?draft:path.join(draft,'../re-image/browser');
const base=path.resolve(process.env.REIMG_BASE??localBase);
const require=createRequire(path.join(base,'package.json')),sharp=require('sharp');
const work=path.join(draft,'work');fs.mkdirSync(work,{recursive:true});
function resolveFile(candidate){for(const suffix of ['','.tsx','.ts','.mjs','.js','.json'])if(fs.existsSync(candidate+suffix)&&fs.statSync(candidate+suffix).isFile())return candidate+suffix;return null;}
function inside(root,candidate){const relative=path.relative(root,candidate);return relative!==''&&!relative.startsWith('..')&&!path.isAbsolute(relative)?relative:null;}
await require('esbuild').build({
 entryPoints:[path.join(draft,'app/prep.tsx')],outfile:path.join(work,'upload-limit-qa.cjs'),bundle:true,platform:'node',format:'cjs',jsx:'automatic',nodePaths:[path.join(base,'node_modules')],
 plugins:[{name:'prepared-overlay',setup(build){
  build.onResolve({filter:/^react(?:\/|$)/},args=>({path:require.resolve(args.path),external:true}));
  build.onResolve({filter:/^\./},args=>{
   const candidate=path.resolve(args.resolveDir,args.path),relative=inside(draft,candidate)??inside(base,candidate);if(!relative)return;
   const resolved=resolveFile(path.join(draft,relative))??resolveFile(path.join(base,relative));return resolved?{path:resolved}:undefined;
  });
 }}],
});
const {execute}=await import(pathToFileURL(path.join(draft,'public/engine/abi.mjs')).href);
const {inputByteLimit}=await import(pathToFileURL(path.join(draft,'public/engine/input-policy.mjs')).href);
assert.equal(inputByteLimit,50000000,'decimal 50 MB cap');
const wasm=fs.readFileSync(path.join(base,'public/engine/prep_wasm.wasm'));
const {instance}=await WebAssembly.instantiate(wasm,{});
const source=await sharp({create:{width:160,height:100,channels:4,background:{r:30,g:100,b:170,alpha:.7}}}).png().toBuffer();
const previewRequest={mode:'preview',fit:'crop',options:{width:80,height:80,format:'png',quality:95,max_bytes:null,background:[255,255,255],center_x:.5,center_y:.5,zoom:1,allow_smaller:true,uottawa:false}};
let allocations=0;const watchedEngine={...instance.exports,allocate(length){allocations++;return instance.exports.allocate(length);}};
const tooManyBytes=new Uint8Array(inputByteLimit+1);tooManyBytes.set(source);
assert.throws(()=>execute(watchedEngine,tooManyBytes,previewRequest),/50 MB input limit/);assert.equal(allocations,0,'actual oversized ABI bytes rejected before WASM allocation');
const boundaryBytes=tooManyBytes.subarray(0,inputByteLimit);
const boundary=execute(watchedEngine,boundaryBytes,previewRequest);assert.ok(allocations>0);assert.deepEqual([boundary.meta.width,boundary.meta.height],[160,100],'exactly 50,000,000 actual bytes accepted and decoded through real WASM');

// Invoke the actual worker module with local self/fetch stand-ins, before mounting UI.
let workerFetches=0;const workerReplies=[];globalThis.self={postMessage:reply=>workerReplies.push(reply)};
globalThis.fetch=async()=>{workerFetches++;throw Error('oversized worker must not fetch');};
await import(pathToFileURL(path.join(draft,'public/engine/worker.mjs')).href);
await self.onmessage({data:{id:1,input:tooManyBytes.buffer,request:previewRequest}});
assert.equal(workerFetches,0,'actual worker rejects oversized bytes before fetching/initializing WASM');assert.match(workerReplies[0].error,/50 MB input limit/);delete globalThis.self;

const {JSDOM}=await import(pathToFileURL(path.join(base,'work/qa-runtime/node_modules/jsdom/lib/api.js')).href);
const dom=new JSDOM('<style></style><div id="root"></div>',{url:'http://upload-limit-fixture.test',pretendToBeVisual:true}),w=dom.window;
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLCanvasElement','Event','MouseEvent','Image','localStorage'])globalThis[key]=key==='window'?w:w[key];
document.querySelector('style').textContent=fs.readFileSync(path.join(draft,'app/globals.css'),'utf8');
globalThis.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
const nativeInputClick=w.HTMLInputElement.prototype.click,pickerClicks=[],downloads=[],engineRequests=[],blobs=new Map();let serial=0,engineDelay=1;
w.HTMLInputElement.prototype.click=function(){if(this.type==='file')pickerClicks.push(this);return nativeInputClick.call(this);};
globalThis.URL.createObjectURL=blob=>{const url='blob:upload-limit-'+serial++;blobs.set(url,blob);return url;};globalThis.URL.revokeObjectURL=url=>blobs.delete(url);
w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
globalThis.fetch=async(url,options={})=>{assert.equal(url,'/api/downloads');return {ok:true,status:200,json:async()=>({total:0})};};
globalThis.Worker=class{
 dead=false;terminate(){this.dead=true;}
 postMessage({id,input,request}){engineRequests.push({bytes:input.byteLength,request:structuredClone(request)});setTimeout(()=>{if(this.dead)return;let data;try{data={id,...execute(instance.exports,new Uint8Array(input),request)};}catch(error){data={id,error:error.message};}this.onmessage?.({data});},engineDelay);}
};
const React=require('react'),{createRoot}=require('react-dom/client'),Prep=require(path.join(work,'upload-limit-qa.cjs')).default;
const root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:false}));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function until(condition,label){for(let n=0;n<800;n++){if(condition())return;await tick();}throw Error('Timed out: '+label+' '+document.body.textContent);}
const area=()=>document.querySelector('.image-drop-target'),picker=()=>document.querySelector('.empty-image-input'),button=()=>document.querySelector('.empty-select-files'),rows=()=>[...document.querySelectorAll('.file')],preset=()=>document.querySelector('.profile-control select');
async function ready(){await until(()=>preset()&&!preset().disabled,'ready');}
async function mode(index){document.querySelectorAll('.mode-bar button')[index].click();await tick();}
async function selectPreset(){preset().value='uo-02';preset().dispatchEvent(new w.Event('change',{bubbles:true}));await tick();}
async function clear(){await ready();if(!document.querySelector('aside'))await mode(1);[...document.querySelectorAll('button')].find(candidate=>candidate.textContent==='Vider'||candidate.textContent==='Clear').click();await tick();assert.equal(rows().length,0);}
function choose(input,files){assert.ok(input&&!input.disabled);Object.defineProperty(input,'files',{configurable:true,value:files});input.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(input.value,'','selection reset permits reselecting the same source');}
function drop(files,target=area()){const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files'],files}});target.dispatchEvent(event);assert.equal(event.defaultPrevented,true);}
function paste(files,target=area()){const event=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{items:files.map(file=>({kind:'file',type:file.type,getAsFile:()=>file})),files}});target.dispatchEvent(event);assert.equal(event.defaultPrevented,true);}
function fixture(name,reportedSize=source.length,actual=null){
 const file=new File([source],name,{type:'image/png'}),nativeBuffer=file.arrayBuffer.bind(file),trace={file,reads:0};
 Object.defineProperty(file,'size',{value:reportedSize});Object.defineProperty(file,'arrayBuffer',{value:async()=>{trace.reads++;return actual??nativeBuffer();}});return trace;
}
async function settled(expectedRows=null){await until(()=>preset()&&!preset().disabled&&(expectedRows===null||rows().length===expectedRows),'settled imports');}
function empty(){assert.equal(area().getAttribute('role'),'group');assert.equal(area().tabIndex,-1);assert.equal(area().getAttribute('aria-disabled'),'false');assert.equal(area().querySelectorAll('button').length,1);assert.equal(button().tagName,'BUTTON');assert.equal(button().type,'button');assert.equal(button().disabled,false);assert.equal(button().tabIndex,0);assert.equal(w.getComputedStyle(area()).cursor,'pointer');assert.equal(area().querySelector('canvas').style.cursor,'inherit');assert.equal(w.getComputedStyle(area().querySelector('canvas')).cursor,'pointer','empty canvas inherits pointer instead of move');assert.equal(w.getComputedStyle(area()).borderTopWidth,'4px');assert.equal(w.getComputedStyle(document.querySelector('.empty-upload-content')).alignItems,'center');assert.equal(w.getComputedStyle(document.querySelector('.empty-upload-content')).justifyContent,'center');}
function loaded(){assert.equal(button(),null);assert.equal(area().getAttribute('role'),null);assert.equal(w.getComputedStyle(area()).borderTopWidth,'0px');assert.equal(w.getComputedStyle(area().querySelector('canvas')).cursor,'move');}
function language(english){const name=english?'Passer en anglais':'Switch to French';const target=[...document.querySelectorAll('button')].find(candidate=>candidate.getAttribute('aria-label')===name);assert.ok(target);target.click();}
async function rejectOversized(trace,route){
 const requestsBefore=engineRequests.length,downloadsBefore=downloads.length;
 if(route==='picker')choose(picker(),[trace.file]);else if(route==='drop')drop([trace.file]);else paste([trace.file]);
 await until(()=>document.querySelector('.source-filename')?.textContent===trace.file.name&&!preset().disabled&&!!document.querySelector('.warning'),'oversized '+route);
 assert.equal(trace.reads,0,route+' rejects declared >50MB before arrayBuffer');assert.equal(engineRequests.length,requestsBefore,route+' rejects before worker');assert.equal(downloads.length,downloadsBefore);assert.ok(document.querySelector('.warning').textContent.includes('50'),'localized actionable 50MB error');empty();
 // The same errored input cannot bypass the cap through individual retry.
 const retry=document.querySelector('.single-download');assert.ok(retry&&!retry.disabled);retry.click();await tick();assert.equal(trace.reads,0);assert.equal(engineRequests.length,requestsBefore);assert.equal(downloads.length,downloadsBefore);
}

try{
 await ready();await selectPreset();empty();
 assert.equal(document.querySelector('.empty-upload-title').textContent,'Déposez les fichiers à importer');assert.equal(document.querySelector('.empty-upload-or').textContent,'ou');assert.equal(button().textContent,'Sélectionner des fichiers');assert.equal(document.querySelector('.input-limit').textContent,'Taille maximale par fichier : 50 Mo.');
 for(const click of [()=>area().click(),()=>document.querySelector('.empty-upload-title').click(),()=>button().click()]){const before=pickerClicks.length;click();assert.equal(pickerClicks.length,before+1,'parent, child and button each open picker once');}
 for(const key of ['Enter',' ']){
  let before=pickerClicks.length;const parentEvent=new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});area().dispatchEvent(parentEvent);assert.equal(parentEvent.defaultPrevented,false);assert.equal(pickerClicks.length,before,'group has no emulated button keyboard');
  const event=new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});button().dispatchEvent(event);assert.equal(event.defaultPrevented,false,'native button default remains available');assert.equal(pickerClicks.length,before,'jsdom key event itself has no browser activation');button().click();assert.equal(pickerClicks.length,before+1,'a browser-equivalent native click opens exactly once');
 }
 language(true);await tick();assert.equal(button().textContent,'Select Files');assert.equal(document.querySelector('.empty-upload-title').textContent,'Drop files to upload');assert.equal(document.querySelector('.empty-upload-or').textContent,'or');assert.equal(document.querySelector('.input-limit').textContent,'Maximum file size: 50 MB.');language(false);await tick();
 const cancelRequests=engineRequests.length;choose(picker(),[]);await tick();assert.equal(engineRequests.length,cancelRequests);empty();
 const boundaryPicker=fixture('picker-boundary.png',inputByteLimit);engineDelay=80;choose(picker(),[boundaryPicker.file,fixture('ignored-single.png').file]);await until(()=>area().getAttribute('aria-disabled')==='true','new native button busy guard');assert.equal(button().disabled,true);assert.equal(picker().disabled,true);assert.equal(w.getComputedStyle(area()).cursor,'default');let beforeBusy=pickerClicks.length;area().click();button().click();assert.equal(pickerClicks.length,beforeBusy,'busy group and disabled native button cannot reopen picker');engineDelay=1;await until(()=>area().classList.contains('is-loaded')&&!preset().disabled,'exact metadata boundary picker');assert.equal(boundaryPicker.reads,1);loaded();
 const beforeLoadedClick=pickerClicks.length;area().click();area().querySelector('canvas').click();assert.equal(pickerClicks.length,beforeLoadedClick,'loaded crop does not open picker');
 const fresh=fixture('new-image.png');choose(document.querySelector('.new-image input'),[fresh.file]);await until(()=>document.querySelector('.source-filename')?.textContent==='new-image.png'&&!preset().disabled,'New image');await mode(1);assert.deepEqual(rows().map(row=>row.querySelector('.file-select strong').textContent),['picker-boundary.png','new-image.png'],'New image selects new while preserving queue');await clear();await mode(0);
 for(const route of ['picker','drop','paste']){const rejected=fixture(route+'-over.png',inputByteLimit+1);await rejectOversized(rejected,route);await clear();await mode(0);await selectPreset();}
 for(const route of ['drop','paste']){const accepted=fixture(route+'-boundary.png',inputByteLimit);if(route==='drop')drop([accepted.file]);else paste([accepted.file]);await until(()=>area().classList.contains('is-loaded')&&!preset().disabled,'exact boundary '+route);assert.equal(accepted.reads,1);loaded();await clear();await mode(0);await selectPreset();}
 // A dishonest metadata size is checked again using actual ArrayBuffer length before worker.
 const mismatch=fixture('actual-bytes-over.png',1,tooManyBytes.buffer),beforeMismatch=engineRequests.length;choose(picker(),[mismatch.file]);await until(()=>!!document.querySelector('.warning')&&!preset().disabled,'actual-byte guard');assert.equal(mismatch.reads,1);assert.equal(engineRequests.length,beforeMismatch,'actual >50MB bytes rejected before worker');await clear();await selectPreset();
 const batchOver1=fixture('batch-over-1.png',inputByteLimit+1),batchValid=fixture('batch-boundary.png',inputByteLimit),batchOver2=fixture('batch-over-2.png',inputByteLimit+1);assert.equal(picker().multiple,true);choose(picker(),[batchOver1.file,batchValid.file,batchOver2.file]);await settled(3);assert.equal(batchOver1.reads,0);assert.equal(batchOver2.reads,0);assert.equal(batchValid.reads,1);assert.ok(rows()[0].querySelector('.file-status.error'));assert.ok(rows()[2].querySelector('.file-status.error'));assert.ok(rows()[1].querySelector('img'));
 const beforeBatch=downloads.length;document.querySelector('.sidebar-zip').click();await until(()=>!!document.querySelector('.notice')&&!document.querySelector('.sidebar-zip').disabled,'batch rejects oversized members');assert.equal(downloads.length,beforeBatch,'no partial ZIP');assert.equal(batchOver1.reads,0);assert.equal(batchOver2.reads,0);const afterValidExport=engineRequests.length;
 rows()[0].querySelector('.file-download').click();await tick();document.querySelector('.sidebar-zip').click();await settled(3);await tick();assert.equal(batchOver1.reads,0);assert.equal(batchOver2.reads,0);assert.equal(downloads.length,beforeBatch,'individual/ZIP retry do not bypass size guard');assert.equal(engineRequests.length,afterValidExport,'cached successful member reused; rejected members never reach worker');
 await clear();await mode(0);const same=fixture('same.png');choose(picker(),[same.file]);await until(()=>area().classList.contains('is-loaded')&&!preset().disabled,'same source first import');await clear();await mode(0);choose(picker(),[same.file]);await until(()=>area().classList.contains('is-loaded')&&!preset().disabled,'same source reselected');assert.equal(same.reads,2);await clear();empty();
 for(const theme of ['light','dark']){if(document.documentElement.dataset.theme!==theme){document.querySelector('.theme-toggle').click();await tick();}empty();button().focus();assert.equal(document.activeElement,button());assert.ok(document.querySelector('.input-limit').textContent.includes('50'));}
 assert.equal(downloads.length,0,'test exports no real or fixture downloads');
 console.log('PASS prepared overlay: centered in-zone native Select Files UI; parent/child/button picker once; native-keyboard semantics without synthetic parent handler; empty pointer/inherited canvas cursor, loaded move cursor; FR/EN/Single/Batch/New image/cancel/reselect; exact50,000,000 metadata accepted via picker/drop/paste; oversized metadata rejected before arrayBuffer/worker across routes, batch and retries; actual-byte spoof rejected pre-worker; actual50MB ABI/WASM decode, >50MB ABI pre-allocation and actual worker pre-fetch guards. No main-repo edits, native browser/clipboard/production/DB/Git/publication; native dialog/key activation and painted layout require browser QA.');
}finally{root.unmount();dom.window.close();}
