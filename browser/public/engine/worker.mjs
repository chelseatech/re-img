import {execute} from './abi.mjs';
let engine;
async function ready(){if(!engine){const response=await fetch('/engine/prep_wasm.wasm');if(!response.ok)throw new Error('Image engine could not load. Retry when online.');const {instance}=await WebAssembly.instantiate(await response.arrayBuffer(),{});engine=instance.exports;}return engine;}
self.onmessage=async({data:{id,input,request}})=>{
  try{const result=execute(await ready(),new Uint8Array(input),request);self.postMessage({id,...result},[result.data.buffer]);}
  catch(error){self.postMessage({id,error:error.message});}
};
