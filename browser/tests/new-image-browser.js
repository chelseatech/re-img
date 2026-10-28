// Run through Playwright against the built app. Synthetic images only; no AI calls.
async page => {
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 await page.route('**/api/downloads',route=>route.fulfill({json:{total:82}}));
 await page.goto('http://127.0.0.1:8787/?qa=new-image');
 await page.evaluate(()=>{window.__sessionMarker='same-page';window.__liveUrls=new Set();const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=blob=>{const u=create(blob);window.__liveUrls.add(u);return u;};URL.revokeObjectURL=u=>{window.__liveUrls.delete(u);revoke(u);};});
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=667;const ctx=c.getContext('2d');ctx.fillStyle='#789abc';ctx.fillRect(0,0,c.width,c.height);return c.toDataURL().split(',')[1];});
 const file=name=>({name,mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 assert(await page.locator('.mode-bar,.queue,.sidebar-zip').count()===0,'Batch controls must be hidden');
 await page.locator('input[type=file]').first().setInputFiles(file('first.png'));
 await page.waitForFunction(()=>!!document.querySelector('.alt-panel')&&!document.querySelector('.preset-table-row').disabled);
 await page.locator('.preset-table-row').first().click();
 await page.locator('.alt-field textarea').nth(0).fill('Old English draft');
 await page.locator('.alt-field textarea').nth(1).fill('Ancien brouillon');
 await page.locator('.single-export .filename-control input').fill('renamed');
 const download=page.waitForEvent('download');
 await page.locator('.single-download').click();await download;
 await page.waitForFunction(()=>!document.querySelector('.new-image').disabled);
 assert(await page.evaluate(()=>window.__liveUrls.size>=2),'Fixture must include a cached exported image before reset');
 await page.locator('input[type=search]').fill('body');
 assert(await page.locator('.new-image').evaluate(el=>el.tagName==='BUTTON'),'New image must be a reset button, not a file picker');
 await page.locator('.new-image').click();
 await page.locator('.empty-select-files').waitFor();
 assert(await page.evaluate(()=>window.__sessionMarker==='same-page'),'New image must not reload the document');
 assert(await page.evaluate(()=>window.__liveUrls.size===0),'Reset must revoke all image/output URLs');
 assert(await page.locator('.source-filename,.alt-panel,.file,.single-export,.ready-output,.notice').count()===0,'Reset must remove images, drafts, filenames, outputs and notices');
 assert(await page.locator('.preset-table-row[aria-pressed=true]').count()===0,'Reset must clear preset selection');
 assert(await page.locator('input[type=search]').inputValue()==='','Reset must clear preset search');
 assert(await page.locator('main').getAttribute('class').then(c=>c.includes('single-mode')),'Reset returns to single mode');
 await page.locator('input[type=file]').first().setInputFiles(file('fresh.png'));
 await page.locator('.alt-panel').waitFor();
 assert(await page.locator('textarea').evaluateAll(fields=>fields.every(x=>!x.value)),'The next image must have empty drafts');
 assert(await page.locator('.preset-table-row[aria-pressed=true]').count()===0,'The next image must start without a preset');
 assert(await page.locator('.toolbar-actions button').count()===1,'Only New image remains in the image toolbar');
 assert(!/Copy both|Copier les deux/.test(await page.locator('.alt-panel').innerText()),'Copy both must be removed');
 return {pass:true,checks:'single image reset, batch hidden, URL cleanup, no reload, empty drafts/search/preset, reusable uploader, removed controls'};
}
