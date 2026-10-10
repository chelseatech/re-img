import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_STORAGE_KEY, defaults, loadPresets, persistPresets, createPreset, restoreStarterPresets } from '../src/presets.js';

function storage(value = null) {
  return { value, getItem(key) { assert.equal(key, PRESET_STORAGE_KEY); return this.value; },
    setItem(key, saved) { assert.equal(key, PRESET_STORAGE_KEY); this.value = saved; } };
}
const input = { name: 'Homepage banner', width: '1400', height: '500', cap: '', format: 'jpeg' };

test('legacy five-profile edits load from the original storage key', () => {
  const saved = defaults.map(({ format, ...p }) => p);
  Object.assign(saved[0], { width: 900, height: 600, cap: 800, circle: true, name: 'Untrusted title', uottawa: false });
  const loaded = loadPresets(storage(JSON.stringify(saved)));
  assert.deepEqual(loaded[0], { ...defaults[0], width: 900, height: 600, cap: 800, circle: true });
  assert.deepEqual(loaded.slice(1), defaults.slice(1));
});

test('multiple named presets round trip with dimensions, format and optional target', () => {
  const device = storage();
  const saved = structuredClone(defaults);
  for (const [index, format] of ['jpeg', 'png', 'webp'].entries()) {
    saved.push(createPreset({ ...input, name: `Banner ${index}`, format, cap: index ? '250' : '' }, saved));
  }
  persistPresets(device, saved);
  const loaded = loadPresets(device);
  assert.deepEqual(loaded, saved);
  assert.equal(loaded[5].cap, 0);
  assert.equal(loaded[7].format, 'webp');
  assert.equal(loaded[7].uottawa, false);
  assert.equal(Object.hasOwn(loaded[7], 'allow_smaller'), false);
});

test('names are trimmed and duplicates including starter names are rejected', () => {
  assert.equal(createPreset({ ...input, name: '  Campaign banner  ' }, defaults).name, 'Campaign banner');
  for (const name of ['', '   ', 'x'.repeat(81), 'Bad\nName', 'ARTICLE IMAGE', ' Custom client profile ']) {
    assert.throws(() => createPreset({ ...input, name }, defaults), /name/);
  }
  const saved = [...defaults, createPreset(input, defaults)];
  assert.throws(() => createPreset({ ...input, name: ' homepage BANNER ' }, saved), /already in use/);
});

test('creation rejects invalid dimensions, caps and unsupported formats', () => {
  for (const field of ['width', 'height']) {
    for (const value of ['', '0', '-1', '10001', '12.5', 'NaN', 'Infinity']) {
      assert.throws(() => createPreset({ ...input, [field]: value }, defaults), /pixels/);
    }
  }
  for (const cap of ['-1', '100001', '1.5', 'NaN', 'Infinity']) {
    assert.throws(() => createPreset({ ...input, cap }, defaults), /KB/);
  }
  assert.throws(() => createPreset({ ...input, format: 'avif' }, defaults), /Choose JPEG/);
  assert.equal(createPreset({ ...input, width: '1', height: '10000', cap: '100000' }, defaults).cap, 100000);
  assert.equal(createPreset({ ...input, cap: '0' }, defaults).cap, 0);
});

test('stored data cannot remove uOttawa restrictions or rename trusted starters', () => {
  const saved = defaults.map(p => ({ ...p, format: 'webp', uottawa: false, name: '<img src=x>' }));
  saved.push({ ...createPreset(input, defaults), format: 'webp', uottawa: true });
  const loaded = loadPresets(storage(JSON.stringify(saved)));
  loaded.slice(0, 4).forEach((p, i) => { assert.equal(p.name, defaults[i].name); assert.equal(p.uottawa, true); assert.equal(p.format, 'jpeg'); });
  assert.equal(loaded[4].format, 'webp');
  assert.equal(loaded[5].uottawa, false);
  assert.equal(loaded[5].format, 'webp');
});

test('malformed stored records do not discard other valid presets', () => {
  for (const value of [null, 'not JSON', '{}', '[]']) assert.deepEqual(loadPresets(storage(value)), defaults);
  assert.deepEqual(loadPresets({ getItem() { throw new Error('denied'); } }), defaults);
  const saved = [...structuredClone(defaults), null, { ...input }, createPreset(input, defaults)];
  saved[1].width = -1;
  saved.push({ ...saved.at(-1), name: ' homepage BANNER ' });
  assert.deepEqual(loadPresets(storage(JSON.stringify(saved))), [...defaults, createPreset(input, defaults)]);
});

test('restoring starters retains all created presets and their saved formats', () => {
  const saved = [...structuredClone(defaults), createPreset({ ...input, format: 'png', cap: '400' }, defaults)];
  saved[0].width = 999;
  const restored = restoreStarterPresets(saved);
  assert.deepEqual(restored.slice(0, 5), defaults);
  assert.deepEqual(restored[5], saved[5]);
  assert.equal(saved[0].width, 999);
});

test('failed persistence reports the failure without replacing stored presets', () => {
  const before = JSON.stringify(defaults);
  const device = { getItem() { return before; }, setItem() { throw new Error('quota exceeded'); } };
  assert.throws(() => persistPresets(device, [...defaults, createPreset(input, defaults)]), /Could not save presets/);
  assert.deepEqual(loadPresets(device), defaults);
});
