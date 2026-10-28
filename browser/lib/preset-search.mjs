import {catalogueById} from './catalogue.mjs';
import {presetLabel} from './i18n.mjs';

// Discovery aliases, not specifications. Based on catalogue labels and the
// EN/FR Virtuo reference reviewed 2026-10-20. Sizes always use the app catalogue.
export const presetKeywords={
 'uo-01':{en:['article banner','article header','hero photo','news header'],fr:['bannière article','en-tête article','photo principale','actualité']},
 'uo-02':{en:['author photo','author portrait','headshot','avatar','byline'],fr:['photo auteur','portrait auteur','avatar','signature article']},
 'uo-03':{en:['article image with description','inline article photo','article content'],fr:['image article avec description','photo dans article','contenu article']},
 'uo-04':{en:['article search results','article listing','results thumbnail'],fr:['résultats articles','liste articles','vignette résultats']},
 'uo-05':{en:['body photo','inline content','text and photo','landscape or portrait'],fr:['photo texte','image dans texte','texte et photo','paysage ou portrait']},
 'uo-06':{en:['profile photo','person profile','business card portrait','biography'],fr:['photo profil','fiche personne','portrait carte visite','biographie']},
 'uo-07':{en:['call to action','cta','callout circle','headline link'],fr:['appel à action','incitation','encadré rond','titre lien']},
 'uo-08':{en:['horizontal cards','card row','round card images'],fr:['cartes horizontales','rangée fiches','images fiches rondes']},
 'uo-09':{en:['description card','single link card','topic card'],fr:['carte description','fiche lien unique','fiche sujet']},
 'uo-10':{en:['multiple links card','navigation cards','in page navigation'],fr:['fiche plusieurs liens','cartes navigation','navigation dans page']},
 'uo-11':{en:['contact photo','contact person','contact building'],fr:['photo contact','personne contact','bâtiment contact']},
 'uo-12':{en:['featured story','highlight article','trending article'],fr:['article vedette','actualité vedette','article tendance']},
 'uo-13-1':{en:['two featured articles','featured pair','first feature image'],fr:['deux articles vedettes','paire articles','première image vedette']},
 'uo-13-2':{en:['two featured articles','featured pair','second feature image'],fr:['deux articles vedettes','paire articles','deuxième image vedette']},
 'uo-14':{en:['three features','article and event collection','related events'],fr:['trois vedettes','collection articles événements','événements connexes']},
 'uo-15':{en:['featured story sidebar','article sidebar','main story'],fr:['article encadré latéral','barre latérale article','article principal']},
 'uo-16':{en:['featured event sidebar','upcoming event','event sidebar'],fr:['événement encadré latéral','événement à venir','barre latérale événement']},
 'uo-17':{en:['three related stories','article series','series collection'],fr:['trois articles connexes','série articles','collection série']},
 'uo-18':{en:['full bleed story','wide featured article','edge to edge article'],fr:['article fond perdu','article vedette large','article bord à bord']},
 'uo-19':{en:['large image','edge to edge image','full bleed photo'],fr:['grande image','image bord à bord','photo fond perdu']},
 'uo-20':{en:['page hero','main page header','full bleed banner'],fr:['bannière page','en-tête principal','bannière fond perdu']},
 'uo-21':{en:['wide content image','full width photo','content introduction'],fr:['image contenu large','photo pleine largeur','introduction contenu']},
 'uo-22':{en:['video thumbnail','video poster','video preview','video still'],fr:['vignette vidéo','affiche vidéo','aperçu vidéo','image fixe vidéo']},
 'uo-23':{en:['home page banner','homepage header','home hero','landing homepage'],fr:['bannière accueil','en-tête accueil','image accueil','page accueil']},
 'uo-24':{en:['information list image','info list','list photo'],fr:['image liste informations','liste infos','photo liste']},
 'uo-25':{en:['portrait video thumbnail','vertical video poster','video gallery preview'],fr:['vignette vidéo portrait','affiche vidéo verticale','aperçu galerie vidéo']},
 'uo-26':{en:['quick navigation','four quick links','shortcut links'],fr:['navigation rapide','quatre liens rapides','raccourcis']},
 'uo-27':{en:['tabbed quick links','image tabs','quick link photo'],fr:['liens rapides onglets','onglets images','photo lien rapide']},
 'uo-28':{en:['colour tabs','color tabs','tabbed shortcuts','secondary color links'],fr:['onglets couleurs','raccourcis onglets','liens couleurs secondaires']},
 'uo-29':{en:['quotation','quote image','quote with photo'],fr:['citation','image citation','citation avec photo']},
 'uo-30':{en:['related stories','two related articles','related funds'],fr:['articles connexes','deux articles liés','fonds connexes']},
 'uo-31':{en:['section introduction','section banner','section call to action','first section image'],fr:['introduction section','bannière section','appel action section','première image section']},
 'uo-31-2':{en:['section introduction','section call to action','second section image'],fr:['introduction section','appel action section','deuxième image section']},
 'uo-32':{en:['social media','social post','social grid','social feed image'],fr:['médias sociaux','publication sociale','grille sociale','image réseau social']},
 'uo-33':{en:['split hero','split banner','image and video header','video poster'],fr:['bannière divisée','en-tête divisé','image et vidéo','affiche vidéo']},
 'uo-34':{en:['three static blocks','static image and text','content without links'],fr:['trois blocs statiques','image et texte statiques','contenu sans liens']},
 'uo-35':{en:['featured story collection','article collection'],fr:['collection articles vedettes','collection actualités']},
 'uo-36':{en:['referenced stories','referenced article cards'],fr:['articles référencés','fiches articles référencés']},
 'uo-37':{en:['referenced events','event cards'],fr:['événements référencés','fiches événements']},
 'uo-38':{en:['static photo gallery','twelve images','image gallery'],fr:['galerie photos statiques','douze images','galerie images']},
 'uo-39':{en:['twenty articles','article list','article grid'],fr:['vingt articles','liste articles','grille articles']},
 'uo-40':{en:['featured person','person spotlight'],fr:['personne vedette','personne à honneur']}
};
export const officialImageSpecs={
 en:'https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications',
 fr:'https://virtuo.uottawa.ca/fr/image-marque-design/marketing-numerique/design/specifications-images'
};
export function normalizeSearch(value){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe')
  .replace(/(\d+)\s*(?:px)?\s*(?:×|x|by|par|sur)\s*(\d+)(?:\s*px\b)?/g,'$1x$2')
  .replace(/(\d+)\s*px\b/g,'$1').replace(/[^a-z0-9:]+/g,' ').trim().replace(/\s+/g,' ');
}
export function presetSizes(preset){
 const c=catalogueById.get(preset.id)??preset;
 return [...new Set([{width:c.width,height:c.height},...(c.selectableRatios??[])]
  .filter(v=>Number.isInteger(v.width)&&Number.isInteger(v.height)).map(v=>v.width+'x'+v.height))];
}
export function searchPresets(presets,query,lang='en'){
 const q=normalizeSearch(query);if(!q)return [...presets];
 const tokens=q.split(' ');
 return presets.map((preset,index)=>{
  const c=catalogueById.get(preset.id)??preset,k=presetKeywords[preset.id]??{en:[],fr:[]};
  const local=normalizeSearch(presetLabel(preset,lang)),names=normalizeSearch(preset.name+' '+presetLabel(preset,'fr'));
  const aliases=[...k[lang],...k[lang==='fr'?'en':'fr']].map(normalizeSearch);
  const sizes=presetSizes(preset),sizeText=sizes.map(s=>s.replace('x',' ')+' '+s).join(' ');
  const shapes=normalizeSearch(c.shape==='Circular'?'round circle circular rond cercle circulaire carré square':c.width===c.height&&c.width?'square carré':c.width>c.height?'landscape paysage rectangle rectangular rectangulaire':c.height>c.width?'portrait vertical rectangle rectangular rectangulaire':'');
  const haystack=names+' '+aliases.join(' ')+' '+sizeText+' '+shapes;
  if(!tokens.every(token=>haystack.includes(token)))return null;
  const score=local===q?1000:sizes.includes(q)?950:aliases.includes(q)?900:local.startsWith(q)?850:local.includes(q)?800:names.includes(q)?750:aliases.some(a=>a.includes(q))?700:500;
  return {preset,index,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).map(v=>v.preset);
}

// Explain existing matches without presenting hidden aliases as visible name matches.
export function presetMatchEvidence(preset,query,lang='en'){
 const tokens=normalizeSearch(query).split(' ').filter(Boolean);if(!tokens.length)return [];
 const c=catalogueById.get(preset.id)??preset,k=presetKeywords[preset.id]??{en:[],fr:[]};
 const shape=c.shape==='Circular'?(lang==='fr'?'rond cercle circulaire carré':'round circle circular square'):
  c.width===c.height&&c.width?(lang==='fr'?'carré':'square'):
  c.width>c.height?(lang==='fr'?'paysage rectangle rectangulaire':'landscape rectangle rectangular'):
  c.height>c.width?(lang==='fr'?'portrait vertical rectangle rectangulaire':'portrait vertical rectangle rectangular'):'';
 const fields=[
  ...[presetLabel(preset,lang),presetLabel(preset,lang==='fr'?'en':'fr')].map(value=>({kind:'name',value})),
  ...[...k[lang],...k[lang==='fr'?'en':'fr']].map(value=>({kind:'keyword',value})),
  ...presetSizes(preset).map(value=>({kind:'dimension',value:value.replace('x',' × ')})),
  {kind:'shape',value:shape}
 ];
 const whole=fields.find(field=>tokens.every(token=>normalizeSearch(field.value).includes(token)));
 if(whole)return [whole];
 return [...new Set(tokens.map(token=>fields.find(field=>normalizeSearch(field.value).includes(token))).filter(Boolean))].slice(0,3);
}

// Keep the original spelling, accents and character positions in highlighted text.
export function searchHighlightParts(text,query){
 const tokens=normalizeSearch(query).replace(/(\d)x(?=\d)/g,'$1 ').split(' ').filter(Boolean),map=[];let folded='',offset=0;
 for(const char of text){const value=char.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe');for(const unit of value){folded+=unit;map.push([offset,offset+char.length]);}offset+=char.length;}
 const ranges=[];
 for(const token of tokens){let from=0,index;while((index=folded.indexOf(token,from))!==-1){ranges.push([map[index][0],map[index+token.length-1][1]]);from=index+token.length;}}
 ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const range of ranges){const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
 const parts=[];let start=0;
 for(const [from,to] of merged){if(from>start)parts.push({text:text.slice(start,from),match:false});parts.push({text:text.slice(from,to),match:true});start=to;}
 if(start<text.length)parts.push({text:text.slice(start),match:false});
 return parts.length?parts:[{text,match:false}];
}
