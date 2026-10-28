// Names do not affect visible content. Geometry and encoding/background do.
export function altSourceKey(image) {
 const p=image.preset??{},c=image.crop??{};
 return JSON.stringify([image.id,p.width,p.height,p.format,p.background,!!p.circle,c.x,c.y,c.zoom]);
}
export function editAltDraft(draft={},patch,key) {
 return {...draft,...patch,basedOn:draft.basedOn||key,reviewedKey:''};
}
export function altReviewStatus(draft={},key) {
 if(!draft.decorative&&(!draft.en?.trim()||!draft.fr?.trim()))return 'missing';
 if(draft.basedOn&&draft.basedOn!==key)return 'stale';
 return draft.reviewedKey===key?'reviewed':'needs_review';
}
function csvCell(value) {
 let text=String(value??'');
 if(/^[\s]*[=+@-]/.test(text)||/^[\t\r]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function altTextCsv(rows) {
 const data=[['filename','alt_en','alt_fr','decorative','review_status'],...rows.map(({name,draft={},sourceKey})=>[
  name,draft.decorative?'':draft.en??'',draft.decorative?'':draft.fr??'',!!draft.decorative,altReviewStatus(draft,sourceKey)
 ])];
 return '\uFEFF'+data.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
