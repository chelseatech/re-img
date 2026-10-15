// Run with node tests/dark-outlines.mjs; paths resolve relative to this file.
// Local production-CSS fixture only. No HTTP, database, Git, browser, clipboard,
// deployment, source-app mutation or output-file writes occur.
// Requires the existing test-only jsdom setup in work/qa-runtime, also used by
// counter-ui.mjs. Static fixture/cascade checks do not replace browser visual QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const directory=path.dirname(fileURLToPath(import.meta.url));
const browser=path.resolve(directory,'..');
const productionCss=fs.readFileSync(path.join(browser,'app/globals.css'),'utf8');
const marker='/* Softer dark decorative borders. */';
const markerAt=productionCss.indexOf(marker);
assert.ok(markerAt>=0,'approved dark-border marker exists');
assert.equal(productionCss.indexOf(marker,markerAt+marker.length),-1,'approved marker is unique');
const css=productionCss.slice(0,markerAt),candidate=productionCss.slice(markerAt);
const {JSDOM}=await import(pathToFileURL(path.join(browser,'work/qa-runtime/node_modules/jsdom/lib/api.js')).href);
const hash=value=>createHash('sha256').update(value).digest('hex');
const markup=`
<header id="header"><div class="header-inner"><div class="brand"><h1 id="title">re-img</h1><small id="credit" class="creator-credit">Created by Ryan</small></div><button id="theme" class="secondary theme-toggle">Dark</button><button id="help-button" class="help-button">?</button><button id="language" class="language secondary">English</button><div class="mode-bar"><button id="selected-mode" aria-pressed="true">Single mode</button><button id="mode">Batch mode</button></div></div></header>
<main class="app-layout"><aside id="queue" class="queue panel"><label id="add" class="drop" tabindex="0">Add images<input id="picker" type="file" class="file-input"></label><div id="batch-drop-empty" class="upload-drop-box is-empty" tabindex="0">Drop images</div><div id="batch-drop-loaded" class="upload-drop-box" tabindex="0">Drop images</div><ul class="files"><li id="file" class="file"><button id="file-select" class="file-select">Image</button></li><li id="selected-file" class="file selected">Selected image</li></ul><button id="zip" class="primary">Download ZIP</button></aside>
<section class="workspace"><section id="settings" class="settings panel"><label id="field-label">Preset<select id="preset"><option>Square</option></select></label><label class="filename-control">Name<input id="filename" value="image"></label><label class="check"><input id="check" type="checkbox" checked>Dimensions</label><fieldset class="format-control"><legend id="format-label">Format</legend><label id="checked-format"><input id="format-jpg" name="format" type="radio" checked>JPG</label><label id="format"><input id="format-png" name="format" type="radio">PNG</label></fieldset><p id="resolution" class="resolution">Resolution 80 x 80 px</p><button id="download" class="single-download primary">Download</button><div id="ready" class="ready-output">Output ready</div></section>
<section id="preview" class="preview panel"><div class="image-toolbar"><strong id="source-name" class="source-filename">image.png</strong><small id="source-details" class="source-details">800 x 600 px</small><label id="new-image" class="secondary new-image" tabindex="0">New image<input id="new-picker" class="file-input" type="file"></label></div><div id="drop-empty" class="image-drop-target is-empty" tabindex="0"><div id="empty" class="canvas-wrap is-empty"><div class="empty"><p id="empty-text">Drop an image</p></div></div></div><div id="drop-loaded" class="image-drop-target" tabindex="0"><canvas id="canvas" tabindex="0"></canvas></div><p id="image-info" class="image-info">Original</p><p id="warning" class="warning">Limit exceeded</p><p id="size-warning" class="image-size-warning">Image too small</p></section></section></main>
<dialog id="dialog" class="help-dialog" open><div id="help-heading" class="help-heading"><h2 id="help-title">Help</h2><button id="help-close" class="secondary">Close</button></div><div class="help-content"><section id="help-modes" class="help-modes"><h3>Modes</h3></section><section id="help-section"><h3>Formats</h3><p id="help-text">Choose JPG or PNG.</p><a id="help-link" href="#fixture">Specifications</a></section><section id="help-source" class="help-source"><h3>Preset</h3></section><details id="help-details"><summary id="summary">Limits</summary><p>Limits text</p></details></div></dialog>
<div id="notice" class="notice">Notice<button id="notice-close">Close</button></div><p id="counter" class="download-counter">Total downloaded images: 12</p><p id="guide" class="guide-caption">Guide</p><output id="dimension" class="locked-dimension">80</output><button id="disabled" class="secondary" disabled>Disabled</button>`;

