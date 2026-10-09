import './style.css';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { cropRect, outputSize } from './crop.js';

const defaults = [
  { name: 'Article image', width: 830, height: 553, cap: 1000, circle: false, uottawa: true },
  { name: 'Article / event card', width: 390, height: 260, cap: 0, circle: false, uottawa: true },
  { name: 'Author portrait', width: 80, height: 80, cap: 200, circle: true, uottawa: true },
  { name: 'Circular card', width: 200, height: 200, cap: 0, circle: true, uottawa: true },
  { name: 'Custom client profile', width: 1200, height: 800, cap: 0, circle: false, uottawa: false },
];
let presets = structuredClone(defaults);
try { const saved = JSON.parse(localStorage.getItem('web-image-prep-presets')); if (Array.isArray(saved) && saved.length === 5 && saved.every(p => Number.isInteger(p.width) && p.width > 0 && p.width <= 10000 && Number.isInteger(p.height) && p.height > 0 && p.height <= 10000 && Number.isFinite(p.cap) && p.cap >= 0 && p.cap <= 100000)) presets = saved.map((p,i) => ({...defaults[i], width:p.width,height:p.height,cap:p.cap,circle:Boolean(p.circle)})); } catch { /* Use verified defaults. */ }
let items = [], selected = null, busy = false, directory = '', profileIndex = 0;
let previewImage = null, view = null, pointer = null;
const $ = id => document.getElementById(id);
const bytes = n => n >= 1000000 ? `${(n / 1000000).toFixed(2)} MB` : `${(n / 1000).toFixed(1)} KB`;
document.querySelector('#app').innerHTML = `
  <header><div><span class="mark">W</span><div><h1>Web image prep</h1><p>Small files. Sharp images. Ready for the web.</p></div></div><span class="privacy">● Local processing only</span></header>
  <main>
    <aside class="queue panel"><div class="section-heading"><h2>Your images <span id="count">0</span></h2><button id="clear" class="text-button">Clear</button></div>
      <button id="add" class="drop"><span class="plus">＋</span><strong>Add images</strong><span>or drop files into this window</span><small>JPEG · PNG · WebP</small></button>
      <div id="files" role="list" aria-label="Image batch"></div>
      <p class="aside-note">Originals stay untouched.<br>Exports get unique names.</p>
    </aside>
    <section class="workspace">
      <div class="preview panel"><div class="section-heading"><div><h2 id="preview-title">Make room for a better image</h2><p id="preview-detail">Select an image to position your crop.</p></div><button id="reset" class="text-button">Reset crop</button></div>
        <div class="canvas-wrap"><canvas id="canvas" width="1000" height="610" tabindex="0" aria-label="Crop preview. Drag to move crop or use arrow keys; Shift moves faster."></canvas><div id="empty"><span>▧</span><h3>Start with your originals</h3><p>Bring in a photo or graphic. Choose a profile.<br>Move the crop, then export a fresh copy.</p></div></div>
        <div class="crop-tools"><label>Crop zoom <input id="zoom" type="range" min="1" max="5" step="0.05" value="1"><span id="zoom-value">1.00×</span></label><span>Drag crop · Arrow keys to nudge</span></div>
        <p id="crop-warning" class="warning" aria-live="polite"></p>
      </div>
      <div class="settings panel"><div class="section-heading"><h2>Prepare your export</h2><span id="profile-tag" class="tag">uOttawa</span></div>
        <div class="controls"><label>Website profile<select id="profile"></select></label><label>File format<select id="format"><option value="jpeg">JPEG · photographs</option><option value="png">PNG · transparency / graphics</option><option value="webp">WebP · lossless (custom only)</option></select></label></div>
        <div class="controls dimensions"><label>Width · px<input id="width" type="number" min="1" max="10000"></label><label>Height · px<input id="height" type="number" min="1" max="10000"></label><label>Maximum · KB<input id="cap" type="number" min="0" max="100000" step="1"></label><label class="check"><input id="circle" type="checkbox"> Circle preview</label></div>
        <div class="controls"><label id="quality-label">JPEG quality ceiling <input id="quality" type="range" min="1" max="100" value="86"><span id="quality-value">86</span></label><label>JPEG transparency background<select id="background"><option value="">Require a choice if transparent</option><option value="white">White</option><option value="black">Black</option><option value="custom">Custom colour</option></select></label><label id="custom-bg-label" hidden>Background colour<input id="custom-bg" type="color" value="#ffffff"></label></div>
        <label class="check"><input id="smaller" type="checkbox"> Allow smaller derivatives when a source cannot fill the requested size</label>
        <p class="policy">0 KB means no cap · Decimal units: 1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes.<br>Circle overlays export as squares. No upscaling. JPEG quality is lowered only when needed to meet a cap.</p>
        <details><summary>Colour, metadata & supported files</summary><p>EXIF orientation is applied before cropping. Fresh derivatives omit EXIF/GPS and include an sRGB profile. Embedded RGB ICC profiles are converted to sRGB for preview and export; untagged input is assumed sRGB. Malformed, incomplete or unsupported profiles (including grayscale ICC profiles), and all CMYK/YCCK JPEGs, need conversion of a copy to sRGB in a colour-managed editor first. Matrix and LUT RGB profiles are supported. Use still images; animated PNG/WebP may import the first frame only. HEIC and RAW are deferred. WebP output is lossless only. No universal file-size cap is applied.</p><p>The four uOttawa starter profiles are editable. Full-bleed hero and business card specifications need source verification and are excluded.</p><button id="restore" class="text-button">Restore starter profiles</button></details>
      </div>
    </section>
  </main>
  <footer><div><button id="folder" class="secondary">Choose export folder</button><span id="folder-name">No folder selected</span></div><div><span id="batch-status" role="status">Ready when you are</span><button id="export" class="primary" disabled>Export batch →</button></div></footer>
  <div id="notice" role="alert" hidden></div>`;

