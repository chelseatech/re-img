// Import the local screenshot-scene regression fixture into the editor first.
// The private image is deliberately not bundled in the repository or deployment.
async page => {
 const regenerate=page.getByRole('button',{name:/^(Generate alt text|Générer le texte alternatif)$/});
 if(await page.locator('textarea').evaluateAll(fields=>fields.some(e=>e.value.trim()))){
  await regenerate.click();await page.getByRole('button',{name:/^(Replace both drafts|Remplacer les deux brouillons)$/}).click();
 }else await regenerate.click();
 await page.waitForFunction(()=>!document.querySelector('.alt-progress')&&[...document.querySelectorAll('textarea')].length===2&&[...document.querySelectorAll('textarea')].every(e=>e.value.trim()),{},{timeout:60000});
 const [en,fr]=await page.locator('textarea').evaluateAll(fields=>fields.map(e=>e.value));
 if(!/\b(two|couple)\b/i.test(en)||!/(embrac|kiss|hug)/i.test(en)||/(phone|mirror)/i.test(en))throw Error('English misses the two people embracing: '+en);
 if(!/\b(deux|couple)\b/i.test(fr)||!/(embrass|enlac|étreign)/i.test(fr)||/(téléphone|miroir)/i.test(fr))throw Error('French misses the same scene: '+fr);
 return {pass:true,en,fr};
}
