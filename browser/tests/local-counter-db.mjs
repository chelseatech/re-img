// LOCAL fixture inspection only. This never accepts a remote URL/database.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {DatabaseSync} from 'node:sqlite';
const directory=path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const names=fs.readdirSync(directory).filter(name=>/^[a-f0-9]{64}\.sqlite$/.test(name));
if(names.length!==1)throw Error('Expected one local fixture database');
export const localDatabase=path.join(directory,names[0]);
export function localQuery(sql,...args){const db=new DatabaseSync(localDatabase);try{return db.prepare(sql).all(...args);}finally{db.close();}}
export function localRun(sql,...args){const db=new DatabaseSync(localDatabase);try{return db.prepare(sql).run(...args);}finally{db.close();}}
export function preferencesSnapshot(){const rows=localQuery('SELECT user_id,payload,revision,updated_at FROM preferences ORDER BY user_id');return {rows:rows.length,sha256:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex')};}
if(process.argv[2]==='snapshot')console.log(JSON.stringify(preferencesSnapshot()));
