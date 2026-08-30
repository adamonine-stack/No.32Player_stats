import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildGameHistory, historyInsertionOverrides } from '../js/calculations/game-event-calculations.js';

const players=[{id:'p32',number:'32',name:'R32'}];
const game={id:'g1',quarters:4,statsRegistrationType:'quarter',playEvents:[
  {id:'a',type:'stat',statKey:'ast',playerId:'p32',playerNumber:'32',quarter:1,sequence:100},
  {id:'ft',type:'freeThrow',attempts:2,made:1,playerId:'p32',playerNumber:'32',quarter:1,sequence:150},
  {id:'b',type:'stat',statKey:'or',playerId:'p32',playerNumber:'32',quarter:1,sequence:200}
]};
const stats=[{id:'g1_p32',gameId:'g1',playerId:'p32',quarters:{q1:{ast:1,or:1,fta:2,ftm:1}}}];
const history=buildGameHistory(game,stats,players);
assert.deepEqual(history.map(item=>item.eventId),['a','ft','b']);
assert.equal(history.find(item=>item.eventId==='ft').content,'FT 1/2');
assert.equal(history.filter(item=>item.content==='FTA'||item.content==='FTM').length,0,'batch FT suppresses synthesized legacy rows');
assert.deepEqual(historyInsertionOverrides(history,['new'],null),{new:1,a:2,ft:3,b:4},'head insert');
assert.deepEqual(historyInsertionOverrides(history,['new'],'a'),{a:1,new:2,ft:3,b:4},'middle insert');
assert.deepEqual(historyInsertionOverrides(history,['new'],'b'),{a:1,ft:2,b:3,new:4},'tail insert');

const legacy=buildGameHistory({...game,playEvents:[]},stats,players);
assert.equal(legacy.filter(item=>item.content==='FTA').length,2);
assert.equal(legacy.filter(item=>item.content==='FTM').length,1);

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
for(const marker of ['historyInsertButton','startHistoryInsertion','applyPendingHistoryInsertion','quickSelectedHeader','quickActionSheet','saveQuickFreeThrow','quickFreeThrowEdit','data-history-insert','data-quick-player','data-quick-action="out"'])assert.ok(app.includes(marker),marker);
assert.match(app,/type:'freeThrow',attempts,made/);
assert.match(app,/quickAfterSave\(game,quarter\)/);
console.log('history insertion and free throw: ok');