function notify(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function preset() { return presets[profileIndex]; }
function options(item) {
  const bg = $('background').value;
  const hex = $('custom-bg').value;
  return { width: Number($('width').value), height: Number($('height').value), max_bytes: Number($('cap').value) === 0 ? null : Math.floor(Number($('cap').value) * 1000), format: $('format').value, quality: Number($('quality').value), background: bg === 'white' ? [255,255,255] : bg === 'black' ? [0,0,0] : bg === 'custom' ? [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)) : null, center_x: item.cx, center_y: item.cy, zoom: item.zoom, allow_smaller: $('smaller').checked, uottawa: preset().uottawa };
}
function validateControls() {
  for (const id of ['width','height','cap']) if (!$(id).checkValidity() || $(id).value === '') throw new Error('Enter valid width, height and maximum size.');
  if (!Number.isInteger(Number($('width').value)) || !Number.isInteger(Number($('height').value))) throw new Error('Dimensions must be whole pixels.');
}
function savePreset() {
  try { validateControls(); Object.assign(preset(), {width:Number($('width').value),height:Number($('height').value),cap:Number($('cap').value),circle:$('circle').checked}); localStorage.setItem('web-image-prep-presets', JSON.stringify(presets)); notify(''); } catch (e) { notify(e.message); }
  draw();
}
function applyPreset() {
  const p = preset(); $('width').value = p.width; $('height').value = p.height; $('cap').value = p.cap; $('circle').checked = p.circle;
  $('profile-tag').textContent = p.uottawa ? 'uOttawa' : 'Custom';
  $('format').querySelector('[value="webp"]').disabled = p.uottawa;
  if (p.uottawa && $('format').value === 'webp') $('format').value = 'jpeg';
  formatChange(); draw();
}
function formatChange() { $('quality-label').hidden = $('format').value !== 'jpeg'; $('background').disabled = $('format').value !== 'jpeg'; $('custom-bg-label').hidden = $('format').value !== 'jpeg' || $('background').value !== 'custom'; draw(); }
function updateActions() {
  $('export').disabled = busy || !directory || !items.some(i => i.id !== null);
  for (const id of ['add','clear','folder','profile','format','width','height','cap','circle','quality','background','custom-bg','smaller','zoom','reset','restore']) $(id).disabled = busy;
  $('background').disabled = busy || $('format').value !== 'jpeg';
}
function renderFiles() {
  $('count').textContent = items.length;
  $('files').replaceChildren();
  for (const item of items) {
    const row = document.createElement('button'); row.className = `file ${selected === item ? 'selected' : ''}`; row.setAttribute('role','listitem'); row.disabled = busy || item.id === null;
    if (item.thumbnail) { const img = document.createElement('img'); img.src = item.thumbnail; img.alt = ''; row.append(img); }
    const info = document.createElement('div'); const name = document.createElement('strong'); name.textContent = item.name;
    const meta = document.createElement('small'); meta.textContent = item.id === null ? 'Import failed' : `${item.width} × ${item.height} · ${bytes(item.bytes)}`;
    const status = document.createElement('span'); status.className = `file-status ${item.error ? 'error' : item.result ? 'success' : ''}`; status.textContent = item.status || 'Ready';
    info.append(name, meta, status); row.append(info); row.title = item.error || item.result?.path || item.name; row.onclick = () => select(item); $('files').append(row);
  }
  updateActions();
}
function select(item) {
  selected = item; $('zoom').value = item.zoom; $('zoom-value').textContent = `${item.zoom.toFixed(2)}×`;
  $('preview-title').textContent = item.name; $('preview-detail').textContent = `${item.width} × ${item.height} px · ${bytes(item.bytes)} original${item.alpha ? ' · transparency' : ''}`;
  $('empty').hidden = true;
  previewImage = new Image(); const current = previewImage;
  previewImage.onload = () => { if (previewImage === current) draw(); }; previewImage.src = item.thumbnail;
  renderFiles();
}
function draw() {
  const canvas = $('canvas'), ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); $('crop-warning').textContent = ''; view = null;
  if (!selected || !previewImage?.complete || !previewImage.naturalWidth) return;
  try {
    validateControls(); const o = options(selected); const c = cropRect(selected.width,selected.height,o.width,o.height,selected.cx,selected.cy,selected.zoom);
    const scale = Math.min((canvas.width-80)/selected.width, (canvas.height-60)/selected.height);
    const x = (canvas.width-selected.width*scale)/2, y = (canvas.height-selected.height*scale)/2;
    view = {x,y,scale,c}; ctx.drawImage(previewImage,x,y,selected.width*scale,selected.height*scale);
    const rx=x+c.x*scale, ry=y+c.y*scale, rw=c.width*scale, rh=c.height*scale;
    ctx.beginPath(); ctx.rect(x,y,selected.width*scale,selected.height*scale); ctx.rect(rx,ry,rw,rh); ctx.fillStyle='rgba(13,22,35,.62)'; ctx.fill('evenodd');
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.strokeRect(rx,ry,rw,rh);
    if ($('circle').checked) { ctx.beginPath(); ctx.ellipse(rx+rw/2,ry+rh/2,rw/2,rh/2,0,0,Math.PI*2); ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1; for (const f of [1/3,2/3]) { ctx.beginPath();ctx.moveTo(rx+rw*f,ry);ctx.lineTo(rx+rw*f,ry+rh);ctx.moveTo(rx,ry+rh*f);ctx.lineTo(rx+rw,ry+rh*f);ctx.stroke(); } }
    const out = outputSize(c,o.width,o.height);
    const warnings = [];
    if (out.width<o.width || out.height<o.height) warnings.push(`Too small for ${o.width}×${o.height}. ${o.allow_smaller ? `Will export ${out.width}×${out.height}` : 'Export blocked unless smaller derivatives are allowed'}.`);
    if (selected.alpha && o.format==='jpeg' && !o.background) warnings.push('Transparent JPEG export needs a background choice. PNG preserves transparency.');
    $('crop-warning').textContent = warnings.join(' ');
  } catch (e) { $('crop-warning').textContent = e.message; }
}
async function addPaths(paths) {
  if (busy) { notify('Finish the current batch before adding more files.'); return; }
  if (items.length + paths.length > 100) { notify('This prototype accepts up to 100 files in a batch.'); return; }
  busy = true; updateActions(); notify('');
  for (const path of paths) {
    $('batch-status').textContent = `Importing ${String(path).split(/[\\/]/).pop()}…`;
    try { const imported = await invoke('import_image',{path}); const item = {...imported,cx:.5,cy:.5,zoom:1,status:'Ready',error:null,result:null}; items.push(item); if (!selected) select(item); }
    catch (e) { items.push({id:null,name:String(path).split(/[\\/]/).pop(),status:String(e),error:String(e)}); }
    renderFiles();
  }
  busy = false; $('batch-status').textContent = `${items.filter(i=>i.id!==null).length} images ready`; renderFiles();
}
$('add').onclick = async () => { try { const paths = await open({multiple:true,filters:[{name:'Web images',extensions:['jpg','jpeg','png','webp']}]}); if (paths) await addPaths(Array.isArray(paths)?paths:[paths]); } catch (e) { notify(String(e)); } };
$('folder').onclick = async () => { try { const chosen = await open({directory:true,multiple:false,title:'Choose export folder'}); if (chosen) { directory=chosen; $('folder-name').textContent=chosen; $('folder-name').title=chosen; updateActions(); } } catch(e) { notify(String(e)); } };
$('export').onclick = async () => {
  try { validateControls(); } catch(e) { notify(e.message); return; }
  busy=true; updateActions(); notify(''); const batch=items.filter(i=>i.id!==null); let done=0, failed=0;
  const requests=batch.map(item=>({item,options:options(item)}));
  for (const {item,options:request} of requests) {
    item.status='Cropping · compressing · writing…'; item.error=null; item.result=null; renderFiles(); $('batch-status').textContent=`Exporting ${done+failed+1} of ${batch.length}`;
    try { const result = await invoke('export_image',{id:item.id,directory,options:request}); item.result=result; item.status=`✓ ${result.width}×${result.height} · ${bytes(result.bytes)}${result.quality ? ` · Q${result.quality}` : ''}${result.warning ? ' · smaller' : ''}`; done++; }
    catch(e) { item.error=String(e); item.status=String(e); failed++; }
    renderFiles();
  }
  busy=false; $('batch-status').textContent=`${done} exported${failed ? ` · ${failed} failed — see file details` : ' · originals preserved'}`; renderFiles();
};
$('clear').onclick = async () => {
  busy=true; updateActions();
  for (const item of items) if (item.id!==null) { try { await invoke('forget_image',{id:item.id}); } catch(e) { notify(String(e)); } }
  items=[]; selected=null; previewImage=null; busy=false; $('empty').hidden=false; $('preview-title').textContent='Make room for a better image'; $('preview-detail').textContent='Select an image to position your crop.'; $('batch-status').textContent='Ready when you are'; draw(); renderFiles();
};
$('reset').onclick = () => { if(selected) {selected.cx=.5;selected.cy=.5;selected.zoom=1;$('zoom').value=1;$('zoom-value').textContent='1.00×';draw();} };
$('zoom').oninput = () => { if(selected) {selected.zoom=Number($('zoom').value);$('zoom-value').textContent=`${selected.zoom.toFixed(2)}×`;draw();} };
$('quality').oninput = () => { $('quality-value').textContent=$('quality').value; };
$('profile').onchange = () => {profileIndex=Number($('profile').value);applyPreset();};
for (const id of ['width','height','cap','circle']) $(id).onchange=savePreset;
for (const id of ['format','background']) $(id).onchange=formatChange;
$('smaller').onchange=draw;
$('restore').onclick = () => {presets=structuredClone(defaults);localStorage.removeItem('web-image-prep-presets');applyPreset();};
const canvas=$('canvas');
canvas.onpointerdown = e => { if (busy || !selected || !view) return; pointer={x:e.clientX,y:e.clientY,cx:selected.cx,cy:selected.cy}; canvas.setPointerCapture(e.pointerId); };
canvas.onpointermove = e => { if(!pointer || !view || busy) return; const rect=canvas.getBoundingClientRect(); selected.cx=Math.max(0,Math.min(1,pointer.cx+(e.clientX-pointer.x)*canvas.width/rect.width/view.scale/selected.width)); selected.cy=Math.max(0,Math.min(1,pointer.cy+(e.clientY-pointer.y)*canvas.height/rect.height/view.scale/selected.height)); draw(); };
canvas.onpointerup = canvas.onpointercancel = () => {pointer=null;};
canvas.onkeydown = e => { if (!selected || busy || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return; e.preventDefault(); const delta=e.shiftKey?0.05:0.01; selected.cx=Math.max(0,Math.min(1,selected.cx+(e.key==='ArrowRight'?delta:e.key==='ArrowLeft'?-delta:0))); selected.cy=Math.max(0,Math.min(1,selected.cy+(e.key==='ArrowDown'?delta:e.key==='ArrowUp'?-delta:0))); draw(); };
presets.forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=p.name;$('profile').append(option);});
applyPreset(); renderFiles();
getCurrentWebview().onDragDropEvent(event => {
  if(event.payload.type==='drop') { $('add').classList.remove('dragging'); void addPaths(event.payload.paths); }
  else if(event.payload.type==='enter') $('add').classList.add('dragging');
  else if(event.payload.type==='leave') $('add').classList.remove('dragging');
}).catch(e=>notify(`Native file drop unavailable: ${e}`));