function dom(theme,override=''){
 const instance=new JSDOM(`<!doctype html><html lang="en"${theme==='dark'?' data-theme="dark"':''}><head><style>${css}\n${override}</style></head><body>${markup}</body></html>`,{pretendToBeVisual:true,url:'http://decorative-css-fixture.test'});
 return instance;
}
function snapshot(instance){
 const {document,getComputedStyle}=instance.window;const result={};
 for(const element of document.querySelectorAll('[id]')){
  const style=getComputedStyle(element),properties={};for(const name of style)properties[name]=style.getPropertyValue(name);
  result[element.id]=properties;
 }
 return result;
}
function diff(before,after){const changes=[];for(const id of Object.keys(before))for(const property of new Set([...Object.keys(before[id]),...Object.keys(after[id])]))if((before[id][property]??'')!==(after[id][property]??''))changes.push({id,property,before:before[id][property]??'',after:after[id][property]??''});return changes;}
const decorative=new Set(['header','queue','settings','preview','dialog','help-heading','ready','help-section','help-source','help-details']);
const controls=['theme','help-button','language','selected-mode','mode','add','picker','batch-drop-empty','batch-drop-loaded','file','selected-file','file-select','zip','preset','filename','check','checked-format','format','format-jpg','format-png','download','new-image','new-picker','drop-empty','drop-loaded','canvas','help-close','help-link','summary','notice-close','disabled'];
const text=['title','credit','field-label','format-label','resolution','source-name','source-details','empty-text','image-info','warning','size-warning','help-title','help-text','counter','guide','dimension'];

// Restrict every new declaration and selector before comparing computed styles.
const candidateDocument=new JSDOM(`<style>${candidate}</style>`);
for(const rule of candidateDocument.window.document.styleSheets[0].cssRules){
 assert.ok(rule.selectorText.split(',').every(selector=>selector.trim().startsWith('html[data-theme=dark] ')),'every override is dark-theme scoped');
 for(const property of rule.style)assert.match(property,/^border(?:-(?:top|right|bottom|left))?-color$/,'candidate changes border colors only');
}
candidateDocument.window.close();

