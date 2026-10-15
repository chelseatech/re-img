import {availableDefaults} from './preferences.mjs';import {catalogueById} from './catalogue.mjs';import {flexibleDefault,flexiblePolicy} from './flexible-size.mjs';import {cropRect} from './crop.mjs';
export const imageByteLimit=1200000;
export function lockedPreset(id,format='jpeg',savedRatio=NaN){
 const p=availableDefaults.find(p=>p.id===id&&catalogueById.has(id));if(!p)return null;
 const preset=flexibleDefault(p),policy=flexiblePolicy(preset);
 // Restore only source-listed crop choices; current size/cap rules still govern the output.
 const ratio=policy&&catalogueById.get(id).selectableRatios.find(value=>Math.abs(value.ratio-savedRatio)<.005);
 return {...preset,...(ratio?{height:Math.round(preset.width/ratio.ratio)}:{}),format:format==='png'?'png':'jpeg',fit:'crop',quality:95,background:'#ffffff'};
}
export function outputDimensions(sw,sh,p,crop){if(!catalogueById.has(p.id)||flexiblePolicy(p))return null;return [p.width,p.height];}
export function resolutionWarning(sw,sh,p,crop){if(!sw||!sh||!p.width||!p.height)return null;const r=cropRect(sw,sh,p.width,p.height,crop.x,crop.y,crop.zoom);return r.width<p.width||r.height<p.height?{width:r.width,height:r.height,targetWidth:p.width,targetHeight:p.height}:null;}
export function assertOutput(data,meta,width,height){if(data.length>imageByteLimit)throw Error('Export exceeds the 1.2 MB per-image limit. No file was downloaded.');if(meta.width!==width||meta.height!==height)throw Error('Image engine returned unexpected dimensions. No file was downloaded.');}
