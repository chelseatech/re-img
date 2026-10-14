// Keep completed derivatives for retry; never silently download an incomplete batch.
/**
 * @param {any[]} items
 * @param {(item:any,index:number)=>Promise<any>} prepare
 * @param {{isCancelled?:()=>boolean,onProgress?:(index:number,total:number)=>void,onError?:(item:any,error:any)=>void}} handlers
 */
export async function prepareBatch(items,prepare,{isCancelled=()=>false,onProgress=()=>{},onError=()=>{}}={}){
 const outputs=[],errors=[];
 for(const [index,item] of items.entries()){
  if(isCancelled())return {outputs,errors,cancelled:true};
  onProgress(index+1,items.length);
  try{const out=item.out??await prepare(item,index);if(isCancelled())return {outputs,errors,cancelled:true};outputs.push(out);}
  catch(error){if(isCancelled())return {outputs,errors,cancelled:true};errors.push({item,error});onError(item,error);}
 }
 return {outputs,errors,cancelled:isCancelled()};
}
