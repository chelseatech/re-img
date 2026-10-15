// Actual Prep, production CSS and WASM previews in local jsdom fixtures.
// Native drag/clipboard/canvas painting are not simulated; no live HTTP or exports.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execute} from '../public/engine/abi.mjs';
import sharp from 'sharp';

const require=createRequire(import.meta.url);
require('esbuild').buildSync({entryPoints:['app/prep.tsx'],outfile:'work/drop-border-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const {JSDOM}=await import('../work/qa-runtime/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<style></style><div id="root"></div>',{url:'http://drop-border-fixture.test',pretendToBeVisual:true}),w=dom.window;
documentSetup();
function documentSetup(){
 for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLCanvasElement','Event','MouseEvent','Image','localStorage'])globalThis[key]=key==='window'?w:w[key];
 document.querySelector('style').textContent=fs.readFileSync('app/globals.css','utf8');
 globalThis.ResizeObserver=class{observe(){}disconnect(){}};
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
}
const blobUrls=new Set();let blobSerial=0,previewRequests=0,counterReads=0;
globalThis.URL.createObjectURL=()=>{const url='blob:drop-border-'+blobSerial++;blobUrls.add(url);return url;};
globalThis.URL.revokeObjectURL=url=>blobUrls.delete(url);
globalThis.fetch=async(path,options={})=>{
 assert.equal(path,'/api/downloads');assert.equal(options.method??'GET','GET','imports never report a download');counterReads++;
 return {ok:true,status:200,json:async()=>({total:0})};
};
w.HTMLAnchorElement.prototype.click=()=>assert.fail('border fixture must not dispatch a download');
const {instance}=await WebAssembly.instantiate(fs.readFileSync('public/engine/prep_wasm.wasm'),{});
globalThis.Worker=class{
 dead=false;terminate(){this.dead=true;}
 postMessage({id,input,request}){
  assert.equal(request.mode,'preview','only real local preview generation is permitted');previewRequests++;
  setTimeout(()=>{if(this.dead)return;let result;try{result={id,...execute(instance.exports,new Uint8Array(input),request)};}catch(error){result={id,error:error.message};}this.onmessage?.({data:result});},1);
 }
};
const React=await import('react'),{createRoot}=await import('react-dom/client'),Prep=require('../work/drop-border-qa.cjs').default;
const root=createRoot(document.getElementById('root'));root.render(React.createElement(Prep,{signedIn:false}));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function until(condition,label){for(let n=0;n<400;n++){if(condition())return;await tick();}throw Error('Timed out: '+label);}
const central=()=>document.querySelector('.image-drop-target'),sidebar=()=>document.querySelector('.upload-drop-box'),rows=()=>[...document.querySelectorAll('.file')];
const modes=()=>[...document.querySelectorAll('.header-preferences .mode-bar button')];
async function mode(index){modes()[index].click();await tick();}
async function theme(name){if(document.documentElement.dataset.theme!==name){document.querySelector('.theme-toggle').click();await tick();}assert.equal(document.documentElement.dataset.theme,name);}
function borders(area,empty,kind){
 assert.ok(area,kind+' area exists');assert.equal(area.classList.contains('is-empty'),empty);assert.equal(area.classList.contains('is-loaded'),!empty);
 const css=w.getComputedStyle(area);
 for(const side of ['Top','Right','Bottom','Left']){
  assert.equal(css['border'+side+'Width'],empty?'4px':'0px',kind+' has the right border width');
  if(empty)assert.equal(css['border'+side+'Style'],'dashed',kind+' empty outline is dashed');
  const total=parseFloat(css['border'+side+'Width'])+parseFloat(css['padding'+side]);
  assert.equal(total,kind==='central'?10:['Top','Bottom'].includes(side)?18:12,kind+' keeps the same border plus padding inset');
 }
 if(empty)assert.equal(css.borderTopColor,document.documentElement.dataset.theme==='dark'?'rgb(204, 227, 250)':'rgb(16, 47, 75)');
 if(empty&&kind==='central'){
  assert.equal(area.getAttribute('role'),'group');assert.equal(area.tabIndex,-1,'empty surface does not duplicate its button tab stop');
  const button=area.querySelector('.empty-select-files');assert.ok(button&&!button.disabled);assert.equal(button.tabIndex,0);button.focus();assert.equal(document.activeElement,button,'empty drop/paste focus moves to the native picker button');
 }else assert.equal(area.getAttribute('tabindex'),'0','loaded or sidebar drop/paste focus target remains enabled');
}
function drop(files,target=central()){
 const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files'],files}});
 target.dispatchEvent(event);assert.ok(event.defaultPrevented,'drop still accepted through the same target');
}
function paste(files,target=central()){
 const event=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{items:files.map(file=>({kind:'file',type:file.type,getAsFile:()=>file})),files}});
 target.dispatchEvent(event);assert.ok(event.defaultPrevented,'paste fixture still accepted without accessing native clipboard');
}
function clear(){const button=[...document.querySelectorAll('button')].find(candidate=>candidate.textContent==='Vider');assert.ok(button&&!button.disabled);button.click();}
async function ready(){await until(()=>document.querySelector('.profile-control select')&&!document.querySelector('.profile-control select').disabled,'ready for import');}

