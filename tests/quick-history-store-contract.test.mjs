import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const store=fs.readFileSync(new URL('../js/core/quick-history-store.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('quick stats and FT use retry-safe Firestore transactions',()=>{
  assert.match(store,/runTransaction\(db/);
  assert.match(store,/pending\.every\(item=>ids\.has\(item\.id\)\)/);
  assert.match(store,/if\(!eventId&&existing\)return/);
  assert.match(app,/commitQuickStatMutation/);
  assert.match(app,/commitQuickFreeThrowMutation/);
});

test('optimistic history is rendered before transaction completion and rolls back on failure',()=>{
  assert.match(app,/game\.playEvents=reconciled\.playEvents;[\s\S]*gameHistoryForm\(game\.id\);[\s\S]*await commitQuickStatMutation/);
  assert.match(app,/game\.playEvents=\[\.\.\.beforeEvents[\s\S]*gameHistoryForm\(game\.id\);[\s\S]*await commitQuickFreeThrowMutation/);
  assert.match(app,/catch\(error\)\{game\.playEvents=previousEvents/);
  assert.match(app,/catch\(error\)\{game\.playEvents=beforeEvents/);
});

test('history fix does not restore global stats reads or opponent listeners',()=>{
  assert.doesNotMatch(app,/onSnapshot\(collection\(db,'stats'\)/);
  assert.match(app,/function ensureOpponentTeamsSync/);
  assert.match(app,/playerSeasonSummaries/);
});
