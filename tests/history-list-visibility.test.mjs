import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameHistory,visibleGameHistory} from '../js/calculations/game-event-calculations.js';

test('hide aggregate-only unordered rows without changing stats or recorded actions',()=>{
  const game={id:'g',statsRegistrationType:'quarter',quarters:1};
  const stats=[{id:'s',gameId:'g',playerId:'p',quarters:{q1:{ast:2,dr:1,shots:[{id:'shot',result:'made',shotValue:2}]}}}];
  const before=structuredClone(stats),all=buildGameHistory(game,stats,[{id:'p'}]);
  const visible=visibleGameHistory(all);
  assert.equal(visible.length,1);
  assert.equal(visible[0].sourceKind,'shot');
  assert.equal(visible[0].precise,false);
  const legacy=all.find(item=>item.sourceKind==='legacyStat');
  const ordered=buildGameHistory({...game,eventSequenceOverrides:{[legacy.eventId]:1}},stats,[{id:'p'}]);
  assert.ok(visibleGameHistory(ordered).some(item=>item.eventId===legacy.eventId));
  assert.deepEqual(stats,before);
});
