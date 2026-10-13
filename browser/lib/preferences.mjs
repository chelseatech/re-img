const formats=['jpeg','png','webp'];
export const defaults={width:1600,height:900,fit:'crop',format:'jpeg',quality:85,maxKB:0,background:'#ffffff',naming:'{name}-{width}x{height}.{format}'};
export const starters=[{id:'wide',name:'Wide image',...defaults},{id:'square',name:'Square',...defaults,width:1080,height:1080},{id:'transparent',name:'Transparent graphic',...defaults,width:1200,height:1200,fit:'contain',format:'png'}];
export function cleanPreset(p){
  if(!p || typeof p!=='object')throw Error('Invalid preset');
  const n=(k,min,max)=>{if(!Number.isFinite(p[k])||p[k]<min||p[k]>max||!Number.isInteger(p[k]))throw Error(`Invalid ${k}`);return p[k];};
  const str=(k,max)=>{if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>max)throw Error(`Invalid ${k}`);return p[k];};
  if(!formats.includes(p.format)||!['crop','contain'].includes(p.fit)||!/^#[a-f\d]{6}$/i.test(p.background))throw Error('Invalid export settings');
  if(!/^[a-z\d_-]{1,60}$/i.test(p.id))throw Error('Invalid preset ID');
  const naming=str('naming',180); if(/\{(?!name\}|width\}|height\}|format\}|preset\}|sequence\})/.test(naming))throw Error('Unknown filename token');
  return {id:p.id,name:str('name',60),width:n('width',1,10000),height:n('height',1,10000),quality:n('quality',1,100),maxKB:n('maxKB',0,100000),format:p.format,fit:p.fit,background:p.background,naming};
}
export function cleanPayload(body){
  if(!body||!Number.isInteger(body.revision)||body.revision<0||!Array.isArray(body.presets)||body.presets.length<1||body.presets.length>50)throw Error('Invalid settings payload');
  if(Object.keys(body).some(k=>!['revision','presets','selected'].includes(k)))throw Error('Unknown payload field');
  for(const p of body.presets)if(Object.keys(p).some(k=>!Object.keys(starters[0]).includes(k)))throw Error('Unknown preset field');
  const presets=body.presets.map(cleanPreset);
  if(new Set(presets.map(p=>p.id)).size!==presets.length||!presets.some(p=>p.id===body.selected))throw Error('Invalid selected preset');
  return {presets,selected:body.selected};
}
