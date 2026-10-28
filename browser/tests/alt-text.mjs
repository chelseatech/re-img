import {test} from 'node:test';
import assert from 'node:assert/strict';
import {altSourceKey,editAltDraft,altReviewStatus,altTextCsv} from '../lib/alt-text.mjs';
import {errorText} from '../lib/i18n.mjs';

const image={id:'one',preset:{id:'hero',width:1260,height:717,format:'jpeg',background:'#ffffff'},crop:{x:.5,y:.5,zoom:1}};
test('CSV missing-preset guidance is actionable in French',()=>{
 assert.equal(errorText('Choose a preset for every image before exporting the CSV.','fr'),'Choisissez un preset pour chaque image avant d’exporter le CSV.');
});
test('crop and output changes require review; filename changes do not',()=>{
 const key=altSourceKey(image);
 const d={en:'Two students in a library.',fr:'Deux personnes dans une bibliothèque.',basedOn:key,reviewedKey:key};
 assert.equal(altReviewStatus(d,key),'reviewed');
 assert.equal(altSourceKey({...image,stem:'renamed'}),key);
 assert.equal(altReviewStatus(d,altSourceKey({...image,crop:{...image.crop,zoom:2}})),'stale');
 assert.equal(altReviewStatus(d,altSourceKey({...image,preset:{...image.preset,width:800}})),'stale');
});
test('editing either language clears review and preserves the other language',()=>{
 const key=altSourceKey(image),draft={en:'Library',fr:'Bibliothèque',basedOn:key,reviewedKey:key};
 const changed=editAltDraft(draft,{fr:'Bibliothèque universitaire'},key);
 assert.equal(changed.en,'Library');assert.equal(changed.fr,'Bibliothèque universitaire');
 assert.equal(altReviewStatus(changed,key),'needs_review');
 assert.equal(altReviewStatus(editAltDraft(changed,{fr:''},key),key),'missing');
});
test('decorative output exports empty alternatives without deleting saved drafts',()=>{
 const key=altSourceKey(image),d=editAltDraft({en:'Library',fr:'Bibliothèque'},{decorative:true},key);
 assert.equal(d.en,'Library');assert.equal(altReviewStatus(d,key),'needs_review');
 const csv=altTextCsv([{name:'library.jpg',draft:{...d,reviewedKey:key},sourceKey:key}]);
 assert.match(csv,/"library.jpg","","","true","reviewed"/);
});
test('CSV preserves French accents, quotes and line breaks and neutralizes spreadsheet formulas',()=>{
 const csv=altTextCsv([{name:'ete.jpg',draft:{en:'=HYPERLINK("bad")',fr:'Été,\n"Ottawa"'},sourceKey:'now'}]);
 assert.ok(csv.startsWith('\uFEFF"filename","alt_en","alt_fr","decorative","review_status"\r\n'));
 assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"Été,\n""Ottawa"""'));
 assert.ok(csv.includes('"needs_review"'));
});
