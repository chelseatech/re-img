// Estimates based on separate verified download and successful generation totals.
export const estimatedSecondsPerImage=120-12.5;
export const estimatedSecondsPerAltGeneration=60-2.5;
export function formatTimeSaved(total,lang='en',secondsPerUse=estimatedSecondsPerImage){
 if(!Number.isSafeInteger(total)||total<0)return '—';
 const seconds=total*secondsPerUse;
 const hours=seconds>=3600;
 return new Intl.NumberFormat(lang==='fr'?'fr-CA':'en-CA',{maximumFractionDigits:1}).format(seconds/(hours?3600:60))+(hours?' h':' min');
}

export function formatAltTimeSaved(total,lang='en'){return formatTimeSaved(total,lang,estimatedSecondsPerAltGeneration);}
