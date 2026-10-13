// Connect only to the CI app process's loopback WebView2 debugger. No mocks.
// The workflow temporarily supplies debugging arguments to its smoke-test
// process; no debug flags or changes to security policy ship in the app.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import guide from '../../src/uottawa-specifications.json' with { type: 'json' };

const [mode, portText, presetName, output] = process.argv.slice(2);
const port = Number(portText);
assert.ok(['create', 'verify'].includes(mode) && Number.isInteger(port) && port > 0 && presetName && output, 'Usage: preset-smoke.mjs create|verify PORT NAME OUTPUT');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let page;
for (let i=0;i<80;i++) {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, {signal:AbortSignal.timeout(1500)})).json();
    page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
    if (page) break;
  } catch { /* WebView2 is still starting. */ }
  await pause(250);
}
assert.ok(page, 'Native app WebView2 must expose the CI-only loopback debugger');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject) => {
  const timeout=setTimeout(() => reject(new Error('Native debugger connection timed out')),10000);
  socket.onopen=() => {clearTimeout(timeout);resolve();};
  socket.onerror=() => {clearTimeout(timeout);reject(new Error('Native debugger connection failed'));};
});
let id = 0;
const pending = new Map(), passed = [], errors = [];
socket.onmessage = event => {
  const message=JSON.parse(event.data);
  if(message.id) {
    const request=pending.get(message.id); if(!request) return;
    pending.delete(message.id);clearTimeout(request.timeout);
    message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
  } else if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
};
const cdp = (method,params={}) => new Promise((resolve,reject) => {
  const requestId=++id;
  const timeout=setTimeout(() => {pending.delete(requestId);reject(new Error(`Native debugger timed out: ${method}`));},10000);
  pending.set(requestId,{resolve,reject,timeout});socket.send(JSON.stringify({id:requestId,method,params}));
});
const evaluate = async expression => {
  const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  assert.ok(!result.exceptionDetails,result.exceptionDetails?.exception?.description || 'Native page evaluation failed');
  return result.result.value;
};
const check = async (name, expression) => {
  let result=false;
  for(let i=0;i<80;i++){result=await evaluate(expression);if(result===true)break;await pause(100);}
  assert.equal(result,true,name);passed.push(name);console.log(`PASS native ${name}`);
};
try {
  await cdp('Runtime.enable');await cdp('Page.enable');
  await check('re-image document and displayed product name', `document.title==='re-image' && document.querySelector('header h1')?.textContent==='re-image'`);
  await check('small readable creator credit is displayed', `document.querySelector('.creator-credit')?.textContent==='Created by Ryan O\u2019Connor' && parseFloat(getComputedStyle(document.querySelector('.creator-credit')).fontSize)>=12`);
  await check('Create preset button is available in the compiled app', `Boolean(document.getElementById('create-preset')?.onclick)`);
  await check('all 34 official component titles are in the compiled app', `JSON.stringify(Array.from(document.querySelectorAll('#profile optgroup')[0].children).map(o=>o.textContent))===${JSON.stringify(JSON.stringify(guide.components.map(c=>c.name)))}`);
  if(mode==='create') {
    await evaluate(`sessionStorage.setItem('web-image-prep-native-smoke-session',${JSON.stringify(presetName)})`);
    await evaluate(`document.getElementById('create-preset').scrollIntoView({block:'center'});document.getElementById('create-preset').click()`);
    await check('creation form opens in the native WebView', `document.getElementById('preset-dialog').open`);
    await evaluate(`(() => {const values=${JSON.stringify({'preset-name':presetName,'preset-width':'1280','preset-height':'720','preset-format':'png','preset-cap':'250'})};for(const [id,value] of Object.entries(values))document.getElementById(id).value=value;document.getElementById('preset-form').requestSubmit();})()`);
    await check('new preset is saved and selected', `!document.getElementById('preset-dialog').open && document.getElementById('profile').selectedOptions[0]?.textContent===${JSON.stringify(presetName)}`);
  } else {
    await check('native restart has a new WebView session', `sessionStorage.getItem('web-image-prep-native-smoke-session')!==${JSON.stringify(presetName)}`);
    await check('saved name survives native process restart', `Array.from(document.getElementById('profile').options).some(p=>p.textContent===${JSON.stringify(presetName)})`);
    await evaluate(`(() => {const select=document.getElementById('profile');select.value=Array.from(select.options).find(p=>p.textContent===${JSON.stringify(presetName)}).value;select.dispatchEvent(new Event('change'));})()`);
  }
  await check('stored dimensions, format and target are restored safely', `document.getElementById('width').value==='1280' && document.getElementById('height').value==='720' && document.getElementById('format').value==='png' && document.getElementById('cap').value==='250' && !document.getElementById('smaller').checked && document.getElementById('profile-tag').textContent==='Custom'`);
  await check('uOttawa saved profiles retain JPEG/PNG restriction', `JSON.parse(localStorage.getItem('web-image-prep-presets')).filter(p=>p.uottawa).every(p=>['jpeg','png'].includes(p.format))`);
  assert.deepEqual(errors,[],'No uncaught native WebView errors');
  await mkdir(output,{recursive:true});
  const screenshot=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(path.join(output,`native-preset-${mode}.png`),Buffer.from(screenshot.data,'base64'));
  await writeFile(path.join(output,`native-preset-${mode}.json`),JSON.stringify({mode,presetName,passed,errors,nativeTauri:'real compiled app; no adapters mocked'},null,2));
} finally {socket.close();}
