import catalogue from './uottawa-catalogue.json' with {type:'json'};
export const components=catalogue;
export const catalogueEntries=catalogue.flatMap(c=>c.variants?c.variants.map((v,i)=>({...c,...v,id:`${c.id}-${i+1}`,heading:c.name,name:`${c.name} - ${v.label}`,flexible:false})): [{...c,heading:c.name}]);
export const catalogueById=new Map(catalogueEntries.map(c=>[c.id,c]));
export function recipeFromCatalogue(c,defaults){return {...defaults,id:c.id,name:c.name,width:c.width,height:c.height,maxKB:c.maxKB,format:'jpeg',byteBase:1000,circle:c.shape==='Circular'};}
