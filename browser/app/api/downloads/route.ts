import {env} from 'cloudflare:workers';
import {validDispatch} from '../../../lib/download-count.mjs';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function total(){return (await env.DB!.prepare('SELECT total FROM download_totals WHERE id=1').first<{total:number}>())?.total??0;}
export async function GET(){try{return response({total:await total()});}catch{return response({error:'Counter unavailable.'},503);}}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin||!['same-origin',null].includes(req.headers.get('sec-fetch-site')))return response({error:'Invalid origin.'},403);
 if(req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return response({error:'JSON required.'},415);
 // Bound the stream before parsing, including requests without Content-Length.
 if(Number(req.headers.get('content-length'))>512)return response({error:'Report too large.'},413);
 const reader=req.body?.getReader();if(!reader)return response({error:'Missing report.'},400);
 let length=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>512){await reader.cancel();return response({error:'Report too large.'},413);}chunks.push(value);}}catch{return response({error:'Invalid report.'},400);}
 let body;try{const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}body=JSON.parse(new TextDecoder().decode(bytes));}catch{return response({error:'Invalid report.'},400);}
 if(!validDispatch(body))return response({error:'Invalid report.'},400);
 try{
  const now=Date.now();body.requestId=body.requestId.toLowerCase();
  // Shared bounded intake, no IPs or identities. The insert and aggregate trigger are atomic.
  const row=await env.DB!.prepare('INSERT INTO download_dispatches (request_id,count,created_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM download_dispatches WHERE created_at>=?)<250 ON CONFLICT(request_id) DO NOTHING RETURNING request_id').bind(body.requestId,body.count,now,now-60000).first();
  if(!row){const existing=await env.DB!.prepare('SELECT count FROM download_dispatches WHERE request_id=?').bind(body.requestId).first<{count:number}>();if(!existing)return response({error:'Reporting temporarily limited.'},429);if(existing.count!==body.count)return response({error:'Dispatch ID reused.'},409);}
  return response({total:await total()});
 }catch{return response({error:'Counter unavailable.'},503);}
}
