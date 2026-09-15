import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /function opponentTeamPowerStanding\(team=\{\},teams=state\.opponentTeams\)/);
assert.match(app, /const rank=1\+values\.filter\(value=>value>power\)\.length/);
assert.match(app, /label:\`\$\{rank\}位 \/ \$\{values\.length\}チーム\`/);
assert.match(app, /power===null.*label:'対象外'/);
assert.match(app, /Team Power順位：\$\{escapeHtml\(opponentTeamPowerStanding\(team\)\.label\)\}/);
assert.match(app, /<span>Team Power順位<\/span><b>\$\{escapeHtml\(opponentTeamPowerStanding\(team\)\.label\)\}<\/b>/);
assert.match(index, /app\.js\?v=20260915-team-power-prev-fallback-v1/);
assert.match(app, /service-worker\.js\?v=20260915-team-power-prev-fallback-v1/);
assert.match(sw, /r32-shell-20260915-team-power-prev-fallback-v1/);

console.log('opponent team power ranking contract: ok');
