import {flexibleDimensions} from './flexible-size.mjs';
import {catalogueById} from './catalogue.mjs';
import {cropRect,outputSize} from './crop.mjs';
export function safePart(text,maxBytes=70){
  const clean=String(text).normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'');
  let part='',size=0;const encoder=new TextEncoder();
  for(const char of clean){const length=encoder.encode(char).length;if(size+length>maxBytes)break;part+=char;size+=length;}
  return part||'image';
}
export function filenameStem(text,fallback='image'){
  const leaf=String(text??'').split(/[\\/]/).pop().replace(/\.(?:jpe?g|png|webp|gif|heic|tiff?|bmp|svg|zip)$/i,'');
  return safePart(leaf||fallback);
}
export function imageFilename(stem,source,width,height,format,sequence,used=new Set(),suffix=true){
  const base=filenameStem(stem||source,filenameStem(source));
  return filename(suffix?'{name}-{width}x{height}.{format}':'{name}.{format}',`${base}.bin`,width,height,format,'',sequence,used);
}
export function filename(template,source,width,height,format,preset,sequence,used=new Set()){
  const ext=format==='jpeg'?'jpg':format;
  const tokens={name:safePart(source.replace(/\.[^.]*$/,'')),width,height,format:ext,preset:safePart(preset),sequence:String(sequence).padStart(2,'0')};
  let raw=template.replace(/\{([^}]+)\}/g,(_,key)=>tokens[key]??'');
  raw=raw.replace(new RegExp(`\\.${ext}$`,'i'),'');
  let stem=safePart(raw,180);
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem))stem='image-'+stem;
  let name=`${stem}.${ext}`,n=2;
  while(used.has(name.toLocaleLowerCase()))name=`${stem}-${n++}.${ext}`;
  used.add(name.toLocaleLowerCase());return name;
}
export function dimensions(sw,sh,p,crop={zoom:1}){
  const flexible=flexibleDimensions(sw,sh,p,crop);if(flexible)return flexible;
  if(catalogueById.has(p.id)&&!catalogueById.get(p.id).flexible)return [p.width,p.height];
  if(p.fit==='contain'){const s=Math.min(p.width/sw,p.height/sh,1);return [Math.max(1,Math.floor(sw*s)),Math.max(1,Math.floor(sh*s))];}
  const size=outputSize(cropRect(sw,sh,p.width,p.height,crop.x??.5,crop.y??.5,crop.zoom??1),p.width,p.height);return [size.width,size.height];
}
