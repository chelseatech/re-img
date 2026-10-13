import {cropRect} from './crop.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function canvasView(sw,sh,width=1000,height=610){const scale=Math.min((width-80)/sw,(height-60)/sh);return {x:(width-sw*scale)/2,y:(height-sh*scale)/2,scale};}
export function hitCrop(point,rect,tolerance){
  for(const [handle,x,y] of [['nw',rect.x,rect.y],['ne',rect.x+rect.width,rect.y],['se',rect.x+rect.width,rect.y+rect.height],['sw',rect.x,rect.y+rect.height]])if(Math.hypot(point.x-x,point.y-y)<=tolerance)return handle;
  return point.x>=rect.x&&point.x<=rect.x+rect.width&&point.y>=rect.y&&point.y<=rect.y+rect.height?'move':'outside';
}
export function beginCrop(handle,point,sw,sh,width,height,crop){const rect=cropRect(sw,sh,width,height,crop.x,crop.y,crop.zoom);return {handle,point,sw,sh,width,height,crop,rect};}
export function moveCrop(drag,point){
  const {sw,sh,width,height,crop,rect,handle}=drag;
  if(handle==='move'){
    const cx=clamp(rect.x+rect.width/2+point.x-drag.point.x,rect.width/2,sw-rect.width/2);
    const cy=clamp(rect.y+rect.height/2+point.y-drag.point.y,rect.height/2,sh-rect.height/2);
    return {x:cx/sw,y:cy/sh,zoom:crop.zoom};
  }
  const sx=handle.includes('e')?1:-1,sy=handle.includes('s')?1:-1;
  const ax=sx===1?rect.x:rect.x+rect.width,ay=sy===1?rect.y:rect.y+rect.height;
  const ratio=width/height,base=Math.min(sw,sh*ratio);
  const projection=(sx*(point.x-ax)+sy*(point.y-ay)/ratio)/(1+1/ratio**2);
  const max=Math.min(base,sx===1?sw-ax:ax,(sy===1?sh-ay:ay)*ratio);
  const size=clamp(projection,Math.min(base/10,max),max),zoom=clamp(base/Math.max(size,1),1,10);
  const w=Math.max(1,Math.floor(base/zoom)),h=Math.max(1,Math.floor(base/zoom/ratio));
  return {x:clamp((ax+sx*w/2)/sw,0,1),y:clamp((ay+sy*h/2)/sh,0,1),zoom};
}
export function nudgeCrop(crop,key,shift=false){const step=shift?.05:.01;if(['+','=','-','_'].includes(key))return {...crop,zoom:clamp(crop.zoom+(key==='+'||key==='='?.1:-.1),1,10)};return {...crop,x:clamp(crop.x+(key==='ArrowRight'?step:key==='ArrowLeft'?-step:0),0,1),y:clamp(crop.y+(key==='ArrowDown'?step:key==='ArrowUp'?-step:0),0,1)};}
