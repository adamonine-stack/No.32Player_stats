import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /function normalizedOpponentPlacementRank\(item=\{\}\)/);
assert.match(app, /if\(stored==='B\+'\)return 'B'/);
assert.match(app, /placementLabelToRank\(item\.placementLabel\|\|item\.placement\)/);
assert.match(app, /function opponentTeamDisplayRank\(team=\{\}\)/);
assert.match(app, /チームランク：\$\{opponentTeamDisplayRank\(team\)\|\|'未設定'\}/);
assert.match(app, /bindGameFormCloseAction\(\$\('#closeModal'\)\)/);
assert.match(app, /await setDoc\(doc\(db,'opponentTeams',id\),data,\{merge:true\}\);\s*closeModal\(\);\s*toast\('保存しました'\);\s*try\{await recalculatePersistedTeamRankAndPower/s);
assert.match(index, /app\.js\?v=20260917-opponent-edit-rank-v1/);
assert.match(app, /service-worker\.js\?v=20260917-opponent-edit-rank-v1/);
assert.match(sw, /r32-shell-20260917-opponent-edit-rank-v1/);

console.log('opponent team edit/rank regression contract: ok');
