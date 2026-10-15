// Actual Prep/CSS/WASM in local fixtures. Input.click is observed in jsdom;
// no OS picker, native clipboard, live HTTP, database or download is accessed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execute} from '../public/engine/abi.mjs';
import sharp from 'sharp';

const require=createRequire(import.meta.url);
require('esbuild').buildSync({entryPoints:['app/prep.tsx'],outfile:'work/empty-picker-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const {JSDOM}=await import('../work/qa-runtime/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<style></style><div id="root"></div>',{url:'http://empty-picker-fixture.test',pretendToBeVisual:true}),w=dom.window;
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLCanvasElement','Event','MouseEvent','Image','localStorage'])globalThis[key]=key==='window'?w:w[key];
const css=fs.readFileSync('app/globals.css','utf8');document.querySelector('style').textContent=css;
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
const pickerClicks=[],nativeInputClick=w.HTMLInputElement.prototype.click;
w.HTMLInputElement.prototype.click=function(){if(this.type==='file')pickerClicks.push(this);return nativeInputClick.call(this);};
w.HTMLAnchorElement.prototype.click=()=>assert.fail('picker fixture never exports a file');
let blobSerial=0,previewRequests=0;const urls=new Set(),workerTasks=[];
globalThis.URL.createObjectURL=()=>{const url='blob:empty-picker-'+blobSerial++;urls.add(url);return url;};
globalThis.URL.revokeObjectURL=url=>urls.delete(url);
globalThis.fetch=async(path,options={})=>{assert.equal(path,'/api/downloads');assert.equal(options.method??'GET','GET','imports do not report download events');return {ok:true,status:200,json:async()=>({total:0})};};
const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
globalThis.Worker=class{
 dead=false;terminate(){this.dead=true;}
 postMessage({id,input,request}){
  assert.equal(request.mode,'preview');previewRequests++;
  workerTasks.push(()=>{if(this.dead)return;let data;try{data={id,...execute(instance.exports,new Uint8Array(input),request)};}catch(error){data={id,error:error.message};}this.onmessage?.({data});});
 }
};
const React=await import('react'),{createRoot}=await import('react-dom/client'),Prep=require('../work/empty-picker-qa.cjs').default;
const root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:false}));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function until(condition,label){for(let n=0;n<400;n++){if(condition())return;await tick();}throw Error('Timed out: '+label);}
const area=()=>document.querySelector('.image-drop-target'),picker=()=>document.querySelector('.empty-image-input'),rows=()=>[...document.querySelectorAll('.file')];
const names=()=>rows().map(row=>row.querySelector('.file-select strong').textContent);
const busy=()=>document.querySelector('.profile-control select')?.disabled;
async function ready(){await until(()=>document.querySelector('.profile-control select')&&!busy(),'ready');}
async function drain(label){for(let n=0;n<400;n++){if(workerTasks.length)workerTasks.shift()();await tick();if(!busy()&&!workerTasks.length)return;}throw Error('Timed out draining previews: '+label);}
async function mode(index){document.querySelectorAll('.header-preferences .mode-bar button')[index].click();await tick();}
async function clear(){if(!document.querySelector('aside'))await mode(1);const button=[...document.querySelectorAll('button')].find(candidate=>candidate.textContent==='Vider'||candidate.textContent==='Clear');assert.ok(button&&!button.disabled);button.click();await tick();assert.equal(rows().length,0);}
function choose(input,files){
 assert.ok(input&&!input.disabled,'fixture chooses through an enabled input');
 Object.defineProperty(input,'files',{configurable:true,value:files});
 // A fixture value lets the test observe reset after change/cancel without setting an OS path.
 let value=files.length?'fixture-selected':'';Object.defineProperty(input,'value',{configurable:true,get:()=>value,set:next=>{value=next;}});
 input.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(value,'','selection is reset so the same file can be selected again');
}
function key(target,value,repeat=false){const event=new w.KeyboardEvent('keydown',{key:value,repeat,bubbles:true,cancelable:true});target.dispatchEvent(event);return event;}
function assertEmpty(multiple){
 assert.equal(area().getAttribute('role'),'button');assert.equal(area().getAttribute('aria-disabled'),'false');assert.equal(area().getAttribute('tabindex'),'0');
 assert.ok(area().classList.contains('is-empty'));assert.equal(w.getComputedStyle(area()).borderTopWidth,'4px');assert.equal(w.getComputedStyle(area()).borderTopStyle,'dashed');assert.equal(w.getComputedStyle(area()).cursor,'pointer');
 assert.ok(picker().hidden);assert.equal(picker().type,'file');assert.equal(picker().tabIndex,-1);assert.equal(picker().multiple,multiple);assert.equal(picker().disabled,false);
 assert.equal(document.querySelector('.single-import'),null,'duplicate Single import control is removed');
}
function assertLoaded(){
 assert.equal(area().getAttribute('role'),null);assert.equal(area().getAttribute('aria-disabled'),null);assert.ok(area().classList.contains('is-loaded'));assert.equal(w.getComputedStyle(area()).borderTopWidth,'0px');assert.notEqual(w.getComputedStyle(area()).cursor,'pointer');assert.equal(picker(),null);
}
function drop(files,target=area()){const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files'],files}});target.dispatchEvent(event);assert.ok(event.defaultPrevented);}
function paste(files,target=area()){const event=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{items:files.map(file=>({kind:'file',type:file.type,getAsFile:()=>file})),files}});target.dispatchEvent(event);assert.ok(event.defaultPrevented);}
async function checkBusyGuard(){
 await until(()=>workerTasks.length>0&&area().getAttribute('aria-disabled')==='true','empty preview reading guard');
 assert.equal(area().getAttribute('role'),'button');assert.equal(area().tabIndex,-1);assert.equal(picker().disabled,true);assert.equal(w.getComputedStyle(area()).cursor,'default');
 const before=pickerClicks.length;area().click();key(area(),'Enter');key(area(),' ');area().querySelector('.empty p').click();assert.equal(pickerClicks.length,before,'busy pointer and keyboard activations do not open picker');
}

