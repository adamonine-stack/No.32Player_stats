import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /option value="power-desc".*Team Power（高い順）/);
assert.match(app, /option value="power-asc".*Team Power（低い順）/);
assert.match(app, /const aZero=av===0,bZero=bv===0/);
assert.match(app, /if\(aZero!==bZero\)return aZero\?1:-1/);
assert.match(app, /if\(aZero&&bZero\)return opponentTeamNameCompare\(a,b\)/);
assert.match(index, /app\.js\?v=20260915-team-power-no-phantom-v1/);
assert.match(app, /service-worker\.js\?v=20260915-team-power-no-phantom-v1/);
assert.match(sw, /r32-shell-20260915-team-power-no-phantom-v1/);

console.log('opponent team power sort contract: ok');
