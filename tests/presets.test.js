import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_STORAGE_KEY, legacyDefaults, uottawaPresets, defaults, loadPresets, persistPresets, createPreset, restoreStarterPresets } from '../src/presets.js';

function storage(value = null) {
  return { value, getItem(key) { assert.equal(key, PRESET_STORAGE_KEY); return this.value; },
    setItem(key, saved) { assert.equal(key, PRESET_STORAGE_KEY); this.value = saved; } };
}
const input = { name: 'Homepage banner', width: '1400', height: '500', cap: '', format: 'jpeg' };

test('legacy five-profile edits load from the original storage key', () => {
  const saved = legacyDefaults.map(({ format, ...p }) => p);
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
  assert.equal(loaded[defaults.length].cap, 0);
  assert.equal(loaded[defaults.length+2].format, 'webp');
  assert.equal(loaded[defaults.length+2].uottawa, false);
  assert.equal(Object.hasOwn(loaded[defaults.length+2], 'allow_smaller'), false);
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
  assert.equal(loaded[defaults.length].uottawa, false);
  assert.equal(loaded[defaults.length].format, 'webp');
  assert.ok(loaded.filter(p=>p.source).every(p=>p.uottawa && p.format==='jpeg' && !p.name.includes('<img')));
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
  assert.deepEqual(restored.slice(0, defaults.length), defaults);
  assert.deepEqual(restored[defaults.length], saved[defaults.length]);
  assert.equal(saved[0].width, 999);
});

test('official catalogue contains all 34 exact headings with separate variant selection', () => {
  assert.equal(uottawaPresets.length,34);
  assert.equal(new Set(uottawaPresets.map(p=>p.name)).size,34);
  const featured=uottawaPresets.find(p=>p.name==='Featured article (2)');
  assert.equal(featured.width,null); assert.equal(featured.height,null);
  assert.deepEqual(featured.variants.map(v=>[v.name,v.width_px,v.height_px,v.shape]),[['Image 1',783,490,'Rectangular'],['image 2',390,390,'Circular']]);
  assert.ok(uottawaPresets.some(p=>p.name==='Quote Card'));
  assert.ok(uottawaPresets.some(p=>p.name==='Featured Series (3)'));
  assert.ok(uottawaPresets.some(p=>p.name==='Static content block (3)'));
});

test('flexible specifications have no invented dimensions and source caps remain scoped', () => {
  for(const name of ['Body text with image','Homepage hero','Quick links blocks with tabs and images','Split screen hero']) {
    const p=uottawaPresets.find(p=>p.name===name);
    assert.equal(p.width,null,name); assert.equal(p.height,null,name);
  }
  assert.equal(uottawaPresets.find(p=>p.name==='Homepage hero').cap,1000);
  assert.equal(uottawaPresets.find(p=>p.name==='Business card - Image').cap,200);
  assert.equal(uottawaPresets.find(p=>p.name==='Social Feed').cap,0);
  assert.equal(uottawaPresets.find(p=>p.name==='Full width video').cap,1000);
  assert.ok(uottawaPresets.every(p=>p.uottawa && p.format==='jpeg'));
  assert.ok(uottawaPresets.filter(p=>p.circle).every(p=>p.width===p.height));
});

test('contradictory dimensions, ratios and source typos are preserved for verification', () => {
  const hero=uottawaPresets.find(p=>p.name==='Full-bleed image hero');
  assert.deepEqual([hero.width,hero.height],[1920,700]);
  assert.match(hero.source.aspect_ratio_documented,/2\.21:1/);assert.equal(hero.verification_needed,true);
  const business=uottawaPresets.find(p=>p.name==='Business card - Image');
  assert.deepEqual([business.width,business.height],[610,763]);assert.equal(business.source.aspect_ratio_documented,'5:4');assert.equal(business.verification_needed,true);
  const social=uottawaPresets.find(p=>p.name==='Social Feed');
  assert.deepEqual([social.width,social.height],[400,600]);assert.equal(social.source.aspect_ratio_documented,'4:5');assert.equal(social.verification_needed,true);
  assert.equal(uottawaPresets.find(p=>p.name==='Homepage hero').source.formats_documented,'JEPG or PNG');
});

test('catalogue insertion migrates previously created presets without losing legacy edits', () => {
  const saved=[...structuredClone(legacyDefaults),createPreset(input,legacyDefaults)];
  saved[2].width=96;saved[2].height=96;saved[4].format='webp';
  const loaded=loadPresets(storage(JSON.stringify(saved)));
  assert.equal(loaded[2].width,96);assert.equal(loaded[4].format,'webp');
  assert.equal(loaded.length,defaults.length+1);assert.equal(loaded.at(-1).name,input.name);
});

test('official edits reload by stable source ID while trusted provenance and policy survive', () => {
  const saved=structuredClone(defaults);
  const flexible=saved.find(p=>p.name==='Homepage hero');
  Object.assign(flexible,{width:1600,height:900,cap:750,format:'webp',uottawa:false,source:{url:'https://untrusted.example'},name:'Untrusted replacement'});
  const featured=saved.find(p=>p.name==='Featured article (2)');
  Object.assign(featured,{variant:'image 2',width:390,height:390,circle:true});
  const loaded=loadPresets(storage(JSON.stringify(saved)));
  const restored=loaded.find(p=>p.id===flexible.id);
  assert.equal(restored.name,'Homepage hero');assert.equal(restored.width,1600);assert.equal(restored.height,900);assert.equal(restored.format,'jpeg');assert.equal(restored.uottawa,true);
  assert.match(restored.source.url,/^https:\/\/virtuo\.uottawa\.ca\//);
  assert.equal(loaded.find(p=>p.id===featured.id).variant,'image 2');
  assert.equal(loaded.find(p=>p.id===featured.id).circle,true);
});

test('failed persistence reports the failure without replacing stored presets', () => {
  const before = JSON.stringify(defaults);
  const device = { getItem() { return before; }, setItem() { throw new Error('quota exceeded'); } };
  assert.throws(() => persistPresets(device, [...defaults, createPreset(input, defaults)]), /Could not save presets/);
  assert.deepEqual(loadPresets(device), defaults);
});
