import {cropRect} from './crop.mjs';

export function altAnalysisSettings(preset) {
 const factor=Math.max(1,Math.ceil(768/Math.max(preset.width,preset.height)));
 return {...preset,width:preset.width*factor,height:preset.height*factor,format:'png'};
}

// Use the same source rectangle as export, before reducing to tiny CMS sizes.
export function altPreviewSpec(sw,sh,width,height,crop,pw,ph) {
 const r=cropRect(sw,sh,width,height,crop.x,crop.y,crop.zoom);
 const scale=Math.min(1,768/r.width,768/r.height,pw/sw,ph/sh);
 return {sx:r.x*pw/sw,sy:r.y*ph/sh,sw:r.width*pw/sw,sh:r.height*ph/sh,
  width:Math.max(1,Math.round(r.width*scale)),height:Math.max(1,Math.round(r.height*scale))};
}

export async function createAltImage(image) {
 const source=new Image();
 await new Promise((resolve,reject)=>{source.onload=resolve;source.onerror=()=>reject(Error('Image preview unavailable'));source.src=image.preview;});
 const p=image.preset,r=altPreviewSpec(image.width,image.height,p.width,p.height,image.crop,source.naturalWidth,source.naturalHeight);
 const canvas=document.createElement('canvas');canvas.width=r.width;canvas.height=r.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 ctx.fillStyle=p.background||'#ffffff';ctx.fillRect(0,0,r.width,r.height);
 if(p.circle){ctx.beginPath();ctx.ellipse(r.width/2,r.height/2,r.width/2,r.height/2,0,0,Math.PI*2);ctx.clip();}
 ctx.imageSmoothingQuality='high';ctx.drawImage(source,r.sx,r.sy,r.sw,r.sh,0,0,r.width,r.height);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not prepare image')),'image/png'));
}
