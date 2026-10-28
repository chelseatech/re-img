import {test} from 'node:test';
import assert from 'node:assert/strict';
import {altPreviewSpec,altAnalysisSettings} from '../lib/alt-image.mjs';

test('tiny presets request source-detail crops without changing their aspect ratio',()=>{
 const p={width:80,height:80,format:'jpeg'};
 assert.deepEqual(altAnalysisSettings(p),{width:800,height:800,format:'png'});
 assert.deepEqual(p,{width:80,height:80,format:'jpeg'});
 assert.deepEqual(altAnalysisSettings({width:390,height:260,format:'jpeg'}),{width:780,height:520,format:'png'});
 assert.deepEqual(altAnalysisSettings({width:1920,height:700,format:'jpeg'}),{width:1920,height:700,format:'png'});
});

test('an 80px website export retains source detail for captioning',()=>{
 const result=altPreviewSpec(1200,800,80,80,{x:.5,y:.5,zoom:1},1200,800);
 assert.deepEqual(result,{sx:200,sy:0,sw:800,sh:800,width:768,height:768});
});
test('AI framing follows the exact crop rather than showing the whole original',()=>{
 assert.deepEqual(altPreviewSpec(1200,800,80,80,{x:1,y:.5,zoom:2},1200,800),{sx:800,sy:200,sw:400,sh:400,width:400,height:400});
});
test('preview scaling preserves selected content without enlarging small sources',()=>{
 assert.deepEqual(altPreviewSpec(2400,1600,80,80,{x:.5,y:.5,zoom:1},1200,800),{sx:200,sy:0,sw:800,sh:800,width:768,height:768});
 assert.deepEqual(altPreviewSpec(80,60,80,80,{x:.5,y:.5,zoom:1},80,60),{sx:10,sy:0,sw:60,sh:60,width:60,height:60});
});
test('portrait and wide analysis keep their aspect and stay within the model bound',()=>{
 const wide=altPreviewSpec(2000,1000,400,100,{x:.5,y:.5,zoom:1},1000,500);
 assert.deepEqual(wide,{sx:0,sy:125,sw:1000,sh:250,width:768,height:192});
 const portrait=altPreviewSpec(1000,2000,100,400,{x:.5,y:.5,zoom:1},500,1000);
 assert.deepEqual(portrait,{sx:125,sy:0,sw:250,sh:1000,width:192,height:768});
});
