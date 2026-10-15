// Browser input cap uses decimal MB and is separate from all export byte limits.
export const inputByteLimit=50000000;
export function assertInputSize(size){
 if(!Number.isSafeInteger(size)||size<0)throw Error('Input size is invalid.');
 if(size>inputByteLimit)throw Error('Source exceeds the 50 MB input limit.');
 return size;
}
