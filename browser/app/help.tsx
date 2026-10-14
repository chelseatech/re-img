'use client';
import {useEffect,useRef} from 'react';
import {messages,presetLabel,sourceText} from '../lib/i18n.mjs';
import {components} from '../lib/catalogue.mjs';
function Diagram({step,label}:{step:number,label:string}){
 return <svg className="help-diagram" role="img" aria-label={label} viewBox="0 0 240 115"><rect x="1" y="1" width="238" height="113" rx="8" fill="#f2f5f8" stroke="#9aa7b4"/>
 {step===0?<><rect x="28" y="21" width="94" height="73" rx="5" fill="white" stroke="#15283b" strokeWidth="3"/><circle cx="51" cy="42" r="7" fill="#15283b"/><path d="m34 84 29-28 16 16 15-13 22 25" fill="#a5b8c9"/><path d="M149 57h57m-28-28v56" stroke="#15283b" strokeWidth="6" strokeLinecap="round"/></>:step===1?<><path d="M20 89 78 35l40 37 23-27 78 51" fill="#a5b8c9"/><rect x="59" y="20" width="122" height="76" fill="none" stroke="#15283b" strokeWidth="3"/>{[[59,20],[181,20],[59,96],[181,96]].map(([x,y])=><rect key={`${x}-${y}`} x={x-5} y={y-5} width="10" height="10" fill="white" stroke="#15283b" strokeWidth="2"/>)}<path d="M104 57h34m-7-7 7 7-7 7m-20-14-7 7 7 7" fill="none" stroke="#15283b" strokeWidth="3"/></>:<><path d="M80 18h60l20 20v63H80z" fill="white" stroke="#15283b" strokeWidth="3"/><path d="M140 18v20h20M120 42v37m-12-12 12 12 12-12M101 87h38" fill="none" stroke="#15283b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></>}
 </svg>;
}
export default function Help({lang,specification,onClose}:{lang:'fr'|'en',specification:any,onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),t=messages[lang];
 useEffect(()=>{const d=dialog.current!,previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;d.showModal();document.body.style.overflow='hidden';return()=>{d.close();document.body.style.overflow=overflow;previous?.focus();};},[]);
 function trap(e:React.KeyboardEvent<HTMLDialogElement>){if(e.key!=='Tab')return;const controls=Array.from(dialog.current!.querySelectorAll<HTMLElement>('button,a[href],summary,input,select,[tabindex="0"]')).filter(v=>v.getClientRects().length&&!v.hasAttribute('disabled'));if(!controls.length){e.preventDefault();return;}const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 return <dialog className="help-dialog" ref={dialog} aria-labelledby="help-title" onCancel={onClose} onKeyDown={trap}>
 <div className="help-heading"><h2 id="help-title">{t.helpTitle}</h2><button autoFocus className="secondary" aria-label={t.closeHelp} onClick={onClose}>×</button></div>
 <div className="help-content"><ol className="help-steps">{[t.stepAdd,t.stepCrop,t.stepDownload].map((description,index)=><li key={index}><h3>{index+1}. {t.helpSteps[index]}</h3><Diagram step={index} label={`${t.illustration} : ${t.helpSteps[index]}`}/><p>{description}</p></li>)}</ol>
 <section><h3>{t.filesTitle}</h3><p>{t.filesText}</p><ul><li>{t.jpegHelp}</li><li>{t.pngHelp}</li><li>{t.webpHelp}</li></ul></section>
 <section><h3>{t.targetsTitle}</h3><p>{t.targetsHelp}</p><p>{t.circleHelp}</p><p>{t.cropKeys}</p><p>{t.namingHelp}</p><p>{t.downloadHelp}</p></section>
 {specification&&<section className="help-source"><h3>{t.sourceDetails} · {t.page} {specification.page}</h3><p><strong>{presetLabel(specification,lang)}</strong></p><dl><dt>{t.pixels}</dt><dd>{sourceText(specification.dimensions,lang)}</dd><dt>{t.ratio}</dt><dd>{sourceText(specification.ratio,lang)}</dd><dt>{t.shape}</dt><dd>{sourceText(specification.shape,lang)}</dd><dt>{t.maximum}</dt><dd>{sourceText(specification.maximumWeight,lang)||t.notSpecified}</dd><dt>{t.sourceFormat}</dt><dd>{sourceText(specification.formats,lang)}</dd></dl>{specification.warning&&<p className="warning">{sourceText(specification.warning,lang)}</p>}{specification.note&&<p>{sourceText(specification.note,lang)}</p>}<p>{t.sourceUnits}</p></section>}
 <section><h3>{t.syncTitle}</h3><p>{t.syncHelp}</p><p>{t.privacyHelp}</p><p>{t.colourHelp}</p></section>
 <details><summary>{t.limitsTitle}</summary><p>{t.limitsHelp}</p><p>{t.catalogueHelp}</p><h3>{t.allSections}</h3><ul>{components.map((c:any)=><li key={c.id}>{presetLabel(c,lang)}</li>)}</ul></details>
 </div></dialog>;
}
