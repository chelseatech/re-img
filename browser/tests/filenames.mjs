import test from 'node:test';import assert from 'node:assert/strict';import {filenameStem,editableFilenameStem,imageFilename,safePart} from '../lib/naming.mjs';
test('French accents, spaces and symbols normalize to lowercase ASCII stems',()=>{
 for(const [input,expected] of [['Été à Montréal.PNG','ete-a-montreal'],['  Crème brûlée -- CŒUR 123!!.JPEG','creme-brulee-coeur-123'],['A__B@#💥.webp','ab'],['---','image'],['你好💥.png','image'],['','image'],['.JPG','image'],['élève\u0301  42.png','eleve-42'],['Photo.JPG','photo']])assert.equal(filenameStem(input),expected);
 assert.equal(editableFilenameStem('Mon image '),'mon-image-');assert.equal(filenameStem(editableFilenameStem('Mon image ')),'mon-image');assert.equal(editableFilenameStem(''), '');
 assert.match(safePart('a'.repeat(69)+'---'),/^[a-z0-9]+$/);
});
test('PNG/JPG extensions, optional dimensions and duplicate numeric suffixes stay safe',()=>{
 const used=new Set();assert.equal(imageFilename('Été.PNG','source.webp',120,80,'jpeg',1,used),'ete-120x80.jpg');assert.equal(imageFilename('ETE.JPG','source.png',120,80,'jpeg',2,used),'ete-120x80-2.jpg');assert.equal(imageFilename('été','source.jpg',120,80,'jpeg',3,used),'ete-120x80-3.jpg');assert.equal(imageFilename('','source.jpg',120,80,'png',4,used,false),'image.png');assert.equal(imageFilename('你好','source.jpg',120,80,'png',5,used,false),'image-2.png');
 for(const name of used)assert.match(name,/^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png)$/);
});
