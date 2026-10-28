// Actual React panel; only the external cloud response and OS clipboard are controlled.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
require('esbuild').buildSync({entryPoints:['app/alt-text-panel.tsx'],outfile:'work/alt-text-qa.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const {JSDOM}=await import('../work/qa-runtime/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<div id="root"></div>',{url:'http://alt-text.test'}),w=dom.window;
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','MouseEvent'])globalThis[key]=key==='window'?w:w[key];
Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const copied=[],requests=[];navigator.clipboard={writeText:async text=>copied.push(text)};
globalThis.fetch=(url,options)=>{assert.equal(url,'/api/alt-text');return new Promise(resolve=>requests.push({options,resolve}));};
globalThis.Worker=class{constructor(){throw Error('Cloud generation must not download browser models');}};
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const Panel=require('../work/alt-text-qa.cjs').default,root=createRoot(document.getElementById('root'));
let itemId='one',sourceKey='crop-one',lang='en',draft={};
function render(){root.render(React.createElement(Panel,{lang,itemId,sourceKey,draft,disabled:false,canGenerate:true,onChange:d=>{draft=d;render();},prepareImage:async()=>new Blob(['encoded final crop'],{type:'image/png'})}));}
async function flush(fn){await act(async()=>{fn();await Promise.resolve();});}
async function click(text){const el=[...document.querySelectorAll('button')].find(x=>x.textContent===text);assert.ok(el,text);await flush(()=>el.click());}
async function fill(index,text){await flush(()=>{const el=document.querySelectorAll('textarea')[index];Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype,'value').set.call(el,text);el.dispatchEvent(new w.Event('input',{bubbles:true}));});}
try{
 await flush(render);assert.equal(requests.length,0,'no cloud upload before Generate');
 await fill(0,'A library.');await fill(1,'Une bibliothèque.');
 await click('Copy both');assert.equal(copied.at(-1),'EN: A library.\n\nFR: Une bibliothèque.');
 assert.equal(document.querySelectorAll('textarea').length,2);
 assert.equal(document.querySelector('.alt-toolbar button').textContent,'Generate alt text');
 assert.equal(document.querySelector('.alt-info').open,false,'notices collapsed by default');
 assert.ok(document.querySelector('.alt-field textarea + button'),'copy follows each text area');
 assert.equal(document.querySelector('.alt-footer'),null);
 sourceKey='crop-two';await flush(render);assert.match(document.querySelector('.alt-info-content').textContent,/changed/);assert.equal(draft.en,'A library.');
 await click('Generate alt text');assert.equal(requests.length,0,'regeneration waits for explicit replace');await click('Keep my text');assert.equal(draft.fr,'Une bibliothèque.');
 await click('Generate alt text');await click('Replace both drafts');assert.equal(requests.length,1,'Generation must use the Cloudflare endpoint');const first=requests.at(-1);
 assert.equal(await first.options.body.text(),'encoded final crop');
 await click('Stop waiting');assert.ok(first.options.signal.aborted);await flush(()=>first.resolve({ok:true,json:async()=>({en:'Late',fr:'En retard'})}));assert.equal(draft.en,'A library.','cancelled completion cannot overwrite edits');
 draft={};await flush(render);await click('Generate alt text');const second=requests.at(-1);
 await flush(()=>second.resolve({ok:true,json:async()=>({en:'Two cats.',fr:'Deux chats.'})}));assert.equal(draft.fr,'Deux chats.');assert.equal(draft.basedOn,'crop-two');
 await click('Copy');assert.equal(copied.at(-1),'Two cats.');
 assert.ok(!document.querySelector('.alt-panel').textContent.includes('CSV'));
 lang='fr';await flush(render);assert.equal(document.querySelector('.alt-panel').getAttribute('aria-label'),'Texte alternatif');
 draft={};await flush(render);await click('Générer le texte alternatif');const third=requests.at(-1);
 itemId='two';draft={};await flush(render);assert.ok(third.options.signal.aborted);
 await flush(()=>third.resolve({ok:true,json:async()=>({en:'Wrong image',fr:'Mauvaise image'})}));assert.equal(draft.en,undefined,'switching images prevents stale results crossing images');
 console.log('PASS actual React alt-text panel: explicit cloud upload, bilingual editing/copy, crop-change warning, replacement confirmation, real crop Blob dispatch, cancellation, compact layout without CSV, French UI and cross-image result isolation.');
}finally{await flush(()=>root.unmount());dom.window.close();}
