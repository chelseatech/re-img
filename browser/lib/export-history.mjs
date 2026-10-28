export const historyKey='re-img-export-history-v1';
export const historyLimit=10;
const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
function normalize(value){
 if(!Array.isArray(value))throw Error('Invalid history');
 return value.filter(row=>row&&typeof row.id==='string'&&typeof row.sourceKey==='string'&&typeof row.filename==='string').slice(0,historyLimit).map(row=>({
  id:text(row.id,2500),sourceKey:text(row.sourceKey,2000),filename:text(row.filename,255),
  thumbnail:typeof row.thumbnail==='string'&&row.thumbnail.length<=60000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(row.thumbnail)?row.thumbnail:'',
  en:text(row.en,10000),fr:text(row.fr,10000)
 }));
}
export function readHistory(storage){try{const raw=storage.getItem(historyKey);return {entries:raw?normalize(JSON.parse(raw)):[],failed:false};}catch{return {entries:[],failed:true};}}
export function writeHistory(storage,entries){try{storage.setItem(historyKey,JSON.stringify(normalize(entries)));return true;}catch{return false;}}
export function clearHistory(storage){try{storage.removeItem(historyKey);return true;}catch{return false;}}
export function addHistory(entries,entry){return normalize([entry,...entries.filter(row=>row.id!==entry.id)]);}
export function editHistoryDraft(entries,sourceKey,draft){
 const en=text(draft.en,10000),fr=text(draft.fr,10000);
 if(!entries.some(row=>row.sourceKey===sourceKey&&(row.en!==en||row.fr!==fr)))return entries;
 return entries.map(row=>row.sourceKey===sourceKey?{...row,en,fr}:row);
}
// Read the actual exported bytes, keeping the source/export dimensions untouched.
export async function historyThumbnail(bytes,type){
 const image=await createImageBitmap(new Blob([bytes],{type}));
 try{const scale=Math.min(1,160/image.width,160/image.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.65);}finally{image.close();}
}
