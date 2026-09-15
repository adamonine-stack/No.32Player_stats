import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /TEAM_POWER_HISTORY_REFRESH_VERSION='2026-09-15-history-average-v2'/);
assert.match(app, /async function recalculatePersistedTeamRankAndPower\(season='2026-27'\)/);
assert.match(app, /async function ensureHistoricalTeamPowerRefresh\(\)/);
assert.match(app, /teamPowerHistoryRefreshVersion:TEAM_POWER_HISTORY_REFRESH_VERSION/);
assert.match(app, /if\(u\)await ensureHistoricalTeamPowerRefresh\(\)/);
assert.match(app, /await setDoc\(doc\(db,'opponentTeams',id\),data,\{merge:true\}\);await recalculatePersistedTeamRankAndPower\(\)/);
assert.ok((app.match(/await recalculatePersistedTeamRankAndPower\(\);/g)||[]).length >= 11);
assert.match(app, /function opponentHistoricalPowerBonus\(team=\{\}\)/);
assert.match(app, /<span>過去実績加算<\/span><b>\+\$\{opponentHistoricalPowerBonus\(team\)\}<\/b>/);
assert.match(index, /app\.js\?v=20260915-opponent-freeze-fix-v1/);
assert.match(app, /service-worker\.js\?v=20260915-opponent-freeze-fix-v1/);
assert.match(sw, /r32-shell-20260915-opponent-freeze-fix-v1/);

console.log('Team Power historical refresh contract: ok');
