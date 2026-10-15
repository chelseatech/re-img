import {test} from 'node:test';import assert from 'node:assert/strict';
import {components,catalogueEntries,catalogueById} from '../lib/catalogue.mjs';
import {starters,mergePresets,cleanPreset,cleanPayload,isConfigured} from '../lib/preferences.mjs';
const merged=mergePresets(starters),recipe=name=>merged.find(p=>p.name===name);
test('all 34 text-verified sections and two Featured article variants are available',()=>{
assert.equal(components.length,34);assert.equal(catalogueEntries.length,35);assert.equal(new Set(catalogueEntries.map(c=>c.heading)).size,34);assert.equal(new Set(merged.map(p=>p.id)).size,38);
assert.deepEqual([recipe('Featured article (2) - Image 1').width,recipe('Featured article (2) - Image 1').height],[783,490]);assert.deepEqual([recipe('Featured article (2) - image 2').width,recipe('Featured article (2) - image 2').height],[390,390]);
});
test('flexible sizes remain unconfigured; documented examples are not invented defaults',()=>{
for(const name of ['Body text with image','Quick links blocks with tabs and images','Split screen hero']){const p=recipe(name);assert.equal(p.width,null);assert.equal(p.height,null);assert.equal(isConfigured(p),false);assert.equal(catalogueById.get(p.id).flexible,true);}
const source=catalogueById.get(recipe('Split screen hero').id);assert.match(source.dimensions,/960px by 700px/);
});
test('Homepage hero uses Ryan exact output while preserving source wording and legacy saved sizes',()=>{
const hero=recipe('Homepage hero'),source=catalogueById.get(hero.id);assert.deepEqual([hero.width,hero.height],[1000,667]);assert.equal(isConfigured(hero),true);assert.equal(source.flexible,false);assert.equal(source.dimensions,'Variable based on browser dimensions');assert.match(source.note,/Ryan.*exactly 1000 x 667/);assert.equal(hero.maxKB*hero.byteBase,1000000);
for(const sizes of [[null,null],[null,700],[1440,null],[1440,700]]){const saved={...hero,width:sizes[0],height:sizes[1]};assert.deepEqual(cleanPreset(saved),saved);assert.deepEqual(mergePresets([saved]).find(p=>p.id===hero.id),saved);assert.deepEqual(cleanPayload({revision:2,presets:[saved],selected:hero.id}).presets,[saved]);}assert.throws(()=>cleanPreset({...hero,width:0}));assert.throws(()=>cleanPreset({...hero,height:10001}));
});
test('conflicts, circular upload shape, exact source caps and JPEG/PNG policy survive saving',()=>{
const p=recipe('Business card - Image');assert.deepEqual([p.width,p.height],[610,763]);assert.equal(catalogueById.get(p.id).ratio,'5:4');assert.equal(catalogueById.get(p.id).conflict,true);assert.equal(p.maxKB*p.byteBase,200000);
const hero=recipe('Article hero banner - Hero image');assert.equal(hero.maxKB*hero.byteBase,1000000);assert.throws(()=>cleanPreset({...hero,maxKB:0}));assert.throws(()=>cleanPreset({...hero,maxKB:1001}));assert.throws(()=>cleanPreset({...hero,format:'webp'}));assert.equal(cleanPreset({...hero,name:'Forged',byteBase:1024}).name,hero.name);assert.equal(cleanPreset({...hero,byteBase:1024}).byteBase,1000);
assert.equal(catalogueById.get(recipe('Article hero banner - Author image').id).shape,'Circular');assert.equal(recipe('Callout').maxKB,0);
});
test('merge is idempotent and retains every legacy/custom recipe and chosen setting',()=>{
const saved=[...starters.map(p=>({...p,width:321})),...Array.from({length:47},(_,i)=>({...starters[0],id:`custom-${i}`,name:`Custom ${i}`,width:222+i}))];const before=structuredClone(saved),after=mergePresets(saved);assert.equal(after.length,85);assert.deepEqual(saved,before);for(const p of saved){const actual=after.find(a=>a.id===p.id);assert.deepEqual(actual,p);}assert.deepEqual(mergePresets(after),after);assert.equal(cleanPayload({revision:3,presets:after,selected:'custom-20'}).presets.length,85);
const flexible=recipe('Homepage hero');const edited={...flexible,width:1440,height:700};assert.deepEqual(mergePresets([edited]).find(p=>p.id===edited.id),edited);
});
