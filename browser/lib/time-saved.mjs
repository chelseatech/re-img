// Estimate only; derive from the verified shared download total, never a new event count.
export const estimatedSecondsPerImage=120-12.5;
export function formatTimeSaved(total,lang='en'){
 if(!Number.isSafeInteger(total)||total<0)return '—';
 const seconds=total*estimatedSecondsPerImage;
 const hours=seconds>=3600;
 return new Intl.NumberFormat(lang==='fr'?'fr-CA':'en-CA',{maximumFractionDigits:1}).format(seconds/(hours?3600:60))+(hours?' h':' min');
}
