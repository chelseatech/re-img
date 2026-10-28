export function validDispatch(body){
 return body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===2&&
  typeof body.requestId==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)&&
  Number.isInteger(body.count)&&body.count>=1&&body.count<=50;
}
export async function readDownloadTotal(fetcher=fetch){
 const res=await fetcher('/api/downloads',{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!res.ok)throw Error('Counter unavailable');
 const body=await res.json();if(!Number.isSafeInteger(body.total)||body.total<0)throw Error('Invalid counter');return body.total;
}
// One fresh ID per actual dispatch. Retries reuse it; reporting never delays a download.
export async function reportDownload(count,onTotal,fetcher=fetch,requestId=crypto.randomUUID()){
 for(let attempt=0;attempt<2;attempt++){
  try{
   const res=await fetcher('/api/downloads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,count}),keepalive:true,signal:AbortSignal.timeout(6000)});
   if(!res.ok){if(res.status<500)return;throw Error('Counter unavailable');}
   const body=await res.json();if(Number.isSafeInteger(body.total)&&body.total>=0)onTotal(body.total);return;
  }catch{if(attempt===0)await new Promise(resolve=>setTimeout(resolve,500));}
 }
}
