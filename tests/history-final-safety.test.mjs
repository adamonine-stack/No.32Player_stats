import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameHistory,createPlayEvent,groupGameHistory,historyActionOrderOverrides,historyInsertionOverrides} from '../js/calculations/game-event-calculations.js';
import {mergeHistoryItems,prepareHistoryOperation,resetHistorySequenceForTests} from '../js/calculations/history-order.js';
import {rollbackOptimisticEvents,rollbackOptimisticStats} from '../js/calculations/optimistic-rollback.js';
import {planAssistMutation} from '../js/calculations/assist-play-calculations.js';
import {createShot} from '../js/calculations/shot-calculations.js';

const players=[{id:'32',number:'32'},{id:'8',number:'8'}];
const game=()=>({id:'g',statsRegistrationType:'quarter',quarters:4,playEvents:[],quarterParticipation:{q1:{starters:['32','8'],substitutions:[]}}});
const event=(id,sequence,statKey='dr')=>createPlayEvent({id,gameId:'g',quarter:1,player:players[0],statKey,sequence,createdAt:sequence});

test('offline rollback removes only failed operation and preserves listener-confirmed sibling',()=>{
  const before=[event('saved-a',1)],optimistic=[...before,event('pending-b',2)],listener=[...optimistic,event('remote-c',3)];
  assert.deepEqual(rollbackOptimisticEvents(listener,before,optimistic,['pending-b']).map(item=>item.id),['saved-a','remote-c']);
});

test('rollback preserves a same-stat remote update instead of restoring stale snapshot',()=>{
  const before=[{id:'g_32',quarters:{q1:{dr:1}}}],optimistic=[{id:'g_32',quarters:{q1:{dr:2}}}],remote=[{id:'g_32',quarters:{q1:{dr:5}}}];
  assert.deepEqual(rollbackOptimisticStats(remote,before,optimistic),remote);
  assert.deepEqual(rollbackOptimisticStats(optimistic,before,optimistic),before);
});

test('two tabs may create equal sequences but immutable IDs give reload-stable order',()=>{
  const a={id:'op-a',eventId:'op-a',sequence:100},b={id:'op-b',eventId:'op-b',sequence:100};
  const first=mergeHistoryItems([b,a],[]).map(item=>item.id),reload=mergeHistoryItems(structuredClone([a,b]),[]).map(item=>item.id);
  assert.deepEqual(first,['op-a','op-b']);assert.deepEqual(reload,first);
});

test('independent client allocators keep operation IDs unique even on equal clocks',()=>{
  resetHistorySequenceForTests();const left=prepareHistoryOperation({id:'tab-a'},{now:1000});resetHistorySequenceForTests();const right=prepareHistoryOperation({id:'tab-b'},{now:1000});
  assert.equal(left.sequence,right.sequence);assert.notEqual(left.operationId,right.operationId);
});

test('manual D A B C order survives normal and rapid new additions',()=>{
  const g=game();g.playEvents=['a','b','c','d'].map((id,index)=>event(id,index+1));let history=buildGameHistory(g,[],players);
  g.eventSequenceOverrides=historyActionOrderOverrides([history[3],history[0],history[1],history[2]]);
  g.playEvents.push(...['shot','reb','ast','to','stl'].map((id,index)=>event(id,100+index)));
  assert.deepEqual(buildGameHistory(structuredClone(g),[],players).map(item=>item.id),['d','a','b','c','shot','reb','ast','to','stl']);
});

test('insertion then normal addition and reorder remain integer-index stable',()=>{
  const g=game();g.playEvents=['a','b','c','d','x'].map((id,index)=>event(id,index+1));g.eventSequenceOverrides=historyInsertionOverrides(buildGameHistory(g,[],players),['x'],'b');
  g.playEvents.push(event('y',100));let history=buildGameHistory(g,[],players);assert.deepEqual(history.map(item=>item.id),['a','b','x','c','d','y']);
  g.eventSequenceOverrides=historyActionOrderOverrides([history[5],...history.slice(0,5)]);assert.deepEqual(buildGameHistory(structuredClone(g),[],players).map(item=>item.id),['y','a','b','x','c','d']);
  assert.ok(Object.values(g.eventSequenceOverrides).every(Number.isInteger));
});

test('AST IDs survive reorder, inserted events, delayed completion and reload',()=>{
  const g=game(),shot=createShot({id:'shot-a',gameId:'g',playerId:'32',quarter:1,shotArea:'center_mid',shotType:'jump_shot',result:'made',createdAt:1});
  const linked=planAssistMutation(g,[],players,{kind:'saveShot',shot,assistPlayerId:'8',now:2,playId:'play-a',assistId:'ast-b'}),stats=linked.stats;
  linked.game.playEvents.push(event('reb',3),event('stl',4),event('to',5));const history=buildGameHistory(linked.game,stats,players),shotItem=history.find(item=>item.type==='shot'),ast=history.find(item=>item.statKey==='ast');
  linked.game.eventSequenceOverrides=historyActionOrderOverrides([shotItem,...history.filter(item=>![shotItem.eventId,ast.eventId].includes(item.eventId)),ast]);
  const reload=buildGameHistory(structuredClone(linked.game),structuredClone(stats),players),reloadedShot=reload.find(item=>item.type==='shot'),reloadedAst=reload.find(item=>item.statKey==='ast');
  assert.equal(reloadedShot.assistEventId,reloadedAst.eventId);assert.equal(reloadedAst.shotEventId,reloadedShot.eventId);assert.equal(groupGameHistory(reload).filter(item=>item.linkedAssist).length,1);
});

test('deleting linked Made clears AST shot reference without deleting AST counter',()=>{
  const g=game(),shot=createShot({id:'s',gameId:'g',playerId:'32',quarter:1,shotArea:'center_mid',shotType:'jump_shot',result:'made',createdAt:1});let result=planAssistMutation(g,[],players,{kind:'saveShot',shot,assistPlayerId:'8',now:2,playId:'p',assistId:'a'});
  const shotId=buildGameHistory(result.game,result.stats,players).find(item=>item.type==='shot').eventId;const deleted=planAssistMutation(result.game,result.stats,players,{kind:'delete',eventId:shotId,now:3});
  const ast=deleted.game.playEvents.find(item=>item.id==='a'),combined=[...result.stats.filter(item=>!deleted.stats.some(next=>next.id===item.id)),...deleted.stats];assert.equal(ast.shotEventId,null);assert.equal(combined.find(item=>item.playerId==='8').quarters.q1.ast,1);
});

test('cache and listener replay merge operation ID once',()=>{
  const cached=[{id:'a',eventId:'a',sequence:1}],pending=[{id:'op',eventId:'op',sequence:2,syncState:'pending'}],server=[{id:'a',eventId:'a',sequence:1},{id:'op',eventId:'op',sequence:2,syncState:'saved'}];
  assert.deepEqual(mergeHistoryItems(server,pending).map(item=>item.id),['a','op']);assert.deepEqual(mergeHistoryItems(cached,server).map(item=>item.id),['a','op']);
});
