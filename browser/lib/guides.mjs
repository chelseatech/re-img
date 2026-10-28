import {cropRect} from './crop.mjs';
/** @param {number} sw @param {number} sh @param {Array<{label:string,ratio:number}>} guides @param {{x:number,y:number,zoom:number}} crop @param {{x:number,y:number,width:number,height:number}|null} frame */
export function guideRects(sw,sh,guides,crop={x:.5,y:.5,zoom:1},frame=null){
 const bounds=frame??{x:0,y:0,width:sw,height:sh};
 return guides.map(g=>{const rect=cropRect(bounds.width,bounds.height,g.ratio,1,frame ? .5 : crop.x,frame ? .5 : crop.y,frame?1:crop.zoom);return {...g,...rect,x:bounds.x+rect.x,y:bounds.y+rect.y};});
}