try{
 await ready();assertEmpty(false);
 assert.equal(area().getAttribute('aria-label'),'Glissez vos images ici ou cliquez pour choisir');assert.equal(area().querySelector('.empty p').textContent,'Glissez vos images ici ou cliquez pour choisir');
 let before=pickerClicks.length;area().click();assert.equal(pickerClicks.length,before+1,'area click opens its picker once');assert.equal(pickerClicks.at(-1),picker());assert.equal(document.activeElement,area());
 before=pickerClicks.length;area().querySelector('.empty p').click();assert.equal(pickerClicks.length,before+1,'nested empty label click opens picker exactly once');
 for(const activation of ['Enter',' ']){before=pickerClicks.length;assert.equal(key(area(),activation).defaultPrevented,true);assert.equal(pickerClicks.length,before+1);before=pickerClicks.length;assert.equal(key(area(),activation,true).defaultPrevented,true);assert.equal(pickerClicks.length,before,'repeated activation key does not reopen');}
 for(const other of ['Escape','Tab','ArrowLeft','a']){before=pickerClicks.length;assert.equal(key(area(),other).defaultPrevented,false);assert.equal(pickerClicks.length,before,'unrelated key does not activate');}
 before=pickerClicks.length;assert.equal(key(area(),'Spacebar').defaultPrevented,true);assert.equal(pickerClicks.length,before+1,'React normalizes legacy Spacebar to the activation Space key');
 before=pickerClicks.length;key(area().querySelector('canvas'),'Enter');key(area().querySelector('canvas'),' ');assert.equal(pickerClicks.length,before,'bubbled child keyboard event is not treated as button activation');
 const source=await sharp({create:{width:160,height:100,channels:4,background:{r:20,g:80,b:160,alpha:.7}}}).png().toBuffer(),image=name=>new File([source],name,{type:'image/png'}),sameFile=image('same-file.png');
 const previewsBeforeCancel=previewRequests;choose(picker(),[]);await tick();assertEmpty(false);assert.equal(previewRequests,previewsBeforeCancel,'cancel selection imports nothing');
 choose(picker(),[sameFile,image('single-ignored.png')]);await checkBusyGuard();await drain('Single first file');assertLoaded();assert.equal(previewRequests,1);assert.equal(document.querySelector('.source-filename').textContent,'same-file.png');
 before=pickerClicks.length;area().click();area().querySelector('canvas').click();key(area(),'Enter');key(area(),' ');assert.equal(pickerClicks.length,before,'loaded crop area cannot open empty picker');
 const newSingle=document.querySelector('.toolbar-actions .new-image input');assert.ok(newSingle&&!newSingle.multiple);choose(newSingle,[image('new-single.png')]);await drain('Single New image');assert.equal(document.querySelector('.source-filename').textContent,'new-single.png');assertLoaded();
 await mode(1);assert.deepEqual(names(),['same-file.png','new-single.png'],'Single New image preserves the earlier queue');
 await clear();assertEmpty(true);choose(picker(),[]);await tick();assertEmpty(true);
 choose(picker(),[sameFile,image('batch-second.png'),image('batch-third.png')]);await checkBusyGuard();await drain('Batch all files');assertLoaded();assert.deepEqual(names(),['same-file.png','batch-second.png','batch-third.png']);
 choose(document.querySelector('.toolbar-actions .new-image input'),[image('new-batch.png')]);await drain('Batch New image');assert.deepEqual(names(),['same-file.png','batch-second.png','batch-third.png','new-batch.png']);assert.equal(document.querySelector('.source-filename').textContent,'new-batch.png','Batch New image selects the new file');
 await clear();await mode(0);assertEmpty(false);choose(picker(),[sameFile]);await drain('same object reselected');assertLoaded();assert.equal(document.querySelector('.source-filename').textContent,'same-file.png','exact same File object can be selected after clearing');
 await clear();await mode(0);assertEmpty(false);before=pickerClicks.length;drop([image('dropped.png'),image('drop-ignored.png')]);await drain('Single drop');assertLoaded();assert.equal(document.querySelector('.source-filename').textContent,'dropped.png');paste([image('single-pasted.png')]);await drain('loaded Single paste');assert.equal(document.querySelector('.source-filename').textContent,'single-pasted.png');await mode(1);assert.deepEqual(names(),['dropped.png','single-pasted.png']);
 drop([image('batch-drop-1.png'),image('batch-drop-2.png')],document.querySelector('.upload-drop-box'));await drain('loaded Batch drop');paste([image('batch-paste-1.png'),image('batch-paste-2.png')],document.querySelector('.upload-drop-box'));await drain('loaded Batch paste');assert.equal(rows().length,6);assert.equal(pickerClicks.length,before,'drop/paste imports never click a picker');
 await clear();assertEmpty(true);assert.equal(urls.size,0,'all-clear revokes the preview URLs');
 const english=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')==='Passer en anglais');english.click();await tick();assert.equal(area().getAttribute('aria-label'),'Drag images here or click to choose');assert.equal(area().querySelector('.empty p').textContent,'Drag images here or click to choose');assert.equal(picker().getAttribute('aria-label'),'Add images');
 [...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')==='Switch to French').click();await tick();assert.equal(area().getAttribute('aria-label'),'Glissez vos images ici ou cliquez pour choisir');assert.equal(picker().getAttribute('aria-label'),'Ajouter des images');
 for(const theme of ['light','dark']){if(document.documentElement.dataset.theme!==theme){document.querySelector('.theme-toggle').click();await tick();}assert.equal(document.documentElement.dataset.theme,theme);assertEmpty(true);area().focus();assert.equal(document.activeElement,area());}
 const rules=[...document.styleSheets].flatMap(sheet=>[...sheet.cssRules]);
 const focus=rules.find(rule=>rule.selectorText==='.image-drop-target:focus-within');assert.ok(focus);assert.equal(focus.style.getPropertyValue('outline'),'3px solid #005fcc');assert.equal(focus.style.getPropertyValue('outline-offset'),'3px');
 const darkFocus=rules.find(rule=>rule.selectorText==='html[data-theme=dark] .image-drop-target:focus-within');assert.ok(darkFocus);assert.equal(darkFocus.style.getPropertyValue('outline-color'),'rgb(255, 214, 112)');
 assert.equal(document.querySelector('.download-counter span').textContent,'0');
 console.log('PASS actual Prep/CSS/WASM empty picker: pointer/child click once; Enter/Space, repeat and unrelated/child keys; busy aria/disabled guard; Single first/Batch all; cancel and same-File reselect; empty/loaded roles/borders; loaded crop exclusion; New image selection/queue retention; drop/paste preservation; exact FR/EN labels; both themes and existing focus declarations. No OS picker/native clipboard/live HTTP/events/DB; jsdom does not prove native dialog or painted focus.');
}finally{root.unmount();dom.window.close();}
