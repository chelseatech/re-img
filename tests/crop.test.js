import test from 'node:test';
import assert from 'node:assert/strict';
import { cropRect, outputSize } from '../src/crop.js';
test('square crop clamps to edges and zooms', () => {
  assert.deepEqual(cropRect(300, 200, 80, 80, 0, .5), {x:0,y:0,width:200,height:200});
  assert.equal(cropRect(300, 200, 80, 80, 1, .5).x, 100);
  assert.equal(cropRect(300, 200, 80, 80, .5, .5, 2).width, 100);
});
test('target dimensions stay exact for large sources despite integer crop rounding', () => {
  const c = cropRect(1500, 1000, 830, 553);
  assert.deepEqual(outputSize(c, 830, 553), {width:830,height:553});
});
test('tiny sources cannot upscale', () => assert.deepEqual(outputSize(cropRect(20, 20, 80, 80), 80, 80), {width:20,height:20}));
test('invalid crop parameters fail', () => assert.throws(() => cropRect(100, 100, 80, 80, .5, .5, NaN)));
test('crop remains bounded across aspect ratios and positions', () => {
  for (const [w,h] of [[830,553],[390,260],[80,80],[200,200]]) for (const cx of [0,.5,1]) for (const zoom of [1,2,10]) {
    const c = cropRect(1234, 987, w, h, cx, 1-cx, zoom);
    assert.ok(c.x >= 0 && c.y >= 0 && c.x+c.width <= 1234 && c.y+c.height <= 987);
  }
});
