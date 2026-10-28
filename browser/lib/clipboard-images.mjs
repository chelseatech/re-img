export function editablePasteTarget(event){
 const first=event.composedPath?.()[0]??event.target;
 const element=first?.nodeType===1?first:first?.parentElement;
 return !!element?.closest?.('input,textarea,select,[role="textbox"],[contenteditable]:not([contenteditable="false"])');
}
export function clipboardImages(event){
 if(editablePasteTarget(event))return [];
 const data=event.clipboardData;if(!data)return [];
 const fromItems=Array.from(data.items??[]).filter(item=>item.kind==='file'&&item.type.startsWith('image/')).map(item=>item.getAsFile()).filter(file=>file&&file.type.startsWith('image/'));
 // items and files commonly describe the same image. Read one representation.
 const files=fromItems.length?fromItems:Array.from(data.files??[]).filter(file=>file.type.startsWith('image/'));
 return [...new Set(files)];
}
