import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameHistory,visibleGameHistory} from '../js/calculations/game-event-calculations.js';

test('retain stat-linked unordered fouls, assists, steals and rebounds',()=>{
  const game={id:'g',statsRegistrationType:'quarter',quarters:1};
  const stats=[{id:'s',gameId:'g',playerId:'p',quarters:{q1:{pf:1,ast:2,passCut:1,dr:1,or:1,shots:[{id:'shot',result:'made',shotValue:2}]}}}];
  const before=structuredClone(stats),all=buildGameHistory(game,stats,[{id:'p'}]);
  const visible=visibleGameHistory(all);
  assert.deepEqual(visible,all);
  for(const key of ['pf','ast','passCut','dr','or']){
    const rows=visible.filter(item=>item.statKey===key);
    assert.equal(rows.length,key==='ast'?2:1);
    assert.ok(rows.every(item=>item.statId==='s'&&!item.precise));
  }
  assert.ok(visible.some(item=>item.sourceKind==='shot'));
  assert.equal(visibleGameHistory(buildGameHistory(game,[],[])).length,0);
  const legacy=all.find(item=>item.sourceKind==='legacyStat');
  const ordered=buildGameHistory({...game,eventSequenceOverrides:{[legacy.eventId]:1}},stats,[{id:'p'}]);
  assert.ok(visibleGameHistory(ordered).some(item=>item.eventId===legacy.eventId));
  assert.deepEqual(stats,before);
});
