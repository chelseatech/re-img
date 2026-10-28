'use client';
import {useEffect,useRef,useState} from 'react';
import {starters,cleanPreset,mergePresets,isConfigured,availableDefaults} from '../lib/preferences.mjs';
import {imageFilename,filenameStem,editableFilenameStem,dimensions} from '../lib/naming.mjs';
import {undersized} from '../lib/image-warning.mjs';
import {messages,presetLabel,languageOf,byteLabel,errorText} from '../lib/i18n.mjs';
import {catalogueById} from '../lib/catalogue.mjs';
import {zip} from '../lib/zip.mjs';
import {prepareBatch} from '../lib/batch.mjs';
import CropCanvas from './crop-canvas';
import Help from './help';
import PresetPicker,{ImageSpecsReference} from './preset-picker';
import release from '../lib/release.json';
import AltTextPanel,{type AltDraft} from './alt-text-panel';
import {altSourceKey,altTextCsv} from '../lib/alt-text.mjs';
import {createAltImage,altAnalysisSettings} from '../lib/alt-image.mjs';
import {formatTimeSaved} from '../lib/time-saved.mjs';
import {flexiblePolicy,flexibleDefault,flexibleMaximum} from '../lib/flexible-size.mjs';
import {clipboardImages} from '../lib/clipboard-images.mjs';
import {readDownloadTotal,reportDownload} from '../lib/download-count.mjs';
import {lockedPreset,presetRatioLabel,imageByteLimit,assertOutput} from '../lib/export-policy.mjs';
import {assertInputSize} from '../public/engine/input-policy.mjs';
type Preset={id:string,name:string,width:number|null,height:number|null,fit:string,format:string,quality:number,maxKB:number,background:string,naming:string,centerX:number,centerY:number,zoom:number,byteBase:number,circle:boolean};
type Output={url:string,bytes:Uint8Array,width:number,height:number,warning?:string,quality?:number,format:string,name:string};
type Item={id:string,file:File,stem:string,suffix:boolean,preset:Preset|null,ratioLabel:string,status:string,error?:string,preview?:string,width?:number,height?:number,alpha?:boolean,crop:{x:number,y:number,zoom:number},out?:Output,alt?:AltDraft};
const emptyPreset={...starters[0],width:null,height:null};
function Arrow(){return <svg aria-hidden="true" className="download-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg>;}
export default function Prep(){
 const [dark,setDark]=useState(false);
 const [downloadTotal,setDownloadTotal]=useState<number|null>(null);
 const receiveTotal=(value:number)=>setDownloadTotal(previous=>Math.max(previous??0,value));
 useEffect(()=>{let active=true;const refresh=()=>{void readDownloadTotal().then(value=>{if(active)receiveTotal(value);}).catch(()=>{});};refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh();},30000);const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[]);
 const addRef=useRef<(files:FileList|File[])=>void>(()=>{});addRef.current=files=>{void add(files,false,true);};
 const [searchFocusToken,setSearchFocusToken]=useState(0),interactionRevision=useRef(0);
 useEffect(()=>{const activity=()=>{interactionRevision.current++;};const focus=(e:FocusEvent)=>{if(e.target!==document.body)activity();};document.addEventListener('keydown',activity,true);document.addEventListener('beforeinput',activity,true);document.addEventListener('pointerdown',activity,true);document.addEventListener('focusin',focus,true);return()=>{document.removeEventListener('keydown',activity,true);document.removeEventListener('beforeinput',activity,true);document.removeEventListener('pointerdown',activity,true);document.removeEventListener('focusin',focus,true);};},[]);
 const emptyPicker=useRef<HTMLInputElement|null>(null);
 const [mode,setMode]=useState<'single'|'batch'>('single');
 const [ratioLabel,setRatioLabel]=useState('');
 const [presets]=useState<Preset[]>(mergePresets(starters)),[selected,setSelected]=useState(''),[p,setP]=useState<Preset>(emptyPreset);
 const [lang,setLang]=useState<'fr'|'en'>('fr'),[help,setHelp]=useState(false),[items,setItems]=useState<Item[]>([]),[active,setActive]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState({kind:'reading',index:0,total:0}),[notice,setNotice]=useState(''),[newName,setNewName]=useState('');
 const worker=useRef<Worker|null>(null),pending=useRef<{id:number,resolve:Function,reject:Function}|null>(null),counter=useRef(0),generation=useRef(0),cancel=useRef(false),busyRef=useRef(false),urls=useRef(new Set<string>()),itemRef=useRef(items),languageRef=useRef<'fr'|'en'>('fr');
 itemRef.current=items;languageRef.current=lang;
 const archive=useRef<{url:string,name:string,imageCount:number}|null>(null);
 const t=messages[lang],bytes=(n:number)=>byteLabel(n,lang);
 function invalidateArchive(){revoke(archive.current?.url);archive.current=null;}
 function url(data:Uint8Array,type:string){const u=URL.createObjectURL(new Blob([data as BlobPart],{type}));urls.current.add(u);return u;}
 function revoke(u?:string){if(u){URL.revokeObjectURL(u);urls.current.delete(u);}}
 function resetWorker(){generation.current++;worker.current?.terminate();worker.current=null;pending.current?.reject(Error('Interrupted. Retry to continue.'));pending.current=null;}
 function setWorking(value:boolean){busyRef.current=value;setBusy(value);}
 useEffect(()=>()=>{resetWorker();urls.current.forEach(u=>URL.revokeObjectURL(u));},[]);
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{try{setDark(localStorage.getItem('re-img-dark')==='true');}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';},[dark]);
 function changeTheme(){const next=!dark;setDark(next);try{localStorage.setItem('re-img-dark',String(next));}catch{}}
 async function request(file:File,mode:string,options=p,crop={x:.5,y:.5,zoom:1}){
  assertInputSize(file.size);
  const started=generation.current,input=await file.arrayBuffer(),id=++counter.current;assertInputSize(input.byteLength);
  if(started!==generation.current||cancel.current)throw Error('Interrupted. Retry to continue.');
  if(!worker.current){const w=new Worker('/engine/worker.mjs',{type:'module'});w.onmessage=e=>{if(worker.current!==w||pending.current?.id!==e.data.id)return;const task=pending.current;pending.current=null;if(e.data.error)task?.reject(Error(e.data.error.startsWith('Cannot meet the ')?'This image cannot meet the export limit in the selected format at the required dimensions. No file was downloaded. Choose a different image or JPG if suitable.':e.data.error));else task?.resolve(e.data);};w.onerror=()=>{if(worker.current!==w)return;pending.current?.reject(Error('Image worker stopped. Retry this image.'));pending.current=null;w.terminate();worker.current=null;};worker.current=w;}
  const rgb=options.background.match(/\w\w/g)?.map(v=>parseInt(v,16));
  return new Promise<any>((resolve,reject)=>{pending.current={id,resolve,reject};worker.current!.postMessage({id,input,request:{mode:mode==='analysis'?'export':mode,fit:mode==='export'&&!flexiblePolicy(options)?'crop_exact':'crop',options:{width:options.width??1,height:options.height??1,format:options.format,quality:options.quality,max_bytes:mode==='export'?Math.min(imageByteLimit,catalogueById.get(options.id)?.maxKB?catalogueById.get(options.id).maxKB*1000:imageByteLimit):null,background:rgb,center_x:crop.x,center_y:crop.y,zoom:crop.zoom,allow_smaller:true,uottawa:false}}},[input]);});
 }
 function update(id:string,patch:Partial<Item>){setItems(old=>old.map(i=>i.id===id?{...i,...patch}:i));}
 useEffect(()=>{try{setLang(languageOf(localStorage.getItem('re-image-language')));}catch{}},[]);
 useEffect(()=>{const guard=(e:DragEvent)=>{if(!Array.from(e.dataTransfer?.types??[]).includes('Files'))return;e.preventDefault();if(e.type==='drop'&&e.dataTransfer?.files.length)addRef.current(e.dataTransfer.files);};window.addEventListener('dragover',guard);window.addEventListener('drop',guard);return()=>{window.removeEventListener('dragover',guard);window.removeEventListener('drop',guard);};},[]);
 useEffect(()=>{const paste=(e:ClipboardEvent)=>{if(e.defaultPrevented||busyRef.current)return;const files=clipboardImages(e);if(!files.length||itemRef.current.length+(mode==='single'?1:files.length)>50)return;e.preventDefault();const named=files.map(file=>file.name?file:new File([file],`${messages[languageRef.current].pastedImage}.${file.type==='image/jpeg'?'jpg':file.type==='image/webp'?'webp':'png'}`,{type:file.type,lastModified:file.lastModified}));addRef.current(named);};document.addEventListener('paste',paste);return()=>document.removeEventListener('paste',paste);},[mode]);
 function changeLanguage(){const next=lang==='fr'?'en':'fr';setLang(next);try{localStorage.setItem('re-image-language',next);}catch{}}
 function change(patch:Partial<Preset>,ratio=ratioLabel){if(busyRef.current)return;const next={...p,...patch};setP(next);if(current)setImageSettings(current.id,next,ratio);}
 async function add(files:FileList|File[],activateNew=false,focusSearch=false){if(busyRef.current)return;const list=mode==='single'?Array.from(files).slice(0,1):Array.from(files);if(!list.length)return;if(itemRef.current.length+list.length>50){setNotice('Use up to 50 images per batch.');return;}const focusAtStart=document.activeElement,activityAtStart=interactionRevision.current;let imported=false;invalidateArchive();setWorking(true);cancel.current=false;setNotice('');const entries=list.map(file=>({id:crypto.randomUUID(),file,stem:filenameStem(file.name),suffix:true,preset:selected?{...p}:null,ratioLabel,status:'queued',crop:{x:p.centerX,y:p.centerY,zoom:p.zoom}}));setItems(old=>[...old,...entries]);if((activateNew||mode==='single'||!active)&&entries[0])setActive(entries[0].id);
  for(const [index,i] of entries.entries()){if(cancel.current)break;setProgress({kind:'reading',index:index+1,total:entries.length});update(i.id,{status:'reading'});try{const r=await request(i.file,'preview');update(i.id,{preview:url(r.data,'image/png'),...r.meta,status:'ready',error:undefined});imported=true;}catch(e){update(i.id,{status:cancel.current?'interrupted':'error',error:(e as Error).message});}}
  if(cancel.current)setItems(old=>old.map(i=>i.status==='queued'?{...i,status:'interrupted'}:i));setWorking(false);if(focusSearch&&imported&&!cancel.current&&interactionRevision.current===activityAtStart&&(document.activeElement===focusAtStart||document.activeElement===document.body))setSearchFocusToken(n=>n+1);
 }
 const current=items.find(i=>i.id===active),specification=catalogueById.get(p.id),configured=!!selected&&isConfigured(p),settingsBusy=busy;
 function openEmptyPicker(){if(current?.preview||settingsBusy||busyRef.current)return;emptyPicker.current?.click();}
 function acceptDrop(e:React.DragEvent<HTMLElement>){if(!e.dataTransfer.files.length)return;e.preventDefault();e.stopPropagation();addRef.current(e.dataTransfer.files);}
 function allowDrop(e:React.DragEvent<HTMLElement>){if(Array.from(e.dataTransfer.types).includes('Files'))e.preventDefault();}
 function chooseRatio(label:string){if(settingsBusy)return;const ratio=specification?.selectableRatios?.find((v:any)=>v.label===label);setRatioLabel(label);if(ratio){const width=Math.min(flexiblePolicy(p)?.maximum??flexibleMaximum,Math.max(specification.minimumWidth??1,p.width??flexibleMaximum));change({width:ratio.width??width,height:ratio.height??Math.round(width/ratio.ratio)},label);}}
 function setImageSettings(id:string,preset:Preset|null,ratio=''){invalidateArchive();const item=itemRef.current.find(i=>i.id===id);revoke(item?.out?.url);setItems(old=>old.map(i=>i.id===id?{...i,preset:preset?{...preset}:null,ratioLabel:ratio,out:undefined,status:i.preview?'ready':i.status,...(i.preview?{error:undefined}:{})}:i));}
 function activate(id:string){const item=itemRef.current.find(i=>i.id===id);if(!item)return;setActive(id);setSelected(item.preset?.id??'');setP(item.preset??emptyPreset);setRatioLabel(item.ratioLabel);}
 function setImagePreset(id:string,presetId:string){if(busyRef.current)return;const preset=lockedPreset(presetId,p.format);setImageSettings(id,preset,presetRatioLabel(preset));setActive(id);setSelected(preset?.id??'');setP(preset??emptyPreset);setRatioLabel(presetRatioLabel(preset));}
 function choosePreset(id:string){if(busyRef.current)return;const preset=lockedPreset(id,p.format);if(current){setImagePreset(current.id,id);return;}setSelected(preset?.id??'');setP(preset??emptyPreset);setRatioLabel(presetRatioLabel(preset));}
 function applyToAll(){if(busyRef.current||!selected)return;invalidateArchive();itemRef.current.forEach(i=>revoke(i.out?.url));setItems(old=>old.map(i=>({...i,preset:{...p},ratioLabel,out:undefined,status:i.preview?'ready':i.status,...(i.preview?{error:undefined}:{})})));}
 function triggerDownload(out:{url:string,name:string,imageCount?:number}){const a=document.createElement('a');a.href=out.url;a.download=out.name;a.target='_blank';a.rel='noopener';a.style.display='none';document.body.appendChild(a);try{a.click();void reportDownload(out.imageCount??1,receiveTotal).catch(()=>{});}finally{a.remove();}}
 function exportPreset(settings:Preset|null){if(!settings)throw Error('Choose a preset first.');const preset=cleanPreset(settings);if(!isConfigured(preset))throw Error('This source gives flexible dimensions. Choose width and height before preparing images.');return preset;}
 async function createOutput(i:Item,preset:Preset,index:number,used:Set<string>,retained:Map<string,Output>):Promise<Output>{
  assertInputSize(i.file.size);
  if(i.out){assertOutput(i.out.bytes,i.out,i.out.width,i.out.height);return i.out;}
  update(i.id,{status:'processing',error:undefined});
  if(!i.preview){const preview=await request(i.file,'preview',preset,i.crop);update(i.id,{preview:url(preview.data,'image/png'),...preview.meta});i={...i,...preview.meta};}
  const flex=flexiblePolicy(preset)?dimensions(i.width||preset.width||1,i.height||preset.height||1,preset,i.crop):null;const exportSettings=flex?{...preset,width:flex[0],height:flex[1]}:preset;
  const r=await request(i.file,'export',exportSettings,i.crop);assertOutput(r.data,r.meta,exportSettings.width!,exportSettings.height!);if(cancel.current)throw Error('Interrupted. Retry to continue.');
  const total=Array.from(retained.values()).reduce((n,out)=>n+out.bytes.length,0);if(total+r.data.length>512*1048576)throw Error('Batch output exceeds 512 MB. Download and clear this batch before continuing.');
  const name=imageFilename(i.stem,i.file.name,r.meta.width,r.meta.height,preset.format,index+1,used,i.suffix),out:Output={...r.meta,bytes:r.data,url:url(r.data,`image/${preset.format}`),format:preset.format,name};
  retained.set(i.id,out);update(i.id,{status:'done',error:undefined,out});return out;
 }
 function retainedOutputs(){return new Map(itemRef.current.filter(i=>i.out).map(i=>[i.id,i.out!]));}
 // Settings and crop edits invalidate derivatives. Ready files download in the click gesture.
 async function download(id:string){
  if(busyRef.current)return;const i=itemRef.current.find(v=>v.id===id);if(!i)return;try{assertInputSize(i.file.size);}catch(e){update(id,{status:'error',error:(e as Error).message});return;}if(i.out){assertOutput(i.out.bytes,i.out,i.out.width,i.out.height);triggerDownload(i.out);return;}let preset:Preset;
  try{preset=exportPreset(i.preset);}catch(e){setNotice((e as Error).message);return;}
  invalidateArchive();setWorking(true);cancel.current=false;setNotice('');setProgress({kind:'processing',index:1,total:1});
  try{const retained=retainedOutputs(),used=new Set(Array.from(retained.values()).map(out=>out.name.toLocaleLowerCase()));triggerDownload(await createOutput(i,preset,itemRef.current.findIndex(v=>v.id===id),used,retained));}
  catch(e){update(id,{status:cancel.current?'interrupted':'error',error:(e as Error).message});}finally{setWorking(false);}
 }
 async function downloadAll(){
  if(busyRef.current||!itemRef.current.length)return;if(archive.current){triggerDownload(archive.current);return;}
  setWorking(true);cancel.current=false;setNotice('');const entries=[...itemRef.current],retained=retainedOutputs(),used=new Set(Array.from(retained.values()).map(out=>out.name.toLocaleLowerCase()));
  try{const result=await prepareBatch(entries,(i:Item,index:number)=>createOutput(i,exportPreset(i.preset),index,used,retained),{isCancelled:()=>cancel.current,onProgress:(index:number,total:number)=>setProgress({kind:'processing',index,total}),onError:(i:Item,e:Error)=>update(i.id,{status:'error',error:e.message})});
   if(result.cancelled){setItems(old=>old.map(i=>!i.out&&!i.error?{...i,status:'interrupted'}:i));return;}
   if(result.errors.length){setNotice('Some images could not be processed. Fix their errors and retry Download all. No ZIP was created.');return;}
   const blob=zip(result.outputs),archiveUrl=URL.createObjectURL(blob);urls.current.add(archiveUrl);archive.current={url:archiveUrl,name:'re-img.zip',imageCount:result.outputs.length};triggerDownload(archive.current);
  }finally{setWorking(false);}
 }
 function stop(){cancel.current=true;resetWorker();setNotice('Stopped. Completed outputs are kept; retry remaining images.');}
 function clear(){if(busyRef.current)return;invalidateArchive();items.forEach(i=>{revoke(i.preview);revoke(i.out?.url);});setItems([]);setActive('');setNotice('');resetWorker();}
 function crop(patch:Partial<Item['crop']>){if(!current||busyRef.current)return;invalidateArchive();revoke(current.out?.url);update(current.id,{crop:{...current.crop,...patch},out:undefined,status:'ready',error:undefined});}
 function rename(id:string,stem:string){if(busyRef.current)return;invalidateArchive();const item=itemRef.current.find(i=>i.id===id);revoke(item?.out?.url);update(id,{stem:editableFilenameStem(stem),out:undefined,status:item?.preview?'ready':item?.status??'queued',error:undefined});}
 function suffix(id:string,value:boolean){rename(id,itemRef.current.find(i=>i.id===id)?.stem??'');update(id,{suffix:value});}
 function sizeWarning(i:Item){const small=i.preset&&isConfigured(i.preset)?undersized(i.width,i.height,i.preset,i.crop):null;return small?(lang==='fr'?`Image trop petite : sortie de ${small.width} × ${small.height} px pour une cible de ${small.targetWidth} × ${small.targetHeight} px.`:`Image too small: ${small.width} × ${small.height} px output for a ${small.targetWidth} × ${small.targetHeight} px target.`):'';}
 const names=(()=>{const used=new Set<string>(items.filter(i=>i.out).map(i=>i.out!.name.toLocaleLowerCase()));return items.map((i,index)=>{if(i.out)return i.out.name;const settings=i.preset;if(!settings)return t.choose;if(!isConfigured(settings))return t.chooseDimensions;const [w,h]=dimensions(i.width||settings.width||1,i.height||settings.height||1,settings,i.crop);return imageFilename(i.stem,i.file.name,w,h,settings.format,index+1,used,i.suffix);});})();
 async function prepareAltImage(){
  if(busyRef.current)throw Error('Image engine is busy');
  const image=itemRef.current.find(i=>i.id===active);if(!image)throw Error('Choose an image');
  const preset=exportPreset(image.preset);setWorking(true);cancel.current=false;setProgress({kind:'processing',index:1,total:1});let href:string|undefined;
  try{
   const result=await request(image.file,'analysis',altAnalysisSettings(preset),image.crop);
   href=url(result.data,'image/png');
   return await createAltImage({preview:href,...result.meta,preset:{...preset,width:result.meta.width,height:result.meta.height},crop:{x:.5,y:.5,zoom:1}}) as Blob;
  }finally{revoke(href);setWorking(false);}
 }
 function downloadAltCsv(){
  if(items.some(image=>!image.preset||!isConfigured(image.preset))){setNotice('Choose a preset for every image before exporting the CSV.');return;}
  const rows=items.flatMap((image,index)=>image.preset&&isConfigured(image.preset)?[{name:names[index],draft:image.alt,sourceKey:altSourceKey(image)}]:[]);
  if(!rows.length)return;
  const href=url(new TextEncoder().encode(altTextCsv(rows)),'text/csv;charset=utf-8'),a=document.createElement('a');a.href=href;a.download='re-img-alt-text.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>revoke(href),60000);
 }
 const visiblePresets=availableDefaults.filter(v=>catalogueById.has(v.id));
 const resolution=configured?(current?dimensions(current.width||1,current.height||1,p,current.crop):[p.width,p.height]):null;
 const status=busy?`${progress.kind==='reading'?t.loadingImages:t.optimizingImages} ${progress.index}/${progress.total}`:'';
 return <>
 <header><div className={`header-inner ${mode}-mode`}><div className="brand"><h1><span className="brand-icon" aria-hidden="true"><img src="/brand/ryan-r.png" alt="" width="63" height="37"/></span>re-img</h1><span className="creator-credit">{t.creator}</span></div> <div className="download-analytics header-metrics">
 <p className="download-counter" title={t.counterHint}><span className="metric-label-full">{t.totalDownloads}</span><span className="metric-label-short" aria-hidden="true">{t.downloadedCompact}</span> <span className="download-total" title={downloadTotal===null?'—':downloadTotal.toLocaleString(lang)}>{downloadTotal===null?'—':downloadTotal.toLocaleString(lang)}</span></p>
 <details className="time-saved" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
 <summary><span className="metric-label-full">{t.estimatedTimeSaved}:</span><span className="metric-label-short" aria-hidden="true">{t.savedCompact}</span> <span className="time-saved-value" title={formatTimeSaved(downloadTotal,lang)}>{formatTimeSaved(downloadTotal,lang)}</span> <span className="analytics-info" aria-hidden="true">?</span></summary>
 <div className="savings-explanation" tabIndex={0} role="note" aria-label={t.estimatedTimeSaved}><p>{t.savingsFormula}</p><p>{t.savingsBasis}</p><p>{t.savingsCount}</p></div>
 </details>
 </div><div className="header-actions"><div className="header-preferences"><button className="secondary theme-toggle" aria-label={t.theme} aria-pressed={dark} onClick={changeTheme}>{dark?t.light:t.dark}</button><div className="mode-bar" role="group" aria-label={t.editMode}><button aria-pressed={mode==='single'} disabled={busy} onClick={()=>setMode('single')}>{t.single}</button><button aria-pressed={mode==='batch'} disabled={busy} onClick={()=>setMode('batch')}>{t.batch}</button></div></div><div className="header-utilities"><button className="secondary language" aria-label={t.language} onClick={changeLanguage}>{lang==='fr'?'EN':'FR'}</button><button className="help-button" aria-label={t.help} aria-haspopup="dialog" onClick={()=>setHelp(true)}>?</button></div></div></div></header>
 <main className={`app-layout ${mode}-mode`}>
 {mode==='batch'&&<aside className="queue panel"><div className="section-heading"><h2>{t.images} <span className="count">{items.length}</span></h2><button className="text-button" disabled={busy||!items.length} onClick={clear}>{t.clear}</button></div>
 <label className={`drop ${settingsBusy?'disabled':''}`}><span aria-hidden="true">+</span><strong>{t.add}</strong><input className="file-input" aria-label={t.add} disabled={settingsBusy} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onChange={e=>{if(e.target.files)add(e.target.files);e.target.value='';}}/></label><div className={`upload-drop-box ${items.some(i=>i.preview)?'is-loaded':'is-empty'}`} tabIndex={settingsBusy?-1:0} aria-label={t.dropHere} onDragOver={allowDrop} onDrop={acceptDrop}>{t.dropHere}<small className="paste-hint">{t.pasteHint}</small></div>
 <ul className="files" aria-label={t.images}>{items.map(i=><li className={`file ${active===i.id?'selected':''}`} key={i.id}><button className="file-select" disabled={busy} aria-label={`${t.selectImage} : ${i.file.name}`} onClick={()=>activate(i.id)}>{i.preview?<img src={i.preview} alt=""/>:<span className="file-placeholder" aria-hidden="true">?</span>}<span><strong>{i.file.name}</strong><small>{i.width?`${i.width} × ${i.height} · ${bytes(i.file.size)}`:bytes(i.file.size)}</small><span className={`file-status ${i.error?'error':i.out?'success':''}`}>{i.out?`${i.out.width} × ${i.out.height} · ${bytes(i.out.bytes.length)}`:t[i.status as keyof typeof t] as string}</span></span></button><label className="image-preset-label">{t.preset}<select aria-label={`${t.preset} : ${i.file.name}`} disabled={settingsBusy} value={i.preset?.id??''} onChange={e=>setImagePreset(i.id,e.target.value)}><option value="">{t.choose}</option>{visiblePresets.map(v=><option key={v.id} value={v.id}>{presetLabel(v,lang)}</option>)}</select></label>{sizeWarning(i)&&<p className="image-size-warning" role="status">{sizeWarning(i)} {!flexiblePolicy(i.preset)&&t.upscaleHelp}</p>}<div className="filename-options"><label className="filename-control">{t.filenameBase}<input aria-label={`${t.filenameBase} : ${i.file.name}`} disabled={busy} value={i.stem} maxLength={180} onChange={e=>rename(i.id,e.target.value)} onBlur={()=>{if(filenameStem(i.stem)!==i.stem)rename(i.id,filenameStem(i.stem));}}/></label><label className="check suffix-control"><input type="checkbox" disabled={busy} checked={i.suffix} onChange={e=>suffix(i.id,e.target.checked)}/>{t.dimensionSuffix}</label></div>{i.preset&&isConfigured(i.preset)&&<small className="image-export-name">{names[items.findIndex(v=>v.id===i.id)]}</small>}<button className="file-download secondary" aria-label={`${t.download} : ${i.file.name}`} disabled={settingsBusy||!i.preset||!isConfigured(i.preset)} onClick={e=>{if(e.detail<2)download(i.id);}}><Arrow/>{t.download}</button>{i.error&&<p className="warning" role="alert">{errorText(i.error,lang)}</p>}</li>)}</ul>
 <button className="sidebar-zip primary" disabled={!items.length||settingsBusy} onClick={e=>{if(e.detail<2)downloadAll();}}><Arrow/>{t.downloadZip}</button>{busy&&<div className="sidebar-progress"><span className="batch-status" role="status">{status}</span><button className="secondary" onClick={stop}>{t.stop}</button></div>}</aside>}
 <section className="workspace">
 <section className="settings panel"><PresetPicker presets={visiblePresets} selected={selected} disabled={settingsBusy} lang={lang} onChange={choosePreset} focusToken={searchFocusToken}/>
 {mode==='batch'&&<button className="secondary apply-all" disabled={!items.length||!selected||settingsBusy} onClick={applyToAll}>{t.applyAll}</button>}
 {specification?.selectableRatios&&<label className="ratio-control inline-control">{t.ratioChoice}<select disabled={settingsBusy} value={ratioLabel} onChange={e=>chooseRatio(e.target.value)}>{specification.selectableRatios.map((v:any)=><option key={v.label} value={v.label}>{v.label}{v.breakpoint?` · ${v.breakpoint==='S'?t.ratioSmall:t.ratioLarger}`:''}</option>)}</select></label>}
 {selected==='uo-05'&&<p className="source-guidance">{t.flexibleMaxHelp}</p>}
 {selected==='uo-27'&&<p className="source-guidance">{t.quickLinksHelp}</p>}
 {selected==='uo-23'&&<p className="source-guidance">{t.homepageHeroHelp}</p>}
 {specification?.sizes&&<label className="ratio-control inline-control">{t.imageSize}<select disabled={settingsBusy} value={`${p.width}x${p.height}`} onChange={e=>{const size=specification.sizes.find((v:any)=>`${v.width}x${v.height}`===e.target.value);if(size)change({width:size.width,height:size.height});}}>{specification.sizes.map((v:any)=><option key={v.label} value={`${v.width}x${v.height}`}>{v.label}</option>)}</select></label>}
 {(specification?.selectableRatios||specification?.sizes||flexiblePolicy(p))&&<p className="resolution">{t.resolution}{lang==='fr'?' : ':': '}<output aria-label={t.resolution}>{resolution?`${resolution[0]} px × ${resolution[1]} px`:"—"}</output></p>}
 <fieldset className="format-control" disabled={settingsBusy||!selected}><legend>{t.saveFormat}</legend><label><input type="radio" name="export-format" value="jpeg" checked={p.format!=="png"} onChange={()=>change({format:"jpeg"})}/>{t.jpgPhotos}</label><label><input type="radio" name="export-format" value="png" checked={p.format==="png"} onChange={()=>change({format:"png"})}/>{t.pngGraphics}</label><p className="save-format-help">{t.saveFormatHelp}</p></fieldset>
 {selected&&!configured&&<p className="source-guidance">{t.unresolvedSize}</p>}
 {mode==='single'&&current&&<div className="single-export"><div className="filename-options"><label className="filename-control">{t.filenameBase}<input aria-label={`${t.filenameBase} : ${current.file.name}`} disabled={busy} value={current.stem} maxLength={180} onChange={e=>rename(current.id,e.target.value)} onBlur={()=>{if(filenameStem(current.stem)!==current.stem)rename(current.id,filenameStem(current.stem));}}/></label><label className="check suffix-control"><input type="checkbox" disabled={busy} checked={current.suffix} onChange={e=>suffix(current.id,e.target.checked)}/>{t.dimensionSuffix}</label></div>{configured&&<p className="filename-preview" aria-live="polite"><span>{names[items.findIndex(i=>i.id===active)]}</span></p>}{sizeWarning(current)&&<p className="image-size-warning" role="status">{sizeWarning(current)} {!flexiblePolicy(current.preset)&&t.upscaleHelp}</p>}<button className="single-download primary" aria-label={`${t.download} : ${current.file.name}`} disabled={settingsBusy||!configured} onClick={e=>{if(e.detail<2)download(current.id);}}><Arrow/>{t.download}</button></div>}
 {mode==='single'&&busy&&<div className="sidebar-progress"><span className="batch-status" role="status">{status}</span><button className="secondary" onClick={stop}>{t.stop}</button></div>}
 {current?.error&&<p className="warning" role="alert">{errorText(current.error,lang)}</p>}
 {current?.out&&<div className="ready-output" role="status"><strong>{t.exported} : {current.out.name}</strong><span>{current.out.width} × {current.out.height} px · {bytes(current.out.bytes.length)}</span><span>{(Math.abs(1-current.out.bytes.length/current.file.size)*100).toFixed(1)} % {current.out.bytes.length<=current.file.size?t.smaller:t.larger}</span></div>}
 </section>
 <section className="preview panel">{current?<div className="image-toolbar"><div className="source-meta-group"><strong className="source-filename">{current.file.name}</strong><span className="source-details">{t.original} : {current.width?`${current.width} × ${current.height} px · `:""}{bytes(current.file.size)}</span></div><div className="toolbar-actions"><label className={`secondary new-image ${settingsBusy?"disabled":""}`}>{t.newImage}<input className="file-input" aria-label={t.newImage} disabled={settingsBusy} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={e=>{if(e.target.files)add(e.target.files,true);e.target.value="";}}/></label><button className="secondary" disabled={busy||!configured} onClick={()=>crop({x:.5,y:.5,zoom:1})}>{t.reset}</button></div></div>:<div className="section-heading"><h2>{t.image}</h2></div>}
 {!current?.preview&&<input ref={emptyPicker} className="empty-image-input" hidden tabIndex={-1} aria-label={mode==='single'?t.addOne:t.add} disabled={settingsBusy} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple={mode==='batch'} onChange={e=>{if(e.target.files)add(e.target.files);e.target.value='';}}/>}
 <div className={`image-drop-target ${current?.preview?'is-loaded':'is-empty'}`} role={current?.preview?undefined:'group'} aria-disabled={current?.preview?undefined:settingsBusy} tabIndex={current?.preview&&!settingsBusy?0:-1} aria-label={current?.preview?t.dropHere:t.emptyPick} onClick={e=>{if(!current?.preview){e.currentTarget.querySelector<HTMLButtonElement>('.empty-select-files')?.focus();openEmptyPicker();}}} onDragOver={allowDrop} onDrop={acceptDrop}><CropCanvas src={current?.preview} sw={current?.width} sh={current?.height} width={configured?p.width:null} height={configured?p.height:null} crop={current?.crop??{x:.5,y:.5,zoom:1}} circle={specification?.shape==='Circular'&&p.width===p.height} fit="crop" heroPreview={selected==='uo-20'?t.heroPreviewSample:undefined} disabled={busy} label={t.cropAria} emptyLabel={t.emptyPick} emptyContent={<div className="empty-upload-content"><p className="empty-upload-title">{t.dropFiles}</p><span className="empty-upload-or">{t.or}</span><button type="button" className="secondary empty-select-files" disabled={settingsBusy} onClick={e=>{e.stopPropagation();openEmptyPicker();}}>{t.selectFiles}</button><small className="input-limit">{t.inputLimit}</small></div>} guideRatios={specification?.selectableRatios??specification?.displayGuides??[]} displayGuides={!!specification?.displayGuides} onChange={value=>crop(value)}/></div>
 {current&&(specification?.selectableRatios||specification?.displayGuides)&&<p className="guide-caption">{specification?.displayGuides?t.displayGuides:t.ratioGuides}</p>}

 {current?.preview&&selected==='uo-20'&&<p className="hero-preview-caption"><strong>{t.heroPreviewTitle}</strong> {t.heroPreviewHelp}</p>}
 <ImageSpecsReference lang={lang}/>
 {current?.preview&&<AltTextPanel lang={lang} itemId={current.id} sourceKey={altSourceKey(current)} draft={current.alt??{}} disabled={settingsBusy} canGenerate={configured} onChange={alt=>update(current.id,{alt})} prepareImage={prepareAltImage} downloadCsv={downloadAltCsv}/>}
 </section></section></main>
 {notice&&<div className="notice" role="alert">{errorText(notice,lang)}<button aria-label={t.dismiss} onClick={()=>setNotice('')}>×</button></div>}
 {help&&<Help lang={lang} specification={specification} onClose={()=>setHelp(false)}/>}
 <div className="release-status">
 <p className="release-version">Version {release.version} · {t.published} <time dateTime={release.publishedDate}>{new Intl.DateTimeFormat(lang==='fr'?'fr-CA':'en-CA',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${release.publishedDate}T00:00:00Z`))}</time></p>

 </div>
 </>;
}
