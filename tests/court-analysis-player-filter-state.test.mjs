import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const start=app.indexOf('function openShotAnalysis()');
const end=app.indexOf('window.openShotAnalysis=openShotAnalysis',start);
const analysis=app.slice(start,end);
const playerChange=analysis.match(/const bindPlayerPicker=.*?const bindFilters=/s)?.[0]||'';

assert.ok(start>=0&&end>start,'court analysis implementation exists');
for(const marker of ["selectedAreas=new Set(SHOT_AREA_ORDER)","selectedResults=new Set(['made','missed','fouled'])","selectedTypes=new Set(registeredShotTypeIds"])assert.ok(analysis.includes(marker),marker);
assert.match(playerChange,/state\.lastPlayerId=nextId;setLastPlayerId\(nextId\);/);
assert.match(playerChange,/renderAnalysis\(\)/);
assert.doesNotMatch(playerChange,/selectedAreas\.clear\(\)|selectedResults\.clear\(\)|selectedTypes\.clear\(\)/);
assert.match(analysis,/const allShots=\(\)=>collectShots\(analysisShotItems\(\)\)/);
console.log('court analysis player filter state: ok');
