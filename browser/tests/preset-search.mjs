import assert from 'node:assert/strict';
import {catalogueEntries} from '../lib/catalogue.mjs';
import {presetKeywords,presetSizes,normalizeSearch,searchPresets,officialImageSpecs,presetMatchEvidence,searchHighlightParts} from '../lib/preset-search.mjs';
const before=structuredClone(catalogueEntries),ids=(q,lang='en')=>searchPresets(catalogueEntries,q,lang).map(p=>p.id);
assert.deepEqual(Object.keys(presetKeywords).sort(),catalogueEntries.map(p=>p.id).sort(),'every actual variant has bilingual discovery metadata');
for(const entry of catalogueEntries)for(const lang of ['en','fr'])assert.ok(presetKeywords[entry.id][lang].length>=2);
assert.deepEqual(ids(''),catalogueEntries.map(p=>p.id));assert.deepEqual(ids('   '),ids(''));
for(const [query,expected] of [['headshot','uo-02'],['author photo','uo-02'],['BANNIÈRE ACCUEIL','uo-23'],['banniere accueil','uo-23'],['photo profil','uo-06'],['CTA','uo-07'],['citation','uo-29'],['380 × 474','uo-27'],['600 px par 400 px','uo-05'],['600x750','uo-05'],['1920 BY 717','uo-19'],['twelve images','uo-38'],['person spotlight','uo-40']]){
 for(const lang of ['en','fr'])assert.equal(ids(query,lang)[0],expected,query+' / '+lang);
}
assert.deepEqual(ids('video thumbnail'),['uo-22','uo-25']);
assert.deepEqual(ids('upcoming event'),['uo-16']);
assert.deepEqual(ids('banana rocket'),[]);assert.deepEqual(ids('1270x717'),[],'do not index obsolete source sizes');
assert.deepEqual(presetSizes(catalogueEntries.find(p=>p.id==='uo-40')),[],'do not invent Featured person dimensions');
assert.equal(normalizeSearch('600 x 400 photo'),'600x400 photo');
assert.equal(normalizeSearch('ÉVÉNEMENT'),'evenement');
assert.equal(ids('Full-bleed image')[0],'uo-19','exact name outranks partial names');
assert.equal(officialImageSpecs.fr,'https://virtuo.uottawa.ca/fr/image-marque-design/marketing-numerique/design/specifications-images');
assert.deepEqual(catalogueEntries,before,'search never mutates specifications or ordering');
const author=catalogueEntries.find(p=>p.id==='uo-02'),home=catalogueEntries.find(p=>p.id==='uo-23'),body=catalogueEntries.find(p=>p.id==='uo-05');
assert.deepEqual(presetMatchEvidence(author,'headshot'),[{kind:'keyword',value:'headshot'}]);
assert.equal(searchHighlightParts(author.name,'headshot').some(p=>p.match),false);
assert.equal(presetMatchEvidence(home,'banniere accueil','fr')[0].kind,'name');
assert.ok(searchHighlightParts('Bannière de la page d’accueil','banniere accueil').some(p=>p.match&&p.text==='Bannière'));
assert.deepEqual(presetMatchEvidence(body,'600 × 400'),[{kind:'dimension',value:'600 × 400'}]);
assert.deepEqual(searchHighlightParts('600 × 400','600x400').filter(p=>p.match).map(p=>p.text),['600','400']);
assert.deepEqual(presetMatchEvidence(author,'headshot 80x80').map(p=>p.kind),['keyword','dimension']);
console.log('PASS search metadata coverage, EN/FR aliases, accents/case, all ratio sizes, ranking, empty/no-results, obsolete/unset size exclusions and immutable catalogue.');
