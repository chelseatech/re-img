import {env} from 'cloudflare:workers';
import {handleAltText} from '../../../lib/alt-cloud.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handleAltText(request,env);}
