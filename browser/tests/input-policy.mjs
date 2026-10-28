import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inputByteLimit,assertInputSize} from '../public/engine/input-policy.mjs';
import {execute} from '../public/engine/abi.mjs';

const limitError='Source exceeds the 50 MB input limit.';

test('source policy uses an inclusive 50,000,000-byte decimal limit',()=>{
 assert.equal(inputByteLimit,50000000);
 for(const size of [0,1,inputByteLimit-1,inputByteLimit])assert.equal(assertInputSize(size),size);
 for(const size of [inputByteLimit+1,50*1024*1024,100000000,Number.MAX_SAFE_INTEGER])assert.throws(()=>assertInputSize(size),{message:limitError});
});

test('source policy rejects invalid byte counts rather than coercing them',()=>{
 for(const size of [-1,-0.5,0.5,NaN,Infinity,-Infinity,Number.MAX_SAFE_INTEGER+1,'50000000','',undefined,null,true,false,{},[],50000000n]){
  assert.throws(()=>assertInputSize(size),String(size));
 }
});

test('ABI checks actual selected bytes before any WASM allocation',()=>{
 // A real byte buffer proves the boundary independently of a mocked File.size.
 // The engine stub intentionally stops at allocate: no WASM decoding or network.
 const actual=new Uint8Array(inputByteLimit+1),allocations=[];
 const reachedAllocation=new Error('QA reached allocation');
 const engine={allocate(length){allocations.push(length);throw reachedAllocation;}};
 assert.throws(()=>execute(engine,actual,{mode:'preview'}),{message:limitError});
 assert.deepEqual(allocations,[],'oversized source never allocates or executes WASM');

 const boundary=actual.subarray(0,inputByteLimit);
 assert.equal(boundary.buffer.byteLength,inputByteLimit+1);
 assert.equal(boundary.byteLength,inputByteLimit);
 assert.throws(()=>execute(engine,boundary,{mode:'preview'}),error=>error===reachedAllocation);
 assert.deepEqual(allocations,[inputByteLimit],'exact limit is accepted; unused backing bytes do not count');

 allocations.length=0;
 assert.throws(()=>execute(engine,actual,{mode:'export'}),{message:limitError});
 assert.deepEqual(allocations,[],'export receives the same actual-byte guard as preview');
});
