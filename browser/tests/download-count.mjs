import test from 'node:test';import assert from 'node:assert/strict';
import {validDispatch,readDownloadTotal,reportDownload} from '../lib/download-count.mjs';
const requestId='12345678-1234-4123-8123-123456789abc';
test('bounded anonymous dispatch reports accept only count and UUID',()=>{
 assert.equal(validDispatch({requestId,count:1}),true);assert.equal(validDispatch({requestId,count:50}),true);
 for(const body of [null,[],{requestId,count:0},{requestId,count:51},{requestId,count:1.1},{requestId,count:'1'},{requestId:[requestId],count:1},{requestId,count:1,filename:'private.png'},{requestId:'bad',count:1}])assert.ok(!validDispatch(body));
});
test('report retry reuses dispatch ID after a lost response',async()=>{
 let total=0,attempts=0;const seen=new Set(),bodies=[],totals=[];
 await reportDownload(3,value=>totals.push(value),async(path,options)=>{assert.equal(path,'/api/downloads');const body=JSON.parse(options.body);bodies.push(body);if(!seen.has(body.requestId)){seen.add(body.requestId);total+=body.count;}if(attempts++===0)throw Error('Response lost');return {ok:true,json:async()=>({total})};},requestId);
 assert.equal(total,3);assert.deepEqual(bodies,[{requestId,count:3},{requestId,count:3}]);assert.deepEqual(totals,[3]);
});
test('failed reports settle without failing downloads; invalid totals stay hidden',async()=>{
 await reportDownload(1,()=>assert.fail('unverified total'),async()=>{throw Error('Offline');},requestId);
 await assert.rejects(readDownloadTotal(async()=>({ok:true,json:async()=>({total:-1})})));
 assert.equal(await readDownloadTotal(async()=>({ok:true,json:async()=>({total:0})})),0);
});
