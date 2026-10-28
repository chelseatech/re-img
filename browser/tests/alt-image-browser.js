// Run with a browser harness against the local app; no model downloads required.
async page => {
 const result=await page.evaluate(async()=>{
  const {createAltImage}=await import('/lib/alt-image.mjs');
  const source=document.createElement('canvas');source.width=300;source.height=100;
  const ctx=source.getContext('2d');for(const [index,color] of ['red','green','blue'].entries()){ctx.fillStyle=color;ctx.fillRect(index*100,0,100,100);}
  const blob=await new Promise(r=>source.toBlob(r,'image/png')),url=URL.createObjectURL(blob);
  const image={preview:url,width:300,height:100,preset:{width:80,height:80,background:'#ffffff'},crop:{x:1,y:.5,zoom:1}};
  async function inspect(preset){const prepared=await createAltImage({...image,preset});const bitmap=await createImageBitmap(prepared),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const c=canvas.getContext('2d');c.drawImage(bitmap,0,0);return {width:bitmap.width,height:bitmap.height,corner:[...c.getImageData(0,0,1,1).data],center:[...c.getImageData(50,50,1,1).data]};}
  const square=await inspect(image.preset),circle=await inspect({...image.preset,circle:true});URL.revokeObjectURL(url);return {square,circle};
 });
 if(result.square.width!==100||result.square.height!==100)throw Error('AI must receive source detail, not an 80px export');
 if(String(result.square.corner)!=='0,0,255,255'||String(result.square.center)!=='0,0,255,255')throw Error('Selected right crop must contain only blue pixels');
 if(String(result.circle.corner)!=='255,255,255,255'||String(result.circle.center)!=='0,0,255,255')throw Error('Circle corners must be excluded from analysis without changing visible center');
 return {pass:true,...result};
}
