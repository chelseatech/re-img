'use client';
import {useEffect,useRef} from 'react';
import {cropRect} from '../lib/crop.mjs';
import {guideRects} from '../lib/guides.mjs';
import {canvasView,hitCrop,beginCrop,moveCrop,nudgeCrop} from '../lib/crop-interaction.mjs';
type Crop={x:number,y:number,zoom:number};
type Props={src?:string,sw?:number,sh?:number,width:number|null,height:number|null,crop:Crop,circle:boolean,fit:string,disabled:boolean,label:string,emptyLabel:string,emptyHint?:string,guideRatios?:Array<{label:string,ratio:number}>,displayGuides?:boolean,onChange:(crop:Crop)=>void};
export default function CropCanvas(props:Props){
  const canvas=useRef<HTMLCanvasElement>(null),bitmap=useRef<HTMLImageElement|null>(null),drag=useRef<any>(null),latest=useRef(props);latest.current=props;
  const valid=!!props.src&&!!props.sw&&!!props.sh&&!!props.width&&!!props.height&&props.fit==='crop';
  function rect(){const p=latest.current;return cropRect(p.sw!,p.sh!,p.width!,p.height!,p.crop.x,p.crop.y,p.crop.zoom);}
  function draw(){
    const c=canvas.current,img=bitmap.current,p=latest.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);
    if(!img?.complete||!img.naturalWidth||!p.sw||!p.sh)return;
    const view=canvasView(p.sw,p.sh),factor=c.width/(c.getBoundingClientRect().width||1000);
    ctx.drawImage(img,view.x,view.y,p.sw*view.scale,p.sh*view.scale);
    function guides(){const frame=p.displayGuides&&p.width&&p.height?rect():null;for(const [index,g] of guideRects(p.sw!,p.sh!,p.guideRatios??[],p.crop,frame).entries()){const gx=view.x+g.x*view.scale,gy=view.y+g.y*view.scale;ctx.strokeStyle=['#ffbb00','#00bfff','#ff70d9'][index%3];ctx.lineWidth=2*factor;ctx.setLineDash([8*factor,5*factor]);ctx.strokeRect(gx,gy,g.width*view.scale,g.height*view.scale);ctx.setLineDash([]);ctx.font=`bold ${15*factor}px Arial`;ctx.fillStyle=ctx.strokeStyle;ctx.fillText(g.label,gx+5*factor,gy+(18+index*18)*factor);}}
    if(!p.width||!p.height||p.fit!=='crop'){guides();return;}
    const r=rect(),x=view.x+r.x*view.scale,y=view.y+r.y*view.scale,w=r.width*view.scale,h=r.height*view.scale;
    ctx.beginPath();ctx.rect(view.x,view.y,p.sw*view.scale,p.sh*view.scale);
    if(p.circle){ctx.moveTo(x+w,y+h/2);ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.closePath();}else ctx.rect(x,y,w,h);
    ctx.fillStyle='rgba(13,22,35,.62)';ctx.fill('evenodd');
    ctx.strokeStyle='#fff';ctx.lineWidth=2*factor;ctx.strokeRect(x,y,w,h);
    if(p.circle){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.stroke();}
    else {ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=factor;for(const f of [1/3,2/3]){ctx.beginPath();ctx.moveTo(x+w*f,y);ctx.lineTo(x+w*f,y+h);ctx.moveTo(x,y+h*f);ctx.lineTo(x+w,y+h*f);ctx.stroke();}}
    for(const [hx,hy] of [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]){ctx.beginPath();ctx.arc(hx,hy,7*factor,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#1f786d';ctx.lineWidth=2*factor;ctx.stroke();}
    guides();
  }
  useEffect(()=>{drag.current=null;bitmap.current=null;draw();if(props.src){const img=new Image();bitmap.current=img;img.onload=draw;img.src=props.src;return()=>{img.onload=null;};}},[props.src]);
  useEffect(()=>{draw();},[props.sw,props.sh,props.width,props.height,props.crop,props.circle,props.fit,props.guideRatios,props.displayGuides]);
  useEffect(()=>{const observer=new ResizeObserver(draw);if(canvas.current)observer.observe(canvas.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{drag.current=null;},[props.width,props.height,props.fit]);
  function point(e:{clientX:number,clientY:number}){const c=canvas.current!,box=c.getBoundingClientRect(),p=latest.current,view=canvasView(p.sw!,p.sh!);return {x:((e.clientX-box.left)*c.width/box.width-view.x)/view.scale,y:((e.clientY-box.top)*c.height/box.height-view.y)/view.scale};}
  function down(e:React.PointerEvent<HTMLCanvasElement>){
    if(!valid||props.disabled||e.button!==0)return;e.preventDefault();const at=point(e),r=rect(),c=canvas.current!,view=canvasView(props.sw!,props.sh!),tol=(e.pointerType==='touch'?26:15)*c.width/c.getBoundingClientRect().width/view.scale;const hit=hitCrop(at,r,tol);
    let crop=props.crop,handle=hit;if(hit==='outside'){crop={...crop,x:Math.max(0,Math.min(1,at.x/props.sw!)),y:Math.max(0,Math.min(1,at.y/props.sh!))};props.onChange(crop);handle='move';}
    drag.current={id:e.pointerId,state:beginCrop(handle,at,props.sw!,props.sh!,props.width!,props.height!,crop)};c.setPointerCapture(e.pointerId);c.focus();
  }
  function move(e:React.PointerEvent<HTMLCanvasElement>){if(props.disabled||!valid)return;const at=point(e);if(drag.current?.id===e.pointerId){props.onChange(moveCrop(drag.current.state,at));return;}const c=canvas.current!,view=canvasView(props.sw!,props.sh!),hit=hitCrop(at,rect(),15*c.width/c.getBoundingClientRect().width/view.scale);c.style.cursor=['nw','se'].includes(hit)?'nwse-resize':['ne','sw'].includes(hit)?'nesw-resize':'move';}
  function end(e:React.PointerEvent<HTMLCanvasElement>){if(drag.current?.id!==e.pointerId)return;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
  return <div className={`canvas-wrap ${!props.src?'is-empty':''}`}><canvas ref={canvas} width={1000} height={610} tabIndex={valid&&!props.disabled?0:-1} aria-label={props.label} aria-disabled={props.disabled} style={{touchAction:valid&&!props.disabled?'none':'auto'}} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{drag.current=null;}} onKeyDown={e=>{if(valid&&!props.disabled&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(e.key)){e.preventDefault();props.onChange(nudgeCrop(props.crop,e.key,e.shiftKey));}}}/>{!props.src&&<div className="empty"><div><p>{props.emptyLabel}</p>{props.emptyHint&&<small className="paste-hint">{props.emptyHint}</small>}</div></div>}</div>;
}
