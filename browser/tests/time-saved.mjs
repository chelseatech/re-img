import assert from 'node:assert/strict';
import {formatTimeSaved} from '../lib/time-saved.mjs';
for(const invalid of [null,undefined,-1,1.5,'1',NaN,Number.MAX_SAFE_INTEGER+1])assert.equal(formatTimeSaved(invalid),'—');
for(const [count,en,fr] of [[0,'0 min','0 min'],[1,'1.8 min','1,8 min'],[3,'5.4 min','5,4 min'],[17,'30.5 min','30,5 min'],[34,'1 h','1 h'],[1289,'38.5 h','38,5 h'],[1000000,'29,861.1 h','29 861,1 h']]){assert.equal(formatTimeSaved(count,'en'),en);assert.equal(formatTimeSaved(count,'fr'),fr);}
assert.ok(!/NaN|Infinity/.test(formatTimeSaved(Number.MAX_SAFE_INTEGER)));
console.log('PASS estimated time: unknown/invalid, zero, single, batch count, hours, persisted count, large totals and EN/FR units.');
