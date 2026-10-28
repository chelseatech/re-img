// Actual WASM export and localStorage; synthetic images, controlled counter, no AI requests.
async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);},key='re-img-export-history-v1';
 await page.route('**/api/downloads',route=>route.fulfill({json:{total:82}}));
 await page.goto('http://127.0.0.1:8787/?qa=history');
 await page.evaluate(k=>{localStorage.removeItem(k);localStorage.setItem('re-image-language','en');localStorage.setItem('re-img-dark','false');},key);await page.reload();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=667;const x=c.getContext('2d');x.fillStyle='#789abc';x.fillRect(0,0,1000,667);return c.toDataURL().split(',')[1];});
 await page.locator('input[type=file]').first().setInputFiles({name:'history-test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.locator('.alt-panel').waitFor();await page.locator('.preset-table-row').first().click();
 await page.locator('.alt-panel textarea').nth(0).fill('A blue background.');await page.locator('.alt-panel textarea').nth(1).fill('Un fond bleu.');
 async function download(){const event=page.waitForEvent('download');await page.locator('.single-download').click();await event;await page.waitForFunction(()=>!!document.querySelector('.history-entry img'));}
 await download();
 assert(await page.locator('.history-entry').count()===1,'Export must add one history entry');
 assert(await page.locator('.history-image strong').innerText()==='history-test-1260x717.jpg','History must use final exported filename');
 assert(await page.locator('.history-entry img').evaluate(img=>img.complete&&img.naturalWidth<=160&&img.naturalHeight<=160),'Thumbnail must be decoded and bounded');
 assert(await page.locator('.export-history').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.workspace').getBoundingClientRect().bottom),'History must sit below the whole editor');
 await page.locator('.alt-panel textarea').nth(1).fill('Un arrière-plan bleu.');
 assert(await page.locator('.history-entry textarea').nth(1).inputValue()==='Un arrière-plan bleu.','Alt edits after export must sync');
 await download();assert(await page.locator('.history-entry').count()===1,'Repeated export must not duplicate an entry');
 await page.locator('.new-image').click();assert(await page.locator('.history-entry').count()===1,'New image must retain history');
 await page.reload();await page.locator('.history-entry img').waitFor();
 assert(await page.locator('.history-entry textarea').nth(1).inputValue()==='Un arrière-plan bleu.','History must survive reload');
 await page.locator('.language').click();
 assert(await page.locator('.history-entry textarea').nth(0).inputValue()==='A blue background.','Switching page language must keep both descriptions');
 await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});});
 await page.locator('.history-entry .alt-field button').nth(1).click();
 assert(await page.evaluate(()=>window.__copied)==='Un arrière-plan bleu.','French Copy must copy the saved French text');
 await page.locator('.history-entry textarea').nth(1).fill('Une description corrigée.');await page.reload();
 await page.locator('.history-entry').waitFor();assert(await page.locator('.history-entry textarea').nth(1).inputValue()==='Une description corrigée.','Editing history must persist');
 for(const viewport of [{width:1280,height:720},{width:390,height:844}]){await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'History must not overflow');}
 // Hold thumbnail decoding to verify immediate text persistence and clearing races.
 await page.locator('input[type=file]').first().setInputFiles({name:'pending.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.locator('.alt-panel').waitFor();await page.locator('.preset-table-row').first().click();
 await page.evaluate(()=>{const original=createImageBitmap;window.__thumbnailDone=false;window.createImageBitmap=(...args)=>new Promise(resolve=>{window.__releaseThumbnail=()=>original(...args).then(bitmap=>{resolve(bitmap);window.__thumbnailDone=true;});});});
 const pendingDownload=page.waitForEvent('download');await page.locator('.single-download').click();await pendingDownload;
 await page.waitForFunction(()=>typeof window.__releaseThumbnail==='function');
 assert(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length===2,key),'Text records must be persisted before thumbnail decoding finishes');
 await page.locator('.export-history .section-heading button').click();
 await page.evaluate(()=>window.__releaseThumbnail());await page.waitForFunction(()=>window.__thumbnailDone);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert(await page.locator('.history-entry').count()===0,'Clear history must empty the list');
 assert(await page.evaluate(k=>localStorage.getItem(k)===null&&localStorage.getItem('re-image-language')==='fr'&&localStorage.getItem('re-img-dark')==='false',key),'Clear must remove only history');
 await page.reload();assert(await page.locator('.history-entry').count()===0,'Cleared history must stay cleared after reload');
 return {pass:true,checks:'actual export, thumbnail, filename, late edits, deduplication, New image, reload, language switching, French copy, history editing, mobile layout, targeted clear, pending thumbnail clear race'};
}
