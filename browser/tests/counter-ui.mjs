// Run from browser/. Actual Prep in jsdom; all HTTP/timers are controlled fixtures.
// No production requests, image imports, native clipboard or browser download occurs.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
require('esbuild').buildSync({
 entryPoints:['app/prep.tsx'],outfile:'work/counter-ui-qa.cjs',bundle:true,
 platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],
});
const {JSDOM}=await import('../work/qa-runtime/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<div id="client-a"></div><div id="client-b"></div>',{url:'http://counter-fixture.test',pretendToBeVisual:true});
const w=dom.window;
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLCanvasElement','Event','MouseEvent','Image','localStorage']){
 globalThis[key]=key==='window'?w:w[key];
}
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;

const nativeSetInterval=globalThis.setInterval,nativeClearInterval=globalThis.clearInterval;
const intervals=new Map();let intervalId=0,visibility='visible';
Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>visibility});
globalThis.setInterval=(callback,delay)=>{
 assert.equal(delay,30000,'counter refresh cadence stays at 30 seconds');
 const id=++intervalId;intervals.set(id,callback);return id;
};
globalThis.clearInterval=id=>intervals.delete(id);
const requests=[];
globalThis.fetch=(path,options={})=>{
 assert.equal(path,'/api/downloads','anonymous counter reads only its public aggregate endpoint');
 assert.equal(options.method??'GET','GET','this UI fixture never submits counter events');
 assert.equal(options.cache,'no-store');
 assert.ok(options.signal instanceof AbortSignal,'counter read has its timeout signal');
 let resolve,reject;
 const result=new Promise((yes,no)=>{resolve=yes;reject=no;});
 requests.push({resolve,reject,settled:false});return result;
};
const React=await import('react'),{createRoot}=await import('react-dom/client');
const {act}=React,Prep=require('../work/counter-ui-qa.cjs').default;
const a=document.getElementById('client-a'),b=document.getElementById('client-b');
const rootA=createRoot(a),rootB=createRoot(b);
const displayed=container=>container.querySelector('.download-total')?.textContent;
const label=container=>container.querySelector('.download-counter')?.firstChild.textContent.trim();
const pending=()=>requests.filter(request=>!request.settled);
async function flush(fn=()=>{}){await act(async()=>{fn();await Promise.resolve();});}
async function reply(request,total){
 assert.ok(request&&!request.settled,'each fixture request settles once');request.settled=true;
 await flush(()=>request.resolve({ok:true,status:200,json:async()=>({total})}));
}
async function fail(request,kind='network'){
 assert.ok(request&&!request.settled);request.settled=true;
 await flush(()=>kind==='network'?request.reject(Error('Offline fixture')):request.resolve({ok:false,status:503,json:async()=>({error:'Unavailable fixture'})}));
}
async function visibleRefresh(){visibility='visible';await flush(()=>document.dispatchEvent(new w.Event('visibilitychange')));}
async function intervalRefresh(){await flush(()=>{for(const callback of [...intervals.values()])callback();});}
function languageButton(container,name){
 const button=[...container.querySelectorAll('button')].find(candidate=>candidate.getAttribute('aria-label')===name);
 assert.ok(button,'localized language control exists: '+name);return button;
}

