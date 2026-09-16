import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /function opponentTeamPowerStanding\(team=\{\},teams=state\.opponentTeams\)/);
assert.match(app, /values=teams\.map\(opponentTeamPowerValue\)\.filter\(value=>value!==null&&value>0\)/);
assert.match(app, /if\(power===null\|\|power<=0\)return \{rank:null,total:values\.length,label:'対象外'\}/);
assert.match(app, /const rank=1\+values\.filter\(value=>value>power\)\.length/);
assert.match(app, /Number\.isFinite\(value\)&&value>=0/);
assert.match(index, /app\.js\?v=20260917-audit-consistency-v1/);
assert.match(app, /service-worker\.js\?v=20260917-audit-consistency-v1/);
assert.match(sw, /r32-shell-20260917-audit-consistency-v1/);

console.log('opponent team power ranking contract: ok');
