import { getChatGPTUser } from '../../chatgpt-auth';
import { env } from 'cloudflare:workers';
import { cleanPayload } from '../../../lib/preferences.mjs';
export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
  const user=await getChatGPTUser(); if(!user)return response({error:'Sign in to sync presets.'},401);
  const row=await env.DB!.prepare('SELECT payload, revision, updated_at FROM preferences WHERE user_id = ?').bind(user.userId).first<{payload:string,revision:number,updated_at:string}>();
  return response(row?{...JSON.parse(row.payload),revision:row.revision,updatedAt:row.updated_at}:{revision:0});
}
export async function PUT(req:Request){
  const user=await getChatGPTUser(); if(!user)return response({error:'Sign in to sync presets.'},401);
  if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Invalid origin.'},403);
  const text=await req.text();if(text.length>50000)return response({error:'Settings too large.'},413);
  try{
    const body=JSON.parse(text),payload=cleanPayload(body),updatedAt=new Date().toISOString();
    const row=body.revision===0
      ? await env.DB!.prepare('INSERT INTO preferences (user_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(user.userId,JSON.stringify(payload),updatedAt).first<{revision:number}>()
      : await env.DB!.prepare('UPDATE preferences SET payload=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(payload),updatedAt,user.userId,body.revision).first<{revision:number}>();
    if(!row)return response({error:'Presets changed on another device. Load saved presets before saving again.'},409);
    return response({...payload,revision:row.revision,updatedAt});
  }catch(error){return response({error:error instanceof Error?error.message:'Cannot save settings.'},400);}
}
