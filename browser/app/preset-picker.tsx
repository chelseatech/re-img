'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {presetLabel} from '../lib/i18n.mjs';
import {officialImageSpecs,presetSizes,searchPresets,searchHighlightParts} from '../lib/preset-search.mjs';
const copy={
 en:{search:'Presets',placeholder:'Search name, keyword or size...',clear:'Clear search',clearShort:'Clear',none:'No matching presets. Try another name, use or size.',unspecified:'Size not specified',reference:'Virtuo image specifications',login:'uOttawa sign-in required',newTab:'opens in a new tab',count:(n:number)=>n+' '+(n===1?'preset':'presets')},
 fr:{search:'Presets',placeholder:'Rechercher un nom, mot-clé ou format...',clear:'Effacer la recherche',clearShort:'Effacer',none:'Aucun preset correspondant. Essayez un autre nom, usage ou format.',unspecified:'Taille non précisée',reference:'Spécifications des images Virtuo',login:'Connexion uOttawa requise',newTab:'nouvel onglet',count:(n:number)=>n+' '+(n===1?'preset':'presets')}
};
export function ImageSpecsReference({lang}:{lang:'en'|'fr'}){const t=copy[lang];return <div className="preset-reference editing-reference"><a href={officialImageSpecs[lang]} target="_blank" rel="noopener noreferrer" aria-label={t.reference+' — '+t.newTab}>{t.reference}<span aria-hidden="true"> ↗</span></a><small>{t.login}</small></div>;}
function Highlight({text,query}:{text:string,query:string}){return <>{searchHighlightParts(text,query).map((part:any,index:number)=>part.match?<mark key={index}>{part.text}</mark>:<span key={index}>{part.text}</span>)}</>;}
export default function PresetPicker({presets,selected,disabled,lang,onChange,focusToken=0}:{presets:any[],selected:string,disabled:boolean,lang:'en'|'fr',onChange:(id:string)=>void,focusToken?:number}){
 const [query,setQuery]=useState(''),input=useRef<HTMLInputElement>(null),results=useRef<HTMLUListElement>(null),lastEscape=useRef<number|null>(null),previousFocusToken=useRef(focusToken),initialFocusDone=useRef(false),id=useId(),t=copy[lang];
 const matches: any[]=searchPresets(presets,query,lang);
 useEffect(()=>{if(disabled||initialFocusDone.current)return;initialFocusDone.current=true;const active=document.activeElement;if((!active||active===document.body)&&!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'))input.current?.focus();},[disabled]);
 useEffect(()=>{if(focusToken!==previousFocusToken.current&&!disabled){previousFocusToken.current=focusToken;lastEscape.current=null;input.current?.focus();}},[focusToken,disabled]);
 useEffect(()=>{results.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.scrollIntoView?.({block:'nearest',inline:'nearest'});},[selected,query,lang]);
 function clear(){lastEscape.current=null;setQuery('');input.current?.focus();}
 function escape(e:React.KeyboardEvent){e.preventDefault();if(e.repeat)return;const now=e.timeStamp;if(lastEscape.current!==null&&now-lastEscape.current<=500){clear();}else lastEscape.current=now;}
 function choose(index:number){if(disabled||!matches.length)return;const i=Math.max(0,Math.min(matches.length-1,index));onChange(matches[i].id);const button=results.current?.querySelectorAll<HTMLButtonElement>('button')[i];button?.focus();button?.scrollIntoView?.({block:'nearest'});}
 function sizes(p:any){return presetSizes(p).length?presetSizes(p).map((s:string)=>s.replace('x',' × ')).join(' / '):t.unspecified;}
 function keyAllowed(e:React.KeyboardEvent){return !disabled&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.nativeEvent.isComposing;}
 return <div className="preset-discovery preset-table">
  <div className="preset-table-heading"><label htmlFor={id}>{t.search}</label><span className="preset-count-status" id={id+'-count'} role="status" aria-live="polite" aria-atomic="true">{t.count(matches.length)}</span></div>
  <div className="preset-search-row"><input ref={input} id={id} type="search" value={query} placeholder={t.placeholder} disabled={disabled} autoComplete="off" maxLength={120} aria-describedby={id+'-count'} onChange={e=>{lastEscape.current=null;setQuery(e.target.value);}} onKeyDown={e=>{if(!keyAllowed(e))return;if(e.key==='Escape'){escape(e);return;}lastEscape.current=null;if((e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Enter')&&matches.length){e.preventDefault();const index=matches.findIndex((p:any)=>p.id===selected);choose(e.key==='ArrowUp'?(index<0?matches.length-1:index-1):e.key==='Enter'?(index<0?0:index):index+1);}}}/>{query&&<button type="button" className="secondary preset-search-clear" disabled={disabled} aria-label={t.clear} onClick={clear}>{t.clearShort}</button>}</div>
  <ul className="preset-table-list" ref={results} aria-label={t.search} onKeyDown={e=>{if(!keyAllowed(e))return;if(e.key==='Escape'){escape(e);return;}lastEscape.current=null;if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){const buttons=Array.from(e.currentTarget.querySelectorAll('button')),index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;e.preventDefault();choose(e.key==='Home'?0:e.key==='End'?buttons.length-1:index+(e.key==='ArrowDown'?1:-1));}}}>
   {matches.map((preset:any)=><li key={preset.id}><button type="button" className="preset-table-row" value={preset.id} title={presetLabel(preset,lang)+' — '+sizes(preset)} aria-label={presetLabel(preset,lang)+' — '+sizes(preset)} disabled={disabled} aria-pressed={selected===preset.id} onClick={()=>{lastEscape.current=null;onChange(preset.id);}}><span className="preset-table-name"><Highlight text={presetLabel(preset,lang)} query={query}/></span><span className="preset-table-size">{sizes(preset)}</span></button></li>)}
  </ul>
  {!matches.length&&<p className="preset-table-empty" role="status">{t.none}</p>}
 </div>;
}
