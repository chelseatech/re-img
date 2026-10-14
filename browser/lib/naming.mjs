import {flexibleDimensions} from './flexible-size.mjs';
import {catalogueById} from './catalogue.mjs';
import {cropRect,outputSize} from './crop.mjs';
function asciiStem(text,maxLength=70,trim=true){
 const clean=String(text??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').slice(0,maxLength);
 return trim?clean.replace(/^-+|-+$/g,''):clean;
}
export function safePart(text,maxBytes=70){return asciiStem(text,maxBytes)||'image';}
function withoutExtension(text){return String(text??'').split(/[\\/]/).pop().replace(/\.(?:jpe?g|png|webp|gif|heic|tiff?|bmp|svg|zip)$/i,'');}
// Keep a trailing dash while typing so spaces/dashes can separate the next word.
// Export names and blur use filenameStem, which trims edges and supplies the fallback.
export function editableFilenameStem(text){return asciiStem(withoutExtension(text),70,false);}
export function filenameStem(text,fallback='image'){
  const leaf=withoutExtension(text);
  return safePart(leaf||fallback);
}
export function imageFilename(stem,source,width,height,format,sequence,used=new Set(),suffix=true){
  const base=filenameStem(stem);
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
