import {catalogueById} from './catalogue.mjs';
// App sizing policy, separate from the source catalogue's dimensions.
export const flexibleMaximum=1200;
export function flexiblePolicy(p){const c=catalogueById.get(p?.id);return c?.flexible&&c.selectableRatios?.length?{maximum:c.id==='uo-05'?800:flexibleMaximum,minimum:c.minimumWidth??c.recommendedWidth??1,ratio:c.selectableRatios[0]}:null;}
export function flexibleDefault(p){const policy=flexiblePolicy(p);return policy?{...p,width:policy.maximum,height:Math.round(policy.maximum/policy.ratio.ratio)}:p;}
export function flexibleDimensions(sw,sh,p,crop={zoom:1}){
 const policy=flexiblePolicy(p);if(!policy||!p.width||!p.height)return null;
 const ratio=p.width/p.height;
 if(p.fit==='contain'){const scale=Math.min(Math.min(p.width,policy.maximum)/sw,p.height/sh,1);return [Math.max(1,Math.round(sw*scale)),Math.max(1,Math.round(sh*scale))];}
 const available=Math.min(sw,sh*ratio)/(crop.zoom??1),width=Math.max(1,Math.min(Math.min(p.width,policy.maximum),Math.floor(available+1e-7)));
 return [width,Math.max(1,Math.round(width/ratio))];
}