const results={productionCssSha256:hash(productionCss),baselineCssSha256:hash(css),candidateSha256:hash(candidate),lightDifferences:[],darkDifferences:[],controlsUnchanged:controls.length,textUnchanged:text.length,focus:[]};
const colorHex=value=>{
 const match=/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*1)?\)$/.exec(value);
 assert.ok(match,'fixture color is opaque RGB: '+value);
 return '#'+match.slice(1).map(channel=>Number(channel).toString(16).padStart(2,'0')).join('');
};
for(const theme of ['light','dark']){
 const beforeDom=dom(theme),afterDom=dom(theme,candidate),before=snapshot(beforeDom),after=snapshot(afterDom),changes=diff(before,after);
 if(theme==='light'){assert.deepEqual(changes,[],'all computed fixture properties remain identical in light theme');results.lightDifferences=changes;}
 else{
  assert.ok(changes.length>0,'dark decorative boundaries change');
  for(const change of changes){assert.ok(decorative.has(change.id),'only decorative element changed: '+change.id);assert.match(change.property,/^border(?:-(?:top|right|bottom|left))?(?:-color)?$/,'only border color/shorthand changed');}
  assert.deepEqual(new Set(changes.map(change=>change.id)),decorative,'all ten intended decorative targets change');
  results.darkDifferences=changes;
  results.measured={panel:colorHex(after.settings['background-color']),page:colorHex(afterDom.window.getComputedStyle(afterDom.window.document.documentElement).backgroundColor),outlineBefore:colorHex(before.settings['border-top-color']),outlineAfter:colorHex(after.settings['border-top-color']),dividerBefore:colorHex(before.ready['border-top-color']),dividerAfter:colorHex(after.ready['border-top-color']),textPrimary:colorHex(after.settings.color),textSecondary:colorHex(after['source-details'].color),controlBoundary:colorHex(after.preset['border-top-color']),controlBackground:colorHex(after.preset['background-color']),dropBoundary:colorHex(after['drop-empty']['border-top-color']),dropBackground:colorHex(after['drop-empty']['background-color'])};
  for(const id of decorative){const side=['header','help-heading'].includes(id)?'bottom':'top';assert.equal(colorHex(after[id][`border-${side}-color`]),'#7c91a6','approved border color: '+id);}
  assert.equal(results.measured.panel,'#1c2937');assert.equal(results.measured.page,'#111a24');
  assert.equal(results.measured.outlineBefore,'#8da3b9');assert.equal(results.measured.dividerBefore,'#aebcc8');
 }
 for(const id of controls)assert.deepEqual(after[id],before[id],`${theme}: all ${id} control properties unchanged`);
 for(const id of text)assert.deepEqual(after[id],before[id],`${theme}: all ${id} text/state properties unchanged`);
 assert.equal(before['help-modes']['border-top-width'],'0px');assert.equal(after['help-modes']['border-top-width'],'0px','borderless help modes stay borderless');
 // For focus fixtures invalidate jsdom's cached computed styles after focus.
 // Compare unchanged values; jsdom outline serialization is incomplete, so this
 // does not claim browser-visible focus or a complete accessibility audit.
 for(const id of ['theme','preset','filename','format-jpg','add','picker','new-picker','drop-empty','batch-drop-empty','canvas','help-close','help-link','summary']){
  const focused=[];
  for(const instance of [beforeDom,afterDom]){
   const element=instance.window.document.getElementById(id);element.focus();assert.equal(instance.window.document.activeElement,element);
   const styleElement=instance.window.document.querySelector('style');styleElement.textContent+='\n';
   const selected={};for(const target of [id,...(id==='picker'?['add']:id==='new-picker'?['new-image']:id==='format-jpg'?['checked-format']:[])]){
    const computed=instance.window.getComputedStyle(instance.window.document.getElementById(target));
    selected[target]=Object.fromEntries(['outline','outline-color','outline-style','outline-width','outline-offset','color','background-color','border-color','border-top-color','border-right-color','border-bottom-color','border-left-color'].map(property=>[property,computed.getPropertyValue(property)]));
   }focused.push(selected);
  }
  assert.deepEqual(focused[1],focused[0],`${theme}: focused ${id} and wrapper properties unchanged`);
  results.focus.push({theme,id,properties:focused[1]});
 }
 beforeDom.window.close();afterDom.window.close();
}

const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(value=>parseInt(value,16)/255);
const luminance=hex=>rgb(hex).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
const contrast=(a,b)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return Number(((hi+.05)/(lo+.05)).toFixed(2));};
const m=results.measured,focus=results.focus.find(value=>value.theme==='dark'&&value.id==='theme');
const focusColor=colorHex(focus.properties.theme['outline-color']);assert.equal(focusColor,'#ffd670');
results.contrast={panelOutlineBefore:contrast(m.outlineBefore,m.panel),panelOutlineAfter:contrast(m.outlineAfter,m.panel),panelDividerBefore:contrast(m.dividerBefore,m.panel),panelDividerAfter:contrast(m.dividerAfter,m.panel),pageOutlineAfter:contrast(m.outlineAfter,m.page),textPrimary:contrast(m.textPrimary,m.panel),textSecondary:contrast(m.textSecondary,m.panel),controlBoundary:contrast(m.controlBoundary,m.controlBackground),emptyDropBoundary:contrast(m.dropBoundary,m.dropBackground),focusOnPanel:contrast(focusColor,m.panel)};
assert.deepEqual(results.contrast,{panelOutlineBefore:5.68,panelOutlineAfter:4.54,panelDividerBefore:7.62,panelDividerAfter:4.54,pageOutlineAfter:5.39,textPrimary:13.44,textSecondary:9.08,controlBoundary:8.6,emptyDropBoundary:12.52,focusOnPanel:10.62});
console.log('PASS dark decorative borders: 10 targets; light unchanged; 31 controls, 16 text/state elements and 26 focus cases unchanged; panel outline 5.68→4.54, divider 7.62→4.54, primary text 13.44, secondary text 9.08, control 8.60, drop 12.52, focus 10.62.');