try{
 await flush(()=>rootA.render(React.createElement(Prep,{signedIn:false})));
 assert.match(a.querySelector('.release-version').textContent,/Version 27 · Publiée le 23 oct\. 2026/);assert.equal(a.querySelector('.release-version time').getAttribute('datetime'),'2026-10-23');assert.equal(a.querySelector('.release-status').children.length,1);assert.equal(a.querySelectorAll('.download-counter').length,1);assert.equal(a.querySelectorAll('.time-saved').length,1);assert.ok(a.querySelector('header .header-metrics .download-counter'));assert.ok(a.querySelector('header .header-metrics .time-saved'));assert.equal(a.querySelector('.header-metrics').children[0].className,'download-counter');assert.equal(a.querySelector('.header-metrics').children[1].className,'time-saved');assert.equal(a.querySelector('.download-counter .metric-label-short').textContent,'Téléchargées :');assert.equal(a.querySelector('.download-counter .metric-label-short').getAttribute('aria-hidden'),'true');assert.equal(a.querySelector('.release-status .download-analytics'),null);
 assert.equal(a.querySelector('.time-saved-value').textContent,'—');
 const explanation=a.querySelector('.savings-explanation');
 for(const text of ['120 s','12,5 s','107,5 s','90 à 150 s','10 à 15 s','45 s','plus de 150 s'])assert.ok(explanation.textContent.includes(text),text);
 const details=a.querySelector('.time-saved'),summary=details.querySelector('summary');
 await flush(()=>summary.click());assert.equal(details.open,true,'touch/click opens explanation');
 await flush(()=>summary.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 assert.equal(details.open,false);assert.equal(document.activeElement,summary,'Escape keeps keyboard focus on explanation control');
 assert.equal(intervals.size,1);
 assert.equal(pending().length,1);
 assert.equal(displayed(a),'—','unverified initial state uses a dash, never a fabricated zero');
 assert.equal(label(a),'Total des images téléchargées :','French label is exact');
 assert.equal(a.querySelector('.download-counter').title,'Images générées et envoyées au navigateur pour téléchargement. L’enregistrement sur disque ne peut pas être confirmé.');
 await fail(pending()[0]);
 assert.equal(displayed(a),'—','failed initial read retains the unverified dash');

 visibility='hidden';const beforeHidden=requests.length;
 await flush(()=>document.dispatchEvent(new w.Event('visibilitychange')));
 await intervalRefresh();
 assert.equal(requests.length,beforeHidden,'hidden document does not poll or refresh');
 await visibleRefresh();assert.equal(pending().length,1);
 await reply(pending()[0],0);
 assert.equal(displayed(a),'0','a verified real zero is displayed');
 assert.equal(a.querySelector('.time-saved-value').textContent,'0 min');
 await intervalRefresh();await reply(pending()[0],1);assert.equal(a.querySelector('.time-saved-value').textContent,'1,8 min');
 await intervalRefresh();await reply(pending()[0],3);assert.equal(a.querySelector('.time-saved-value').textContent,'5,4 min');
 await intervalRefresh();await reply(pending()[0],17);
 assert.equal(displayed(a),'17','later verified aggregate is displayed');

 await visibleRefresh();await visibleRefresh();
 const [older,newer]=pending();assert.equal(pending().length,2);
 await reply(newer,83);assert.equal(displayed(a),'83');
 await reply(older,42);
 assert.equal(displayed(a),'83','late older response cannot reduce the verified total');
 await intervalRefresh();await fail(pending()[0],'service');
 assert.equal(displayed(a),'83','service failure retains the last verified total');
 await visibleRefresh();await fail(pending()[0]);
 assert.equal(displayed(a),'83','network failure retains the last verified total');
 for(const invalid of [-1,'999',null,Number.MAX_SAFE_INTEGER+1]){
  await visibleRefresh();await reply(pending()[0],invalid);
  assert.equal(displayed(a),'83','invalid server totals are rejected: '+String(invalid));
 }

 // A second actual component represents an independent reader of the same fixture aggregate.
 await flush(()=>rootB.render(React.createElement(Prep,{signedIn:false})));
 assert.equal(intervals.size,2);assert.equal(displayed(b),'—');
 await reply(pending()[0],83);
 assert.equal(displayed(b),'83','new client reads shared total, without local backfill');
 assert.equal(b.querySelector('.time-saved-value').textContent,'2,5 h','new reader derives estimate from persisted shared total');
 assert.equal(label(b),'Total des images téléchargées :');
 await visibleRefresh();assert.equal(pending().length,2);
 const sharedAggregate=1289;
 for(const request of pending())await reply(request,sharedAggregate);
 const frenchTotal=new Intl.NumberFormat('fr').format(sharedAggregate);
 assert.equal(displayed(a),frenchTotal);assert.equal(displayed(b),frenchTotal);
 await flush(()=>languageButton(a,'Passer en anglais').click());
 assert.match(a.querySelector('.release-version').textContent,/Version 27 · Published Oct 23, 2026/);
 assert.equal(label(a),'Total downloaded images:','English label is exact');assert.equal(a.querySelector('.download-counter .metric-label-short').textContent,'Downloaded:');assert.equal(a.querySelector('.time-saved .metric-label-short').textContent,'Est. saved:');
 assert.equal(displayed(a),'1,289','English locale formats the same verified number');
 assert.equal(a.querySelector('.time-saved-value').textContent,'38.5 h');
 for(const text of ['120 s','12.5 s','107.5 s','90–150 s','10–15 s','45 s','longer than 150 s'])assert.ok(explanation.textContent.includes(text),text);
 assert.equal(a.querySelector('.download-counter').title,'Images generated and dispatched to the browser for download. Saving to disk cannot be confirmed.');
 assert.equal(label(b),'Total des images téléchargées :','one client language change leaves the other client language intact');
 assert.equal(displayed(b),frenchTotal);
 await flush(()=>languageButton(a,'Switch to French').click());
 assert.equal(label(a),'Total des images téléchargées :');assert.equal(displayed(a),frenchTotal);
 await intervalRefresh();assert.equal(pending().length,2);
 for(const request of pending())await reply(request,1450);
 const verified1450=new Intl.NumberFormat('fr').format(1450);
 assert.equal(displayed(a),verified1450);assert.equal(displayed(b),verified1450);
 await intervalRefresh();const [failedA,failedB]=pending();
 await fail(failedA);await fail(failedB,'service');
 assert.equal(displayed(a),verified1450);assert.equal(displayed(b),verified1450);

 // Unmount cleanup removes polling/listeners and ignores a request already in flight.
 await visibleRefresh();const [unmountedRequest,survivingRequest]=pending();
 await flush(()=>rootA.unmount());assert.equal(intervals.size,1);
 await reply(unmountedRequest,9999);assert.equal(a.querySelector('.download-counter'),null);
 await reply(survivingRequest,2000);assert.equal(displayed(b),new Intl.NumberFormat('fr').format(2000));
 await flush(()=>rootB.unmount());assert.equal(intervals.size,0);
 const beforeCleanup=requests.length;await visibleRefresh();await intervalRefresh();
 assert.equal(requests.length,beforeCleanup,'unmounted readers leave no counter refresh activity');
 assert.equal(pending().length,0);
 console.log('PASS actual Prep counter UI: initial failed read dash, verified zero, later totals, out-of-order monotonicity, invalid totals/outages preserve verified value, exact FR/EN labels and formatting, two independent readers of shared fixture aggregate, visible-only refresh and unmount cleanup. No native clipboard, live events or 30-second waits.');
}finally{
 globalThis.setInterval=nativeSetInterval;globalThis.clearInterval=nativeClearInterval;
 dom.window.close();delete globalThis.IS_REACT_ACT_ENVIRONMENT;
}
