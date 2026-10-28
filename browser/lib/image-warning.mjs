import {dimensions} from './naming.mjs';
import {flexiblePolicy} from './flexible-size.mjs';
import {resolutionWarning} from './export-policy.mjs';import {catalogueById} from './catalogue.mjs';
export function undersized(sw,sh,p,crop={zoom:1}){
 if(!sw||!sh||!p.width||!p.height)return null;
 const policy=flexiblePolicy(p);if(policy){const [width,height]=dimensions(sw,sh,p,crop);return width<policy.minimum?{width,height,targetWidth:policy.minimum,targetHeight:Math.round(policy.minimum/(p.width/p.height))}:null;}
 if(catalogueById.has(p.id)&&!catalogueById.get(p.id).flexible)return resolutionWarning(sw,sh,p,{x:.5,y:.5,...crop});
 if(p.fit==='contain'&&(sw>=p.width||sh>=p.height))return null;
 const [width,height]=dimensions(sw,sh,p,crop);
 return width<p.width||height<p.height?{width,height,targetWidth:p.width,targetHeight:p.height}:null;
}
