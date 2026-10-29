'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {altReviewStatus,editAltDraft} from '../lib/alt-text.mjs';

export type AltDraft={en?:string,fr?:string,decorative?:boolean,basedOn?:string,reviewedKey?:string};
const copy={
 en:{title:'Alt text',generate:'Generate alt text',replace:'Replace both drafts',keep:'Keep my text',confirm:'Generating again will replace both fields. Copy any text you want to keep first.',stop:'Stop waiting',describing:'Generating both languages with Cloudflare…',preparing:'Preparing the final crop…',failed:'Cloudflare could not finish. Please retry or write the descriptions yourself.',limit:'The shared AI limit has been reached (100 per day, 10 per minute). Try later or write your descriptions manually.',unavailable:'Cloud AI is temporarily unavailable. You can still write and copy descriptions.',copy:'Copy',copied:'Copied.',clipboard:'Copy failed. Select the text and use Ctrl+C or ⌘C.',stale:'The image or crop changed. Check both descriptions again.',choose:'Choose a preset to generate from the final crop.'},
 fr:{title:'Texte alternatif',generate:'Générer le texte alternatif',replace:'Remplacer les deux brouillons',keep:'Conserver mes textes',confirm:'Une nouvelle génération remplacera les deux champs. Copiez d’abord les textes à conserver.',stop:'Arrêter l’attente',describing:'Génération des deux langues avec Cloudflare…',preparing:'Préparation du recadrage final…',failed:'Cloudflare n’a pas pu terminer. Réessayez ou rédigez les descriptions.',limit:'La limite partagée de l’IA est atteinte (100 par jour, 10 par minute). Réessayez plus tard ou rédigez les descriptions.',unavailable:'L’IA en nuage est temporairement indisponible. Vous pouvez toujours rédiger et copier les descriptions.',copy:'Copier',copied:'Copié.',clipboard:'La copie a échoué. Sélectionnez le texte et utilisez Ctrl+C ou ⌘C.',stale:'L’image ou le recadrage a changé. Vérifiez à nouveau les deux descriptions.',choose:'Choisissez un preset pour décrire le recadrage final.'}
};
type Props={lang:'en'|'fr',itemId:string,sourceKey:string,draft:AltDraft,disabled:boolean,canGenerate:boolean,onChange:(draft:AltDraft)=>void,onGenerated?:()=>void,prepareImage:()=>Promise<Blob>};
export default function AltTextPanel(props:Props){
 const {lang,itemId,sourceKey,draft,disabled,canGenerate,onChange,prepareImage}=props;
 const t=copy[lang],id=useId(),controller=useRef<AbortController|null>(null),requestId=useRef(0),latest=useRef(props);latest.current=props;
 const [stage,setStage]=useState(''),[error,setError]=useState(''),[feedback,setFeedback]=useState(''),[confirm,setConfirm]=useState(false);
 const running=!!stage,status=altReviewStatus(draft,sourceKey),hasText=!!(draft.en||draft.fr);
 function cancel(){requestId.current++;controller.current?.abort();controller.current=null;setStage('');setError('');}
 useEffect(()=>{cancel();setFeedback('');setConfirm(false);return()=>{requestId.current++;controller.current?.abort();controller.current=null;};},[itemId]);
 useEffect(()=>{setFeedback('');setConfirm(false);},[sourceKey]);
 async function generate(){
  if(disabled||running||!canGenerate||controller.current)return;
  const ticket=++requestId.current,startKey=sourceKey,startItem=itemId,abort=new AbortController();controller.current=abort;
  setConfirm(false);setError('');setFeedback('');setStage('preparing');
  let timeout:ReturnType<typeof setTimeout>|undefined;
  try{
   const image=await prepareImage();
   if(ticket!==requestId.current)return;
   setStage('describing');timeout=setTimeout(()=>abort.abort(),45000);
   const response=await fetch('/api/alt-text',{method:'POST',headers:{'Content-Type':'image/png'},credentials:'same-origin',body:image,signal:abort.signal});
   const data=await response.json() as {en?:unknown,fr?:unknown};
   if(!response.ok)throw Error(response.status===429?'limit':response.status===503?'unavailable':'failed');
   if(typeof data.en!=='string'||typeof data.fr!=='string'||!data.en.trim()||!data.fr.trim())throw Error('failed');
   if(ticket!==requestId.current||latest.current.itemId!==startItem)return;
   latest.current.onChange({...latest.current.draft,en:data.en,fr:data.fr,basedOn:startKey,reviewedKey:''});
   latest.current.onGenerated?.();
   setStage('');
  }catch(e){if(ticket===requestId.current){setStage('');setError(e instanceof Error&&['limit','unavailable'].includes(e.message)?e.message:'failed');}}
  finally{clearTimeout(timeout);if(ticket===requestId.current)controller.current=null;}
 }
 async function copyText(text:string){try{await navigator.clipboard.writeText(text);setFeedback(t.copied);}catch{setFeedback(t.clipboard);}}
 function edit(patch:Partial<AltDraft>){setFeedback('');setConfirm(false);onChange(editAltDraft(draft,patch,sourceKey));}
 return <section className="alt-panel" aria-label={t.title}>
  <div className="alt-toolbar">
   <details className="alt-info" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
    <summary aria-label={lang==='fr'?'Avis et confidentialité':'Notices and privacy'} title={lang==='fr'?'Avis et confidentialité':'Notices and privacy'} className={error||status==='stale'?'has-warning':''}>ⓘ</summary>
    <div className="alt-info-content">
     <p className="alt-privacy">{lang==='fr'?'Seul Générer envoie le recadrage à Cloudflare Workers AI. Cette application ne conserve ni les images ni les descriptions. Vérifiez les brouillons avant utilisation.':'Only Generate sends the crop to Cloudflare Workers AI. Images and descriptions are not stored by this app. Review AI drafts before use.'}</p>
     {!canGenerate&&<p>{t.choose}</p>}
     {status==='stale'&&<p>{t.stale}</p>}
     {error&&<p>{t[error as 'failed'|'limit'|'unavailable']}</p>}
    </div>
   </details>
   <button type="button" className="secondary" title={!canGenerate?t.choose:undefined} disabled={disabled||running||!canGenerate} onClick={()=>hasText?setConfirm(true):void generate()}>{t.generate}</button>
  </div>
  {confirm&&<div className="alt-notice"><p>{t.confirm}</p><div className="alt-actions"><button type="button" className="secondary" onClick={()=>void generate()}>{t.replace}</button><button type="button" className="text-button" onClick={()=>setConfirm(false)}>{t.keep}</button></div></div>}
  {running&&<div className="alt-progress" role="status"><span>{t[stage as 'describing'|'preparing']}</span><button type="button" className="text-button" onClick={cancel}>{t.stop}</button></div>}
  <div className="alt-fields">{(['en','fr'] as const).map(language=><div className="alt-field" key={language}>
   <label htmlFor={id+'-'+language}>{language==='en'?'English':'Français'}</label>
   <textarea id={id+'-'+language} lang={language} rows={2} value={draft[language]??''} disabled={running} onChange={e=>edit({[language]:e.target.value})}/>
   <button type="button" className="text-button" disabled={!draft[language]?.trim()} aria-label={t.copy+' '+(language==='en'?'English':'Français')} onClick={()=>copyText(draft[language]??'')}>{t.copy}</button>
  </div>)}</div>

  {feedback&&<p className="alt-feedback" role="status" aria-live="polite">{feedback}</p>}
 </section>;
}
