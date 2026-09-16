import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('settings view does not start or tear down stats subscriptions',()=>{
  assert.match(app,/if\(\['games','stats','team'\]\.includes\(state\.tab\)\)\{ensureStatsSync\(state\.allGames\.map\(game=>game\.id\),seasonId\);return\}if\(state\.tab==='settings'\)return;ensureStatsSync\(\[\],seasonId\)/);
  assert.doesNotMatch(app,/\['games','stats','team','settings'\]/);
});

test('admin maintenance loads source collections on demand',()=>{
  assert.match(app,/async function loadAdminSourceData\(\)/);
  assert.match(app,/toast\('移行対象データを読み込んでいます'\);const source=await loadAdminSourceData\(\)/);
});

test('initial stats snapshots rebuild only after all desired listeners are ready',()=>{
  assert.match(app,/if\(!initial\|\|statsReady\(\)\)rebuildStats\(\)/);
});

test('game snapshots use targeted home summary invalidation',()=>{
  assert.match(app,/planHomeSummaryRefresh\(previousServerGames,serverGames\)/);
  assert.match(app,/if\(plan\.all\)queueHomeSummaryRefresh\(\);else if\(plan\.playerIds\.length\)queueHomeSummaryRefresh\(plan\.playerIds\)/);
});
