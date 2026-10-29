import {test} from 'node:test';import assert from 'node:assert/strict';
import {cropRect,outputSize} from '../lib/crop.mjs';import {canvasView,hitCrop,beginCrop,moveCrop,nudgeCrop} from '../lib/crop-interaction.mjs';
test('drag uses source coordinates, stays bounded, and keeps dimensions',()=>{const start={x:.5,y:.5,zoom:2};const drag=beginCrop('move',{x:600,y:400},1200,800,200,200,start);for(const point of [{x:700,y:420},{x:10000,y:-10000}]){const next=moveCrop(drag,point),r=cropRect(1200,800,200,200,next.x,next.y,next.zoom);assert.equal(r.width,400);assert.equal(r.height,400);assert.ok(r.x>=0&&r.x+r.width<=1200);assert.ok(r.y>=0&&r.y+r.height<=800);}const moved=moveCrop(drag,{x:700,y:420});assert.equal(cropRect(1200,800,200,200,moved.x,moved.y,moved.zoom).x,500);});
test('each corner resizes around its opposite corner without changing aspect or enlarging',()=>{for(const handle of ['nw','ne','se','sw']){const crop={x:.5,y:.5,zoom:2},r=cropRect(1200,800,390,260,crop.x,crop.y,crop.zoom),sx=handle.includes('e')?1:-1,sy=handle.includes('s')?1:-1,point={x:sx===1?r.x+r.width:r.x,y:sy===1?r.y+r.height:r.y};const drag=beginCrop(handle,point,1200,800,390,260,crop),next=moveCrop(drag,{x:point.x-sx*100,y:point.y-sy*100/1.5}),out=cropRect(1200,800,390,260,next.x,next.y,next.zoom);assert.ok(out.width<r.width);assert.ok(Math.abs(out.width/out.height-1.5)<.01);assert.ok(next.zoom>=1&&next.zoom<=10);assert.ok(Math.abs((sx===1?out.x:out.x+out.width)-(sx===1?r.x:r.x+r.width))<=1);assert.ok(Math.abs((sy===1?out.y:out.y+out.height)-(sy===1?r.y:r.y+r.height))<=1);const size=outputSize(out,390,260);assert.ok(size.width<=out.width&&size.height<=out.height);}});
test('mouse/touch hit targets, keyboard sizing and extreme resize clamps',()=>{const r={x:10,y:20,width:100,height:100};assert.equal(hitCrop({x:111,y:119},r,15),'se');assert.equal(hitCrop({x:128,y:135},r,26),'se');assert.equal(hitCrop({x:60,y:70},r,15),'move');assert.equal(hitCrop({x:300,y:300},r,15),'outside');assert.equal(nudgeCrop({x:1,y:0,zoom:10},'+').zoom,10);assert.equal(nudgeCrop({x:1,y:0,zoom:1},'ArrowRight').x,1);const drag=beginCrop('se',{x:800,y:600},1200,800,200,200,{x:.5,y:.5,zoom:2});for(const point of [{x:-1000,y:-1000},{x:9999,y:9999}]){const c=moveCrop(drag,point),rect=cropRect(1200,800,200,200,c.x,c.y,c.zoom);assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=1200&&rect.y+rect.height<=800);assert.ok(c.zoom>=1&&c.zoom<=10);}});

test('preview fills its limiting edge with handle space across image shapes and screen sizes',()=>{
  for(const [width,height] of [[900,340],[360,280],[1600,610]])for(const [sw,sh] of [[1920,700],[700,1920],[1200,1200],[4000,200]]){
    const {x,y,scale}=canvasView(sw,sh,width,height);
    assert.ok(x>=16-1e-9&&y>=16-1e-9);
    assert.ok(x+sw*scale<=width-16+1e-9&&y+sh*scale<=height-16+1e-9);
    assert.ok(Math.abs(x-16)<1e-9||Math.abs(y-16)<1e-9);
    const retina=canvasView(sw,sh,width*2,height*2,32);
    assert.equal(retina.scale,scale*2);assert.equal(retina.x,x*2);assert.equal(retina.y,y*2);
  }
});
