import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /TEAM_POWER_HISTORY_REFRESH_VERSION='2026-09-16-national-team-power-floor-v1'/);
assert.doesNotMatch(app, /if\(u\)await ensureHistoricalTeamPowerRefresh\(\)/);
assert.match(app, /function scheduleOpponentTeamsRender\(\)/);
assert.match(app, /function opponentHistoricalPowerBonus\(team=\{\}\)/);
assert.match(app, /function validOpponentPlacements\(team=\{\}\)\{return opponentPlacements\(team\)\.filter\(isValidTournamentAchievement\)\}/);
assert.match(app, /大会記録：\$\{validOpponentPlacements\(team\)\.length\}件/);
assert.match(app, /seasonLabel=seasonRanks\[season\]\?\.rank\|\|\(seasonRecords\.length\?'参加':'未設定'\)/);
assert.match(app, /function opponentPrefecturePowerLabel\(team=\{\}\)/);
assert.match(app, /県大会評価（前年実績・暫定）/);
assert.match(app, /県大会評価（全国大会出場から補完）/);
assert.match(app, /<span>過去実績平均<\/span><b>\$\{opponentHistoricalPowerBonus\(team\)\} \/ 100<\/b>/);
assert.match(index, /app\.js\?v=20260916-team-type-tabs-v1/);
assert.match(app, /service-worker\.js\?v=20260916-team-type-tabs-v1/);
assert.match(sw, /r32-shell-20260916-team-type-tabs-v1/);

console.log('Team Power validated history UI contract: ok');
