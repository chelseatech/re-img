'use client';
import {useId,useState} from 'react';
import {messages} from '../lib/i18n.mjs';
export type HistoryEntry={id:string,sourceKey:string,filename:string,thumbnail:string,en:string,fr:string};
type Props={lang:'en'|'fr',entries:HistoryEntry[],storageFailed:boolean,onClear:()=>void,onEdit:(id:string,language:'en'|'fr',text:string)=>void};
export default function ExportHistory({lang,entries,storageFailed,onClear,onEdit}:Props){
 const t=messages[lang],id=useId(),[feedback,setFeedback]=useState('');
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setFeedback(t.historyCopied);}catch{setFeedback(t.historyCopyFailed);}}
 return <section className="export-history panel" aria-labelledby={id}>
  <div className="section-heading"><h2 id={id}>{t.historyTitle} <span className="count">{entries.length}/10</span></h2><button type="button" className="text-button" disabled={!entries.length&&!storageFailed} onClick={()=>{onClear();setFeedback('');}}>{t.historyClear}</button></div>
  <p className="history-privacy">{t.historyPrivacy}</p>
  {storageFailed&&<p role="alert" className="alt-notice">{t.historyStorageFailed}</p>}
  {!entries.length?<p className="history-empty">{t.historyEmpty}</p>:<ol className="history-list">{entries.map((entry,index)=><li className="history-entry" key={entry.id}>
   <div className="history-image">{entry.thumbnail?<img src={entry.thumbnail} alt="" width="160" height="100" loading="lazy"/>:<span aria-hidden="true">▧</span>}<strong>{entry.filename}</strong></div>
   <div className="alt-fields">{(['en','fr'] as const).map(language=><div className="alt-field" key={language}>
    <label htmlFor={`${id}-${index}-${language}`}>{language==='en'?'English':'Français'}</label>
    <textarea id={`${id}-${index}-${language}`} lang={language} rows={2} maxLength={10000} value={entry[language]} onChange={event=>onEdit(entry.id,language,event.target.value)}/>
    <button type="button" className="text-button" disabled={!entry[language].trim()} aria-label={`${t.historyCopy} ${language==='en'?'English':'Français'} — ${entry.filename}`} onClick={()=>void copy(entry[language])}>{t.historyCopy}</button>
   </div>)}</div>
  </li>)}</ol>}
  <p className="history-feedback" role="status" aria-live="polite">{feedback}</p>
 </section>;
}
