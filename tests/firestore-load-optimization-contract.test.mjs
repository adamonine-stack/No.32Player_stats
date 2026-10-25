import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {viewDataHarness} from './helpers/view-data-harness.mjs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('settings view does not start or tear down stats subscriptions',()=>{
  const calls=viewDataHarness({tab:'settings',selectedSeasonId:'season',allGames:[{id:'g'}]});
  assert.equal(calls.some(([kind])=>kind==='stats'),false);
  assert.equal(calls.some(([kind])=>kind==='publicSummary'),false);
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
