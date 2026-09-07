import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/quick-input.css',import.meta.url),'utf8');

test('player picker renders latest three canonical history actions newest first',()=>{
  assert.match(app,/groupGameHistory\(items\)\.filter\(item=>item\.precise\)\.slice\(-3\)\.reverse\(\)/);
  assert.match(app,/\$\{latestHistoryHtml\(game\)\}/);
  assert.match(app,/履歴をすべて見る/);
  assert.match(css,/\.quick-latest-history/);
});

test('latest rows reuse canonical history IDs and existing editor',()=>{
  assert.match(app,/data-quick-latest-edit/);
  assert.match(app,/editLatestHistoryItem\(game,item,item\.quarter\|\|quarter\)/);
  assert.match(app,/editHistoryItem\(game,item\)/);
  assert.match(app,/returnToQuickAfterEdit/);
});

test('optimistic stat, FT and shot paths render player picker before network settles',()=>{
  assert.match(app,/game\.playEvents=reconciled\.playEvents[\s\S]{0,700}else quickStatsForm\(game\.id,quarter\);[\s\S]{0,300}submitOfflineCapable\('quickStat'/);
  assert.match(app,/game\.playEvents=optimisticEvents;[\s\S]*if\(quickSession[\s\S]{0,180}else quickStatsForm\(game\.id,quarter\);const payload/);
  assert.match(app,/else if\(action\.returnToQuick\)quickStatsForm\(game\.id,quarter\)/);
  assert.match(app,/kind:'saveShot',shot,assistPlayerId,returnToQuick:true/);
});

test('latest history adds no Firestore listener or query',()=>{
  const implementation=app.slice(app.indexOf('function latestHistoryHtml'),app.indexOf('function assistSelectionSheet'));
  assert.doesNotMatch(implementation,/onSnapshot|collection\(|query\(|getDocs/);
  assert.match(implementation,/buildGameHistory/);
});
