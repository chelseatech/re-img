import {dimensions} from './naming.mjs';
export function undersized(sw,sh,p,crop={zoom:1}){
 if(!sw||!sh||!p.width||!p.height)return null;
 if(p.fit==='contain'&&(sw>=p.width||sh>=p.height))return null;
 const [width,height]=dimensions(sw,sh,p,crop);
 return width<p.width||height<p.height?{width,height,targetWidth:p.width,targetHeight:p.height}:null;
}
