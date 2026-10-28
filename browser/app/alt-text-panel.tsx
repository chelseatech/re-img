'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {altReviewStatus,editAltDraft} from '../lib/alt-text.mjs';

export type AltDraft={en?:string,fr?:string,decorative?:boolean,basedOn?:string,reviewedKey?:string};
const copy={
 en:{title:'Alt text',subtitle:'English + français · ready for your CMS',hint:'Describe what matters on this page. Review names, visible details and French terminology before publishing.',privacy:'Generate sends only the prepared crop to Cloudflare Workers AI. Cropping and resizing stay on your device. This app does not store images or generated descriptions on the server. A request already sent may finish and count toward the daily limit even if you stop waiting.',generate:'Generate EN + FR',regenerate:'Generate new drafts',replace:'Replace both drafts',keep:'Keep my text',confirm:'Generating again will replace both fields. Copy any text you want to keep first.',stop:'Stop waiting',loading:'Loading local models',describing:'Generating both languages with Cloudflare…',translating:'Translating into French…',preparing:'Preparing the final crop…',failed:'Cloudflare could not finish. Please retry or write the descriptions yourself.',limit:'The shared AI limit has been reached (100 per day, 10 per minute). Try later or write your descriptions manually.',unavailable:'Cloud AI is temporarily unavailable. You can still write and copy descriptions.',partial:'The English draft is available; French translation could not finish. Add French manually or retry.',copy:'Copy',both:'Copy both',copied:'Copied.',clipboard:'Copy failed. Select the text and use Ctrl+C or ⌘C.',decorative:'This image is decorative',decorativeHelp:'Use an empty alt field in the CMS. Do not enter “decorative”. Only choose this when the image adds no information or function.',review:'I have reviewed both languages',reviewDecorative:'I have checked that this image is decorative',reviewed:'Reviewed for this crop',stale:'The image or crop changed. Check both descriptions again.',missing:'Add both languages, or mark the image decorative.',needs_review:'Drafts · review before publishing',manual:'Write your own, or generate a starting point.',experimental:'AI drafts can miss or invent details. Review both languages and consider the surrounding page before publishing.',csv:'Download alt-text CSV',session:'Drafts stay in this tab. Copy or export them before closing.',choose:'Choose a preset to generate from the final crop.'},
 fr:{title:'Texte alternatif',subtitle:'English + français · prêt pour votre CMS',hint:'Décrivez ce qui compte sur cette page. Vérifiez les noms, les détails visibles et la terminologie française avant publication.',privacy:'Générer envoie uniquement le recadrage préparé à Cloudflare Workers AI. Le recadrage et le redimensionnement restent sur votre appareil. Cette application ne conserve pas les images ni les descriptions sur le serveur. Une demande déjà envoyée peut se terminer et compter dans la limite quotidienne même si vous arrêtez l’attente.',generate:'Générer EN + FR',regenerate:'Générer de nouveaux brouillons',replace:'Remplacer les deux brouillons',keep:'Conserver mes textes',confirm:'Une nouvelle génération remplacera les deux champs. Copiez d’abord les textes à conserver.',stop:'Arrêter l’attente',loading:'Chargement des modèles locaux',describing:'Génération des deux langues avec Cloudflare…',translating:'Traduction en français…',preparing:'Préparation du recadrage final…',failed:'Cloudflare n’a pas pu terminer. Réessayez ou rédigez les descriptions.',limit:'La limite partagée de l’IA est atteinte (100 par jour, 10 par minute). Réessayez plus tard ou rédigez les descriptions.',unavailable:'L’IA en nuage est temporairement indisponible. Vous pouvez toujours rédiger et copier les descriptions.',partial:'Le brouillon anglais est disponible; la traduction française a échoué. Ajoutez le français ou réessayez.',copy:'Copier',both:'Copier les deux',copied:'Copié.',clipboard:'La copie a échoué. Sélectionnez le texte et utilisez Ctrl+C ou ⌘C.',decorative:'Cette image est décorative',decorativeHelp:'Laissez le champ alt du CMS vide. N’écrivez pas « décorative ». Choisissez cette option uniquement si l’image n’apporte aucune information ni fonction.',review:'J’ai vérifié les deux langues',reviewDecorative:'J’ai vérifié que cette image est décorative',reviewed:'Vérifié pour ce recadrage',stale:'L’image ou le recadrage a changé. Vérifiez à nouveau les deux descriptions.',missing:'Ajoutez les deux langues ou indiquez que l’image est décorative.',needs_review:'Brouillons · à vérifier avant publication',manual:'Rédigez vos textes ou générez une première ébauche.',experimental:'Les brouillons de l’IA peuvent omettre ou inventer des détails. Vérifiez les deux langues et le contexte de la page avant publication.',csv:'Télécharger les textes alternatifs (CSV)',session:'Les brouillons restent dans cet onglet. Copiez-les ou exportez-les avant de fermer.',choose:'Choisissez un preset pour décrire le recadrage final.'}
};
type Props={lang:'en'|'fr',itemId:string,sourceKey:string,draft:AltDraft,disabled:boolean,canGenerate:boolean,onChange:(draft:AltDraft)=>void,prepareImage:()=>Promise<Blob>,downloadCsv:()=>void};
export default function AltTextPanel(props:Props){
 const {lang,itemId,sourceKey,draft,disabled,canGenerate,onChange,prepareImage,downloadCsv}=props;
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
   setStage('');
  }catch(e){if(ticket===requestId.current){setStage('');setError(e instanceof Error&&['limit','unavailable'].includes(e.message)?e.message:'failed');}}
  finally{clearTimeout(timeout);if(ticket===requestId.current)controller.current=null;}
 }
 async function copyText(text:string){try{await navigator.clipboard.writeText(text);setFeedback(t.copied);}catch{setFeedback(t.clipboard);}}
 function edit(patch:Partial<AltDraft>){setFeedback('');setConfirm(false);onChange(editAltDraft(draft,patch,sourceKey));}
 return <section className="alt-panel" aria-labelledby={id+'-title'}>
  <div className="alt-heading"><div><h2 id={id+'-title'}>{t.title}</h2><p>{t.subtitle}</p></div><span className={'alt-status '+(status==='reviewed'?'is-reviewed':'')}>{t[status as 'reviewed'|'stale'|'missing'|'needs_review']}</span></div>
  <p className="alt-hint">{t.hint}</p>
  <label className="check alt-decorative"><input type="checkbox" checked={!!draft.decorative} disabled={running} onChange={e=>edit({decorative:e.target.checked})}/>{t.decorative}</label>
  {draft.decorative?<p className="alt-notice">{t.decorativeHelp}</p>:<>
   <div className="alt-fields">{(['en','fr'] as const).map(language=><div className="alt-field" key={language}>
    <div className="alt-field-heading"><label htmlFor={id+'-'+language}>{language==='en'?'English':'Français'}</label><button type="button" className="text-button" disabled={!draft[language]?.trim()} aria-label={t.copy+' '+(language==='en'?'English':'Français')} onClick={()=>copyText(draft[language]??'')}>{t.copy}</button></div>
    <textarea id={id+'-'+language} lang={language} rows={3} value={draft[language]??''} disabled={running} placeholder={t.manual} onChange={e=>edit({[language]:e.target.value})}/>
   </div>)}</div>
   <div className="alt-actions"><button type="button" className="secondary" disabled={disabled||running||!canGenerate} onClick={()=>hasText?setConfirm(true):void generate()}>{hasText?t.regenerate:t.generate}</button><button type="button" className="text-button" disabled={!draft.en?.trim()||!draft.fr?.trim()} onClick={()=>copyText(`EN: ${draft.en}\n\nFR: ${draft.fr}`)}>{t.both}</button></div>
   {!canGenerate&&<p className="alt-hint">{t.choose}</p>}
   {confirm&&<div className="alt-notice"><p>{t.confirm}</p><div className="alt-actions"><button type="button" className="secondary" onClick={()=>void generate()}>{t.replace}</button><button type="button" className="text-button" onClick={()=>setConfirm(false)}>{t.keep}</button></div></div>}
   {running&&<div className="alt-progress" role="status"><span>{t[stage as 'describing'|'preparing']}</span><button type="button" className="text-button" onClick={cancel}>{t.stop}</button></div>}
   {error&&<p role="alert" className="alt-notice">{t[error as 'failed'|'limit'|'unavailable']}</p>}
   <details className="alt-privacy"><summary>{lang==='fr'?'Cloudflare et confidentialité':'Cloudflare and privacy'}</summary><p>{t.privacy}</p><p>{t.experimental}</p></details>
   <p className="alt-download-note">{lang==='fr'?'Générer envoie le recadrage à Cloudflare. Aucun modèle à télécharger.':'Generate sends the crop to Cloudflare. No model download.'}</p>
  </>}
  <div className="alt-footer"><label className="check"><input type="checkbox" checked={status==='reviewed'} disabled={running||(!draft.decorative&&(!draft.en?.trim()||!draft.fr?.trim()))} onChange={e=>onChange({...draft,basedOn:sourceKey,reviewedKey:e.target.checked?sourceKey:''})}/>{draft.decorative?t.reviewDecorative:t.review}</label><button type="button" className="text-button" onClick={downloadCsv}>{t.csv}</button></div>
  {status==='stale'&&<p className="alt-notice" role="status">{t.stale}</p>}
  <p className="alt-feedback" role="status" aria-live="polite">{feedback}</p>
  <p className="alt-session">{t.session}</p>
 </section>;
}
