export function execute(engine,input,request) {
  const opts=new TextEncoder().encode(JSON.stringify(request));
  const a=engine.allocate(input.length), b=engine.allocate(opts.length);
  let result;
  try {
    new Uint8Array(engine.memory.buffer,a,input.length).set(input);
    new Uint8Array(engine.memory.buffer,b,opts.length).set(opts);
    result=engine.process(a,input.length,b,opts.length);
    const view=new DataView(engine.memory.buffer);
    const length=view.getUint32(result,true), head=view.getUint32(result+4,true);
    const meta=JSON.parse(new TextDecoder().decode(new Uint8Array(engine.memory.buffer,result+8,head)));
    const data=new Uint8Array(engine.memory.buffer,result+8+head,length-8-head).slice();
    engine.release(result,length); result=undefined;
    if(meta.error)throw new Error(meta.error);
    return {meta,data};
  }finally{engine.release(a,input.length);engine.release(b,opts.length);}
}