try{
 await ready();assert.equal(sidebar(),null,'Single is the initial mode');
 for(const name of ['light','dark']){await theme(name);borders(central(),true,'central');}
 await theme('light');
 const source=await sharp({create:{width:160,height:100,channels:4,background:{r:20,g:80,b:160,alpha:.7}}}).png().toBuffer();
 const image=name=>new File([source],name,{type:'image/png'});
 drop([image('single.png'),image('single-ignored.png')]);
 await until(()=>document.querySelector('.source-filename')?.textContent==='single.png'&&!!central().querySelector('.canvas-wrap:not(.is-empty)'),'Single loaded preview');await ready();
 assert.equal(previewRequests,1,'Single still imports only the first image');
 for(const name of ['light','dark']){await theme(name);borders(central(),false,'central');}
 await mode(1);assert.equal(rows().length,1);borders(central(),false,'central');borders(sidebar(),false,'sidebar');
 for(const name of ['light','dark']){await theme(name);borders(central(),false,'central');borders(sidebar(),false,'sidebar');}
 drop([image('second.png'),image('third.png')],sidebar());await until(()=>rows().length===3&&rows().every(row=>!!row.querySelector('img')),'Batch loaded drop');await ready();
 borders(central(),false,'central');borders(sidebar(),false,'sidebar');
 paste([image('pasted.png')],sidebar());await until(()=>rows().length===4&&rows().every(row=>!!row.querySelector('img')),'loaded Batch paste');await ready();
 assert.equal(previewRequests,4);borders(central(),false,'central');borders(sidebar(),false,'sidebar');
 await mode(0);borders(central(),false,'central');assert.equal(sidebar(),null);
 await mode(1);borders(central(),false,'central');borders(sidebar(),false,'sidebar');

 // Central emptiness follows the selected preview; sidebar emptiness follows any loaded preview.
 const malformed=new File(['invalid image bytes'],'broken.png',{type:'image/png'});
 paste([malformed],sidebar());await until(()=>rows().at(-1)?.querySelector('.file-status.error'),'malformed image');await ready();
 rows().at(-1).querySelector('.file-select').click();await tick();
 assert.equal(document.querySelector('.source-filename').textContent,'broken.png');
 borders(central(),true,'central');borders(sidebar(),false,'sidebar');
 rows()[0].querySelector('.file-select').click();await tick();borders(central(),false,'central');

 clear();await tick();assert.equal(rows().length,0);assert.equal(blobUrls.size,0,'clearing revokes all loaded previews');
 for(const name of ['light','dark']){await theme(name);borders(central(),true,'central');borders(sidebar(),true,'sidebar');}
 paste([malformed],sidebar());await until(()=>rows().length===1&&!!rows()[0].querySelector('.file-status.error'),'failure-only batch');await ready();
 borders(central(),true,'central');borders(sidebar(),true,'sidebar');
 clear();await tick();await mode(0);borders(central(),true,'central');
 paste([image('single-paste.png')]);await until(()=>!!central().querySelector('.canvas-wrap:not(.is-empty)'),'empty Single paste');await ready();borders(central(),false,'central');
 await mode(1);clear();await tick();borders(central(),true,'central');borders(sidebar(),true,'sidebar');await mode(0);borders(central(),true,'central');
 assert.equal(document.querySelector('.download-counter span').textContent,'0');assert.ok(counterReads>=1);
 console.log('PASS actual Prep/WASM + production CSS: Single/Batch empty→loaded→empty drop borders, light/dark colors, stable border-plus-padding insets, mode preservation, all-clear restoration, selected malformed preview and failure-only empty states, loaded and empty drop/paste handlers. Counter unchanged; no exports, live HTTP or native clipboard. jsdom does not paint canvas or prove physical drag.');
}finally{root.unmount();dom.window.close();}
