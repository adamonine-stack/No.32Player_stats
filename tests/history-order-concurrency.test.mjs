import test from 'node:test';
import assert from 'node:assert/strict';
import {nextHistorySequence,prepareHistoryOperation,mergeHistoryItems,resetHistorySequenceForTests} from '../js/calculations/history-order.js';
import {buildGameHistory,createPlayEvent,historyActionOrderOverrides,historyInsertionOverrides} from '../js/calculations/game-event-calculations.js';
import {planAssistMutation} from '../js/calculations/assist-play-calculations.js';
import {createShot} from '../js/calculations/shot-calculations.js';

const players=[{id:'32',number:'32'},{id:'8',number:'8'}];
const baseGame=()=>({id:'g',statsRegistrationType:'quarter',quarters:4,playEvents:[],quarterParticipation:{q1:{starters:['32','8'],substitutions:[]}}});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('same millisecond allocates ten unique increasing input sequences',()=>{
  resetHistorySequenceForTests();const game=baseGame(),values=Array.from({length:10},()=>nextHistorySequence(game,1000));
  assert.equal(new Set(values).size,10);assert.deepEqual(values,[...values].sort((a,b)=>a-b));
});

test('SHOT -> REB -> AST stays input ordered when save completion is reversed',async()=>{
  resetHistorySequenceForTests();const game=baseGame(),input=['SHOT','REB','AST'].map(label=>({...prepareHistoryOperation(game,{now:2000}),id:label,eventId:label,label}));
  const completed=[];await Promise.all(input.map((item,index)=>wait([30,10,20][index]).then(()=>completed.push(item))));
  assert.deepEqual(completed.map(item=>item.label),['REB','AST','SHOT']);
  assert.deepEqual(mergeHistoryItems(completed,[]).map(item=>item.label),['SHOT','REB','AST']);
});

test('reverse delay pattern also preserves input order',async()=>{
  resetHistorySequenceForTests();const game=baseGame(),input=['SHOT','STL','TO','REB'].map(label=>({...prepareHistoryOperation(game,{now:3000}),id:label,eventId:label,label}));
  const completed=[];await Promise.all(input.map((item,index)=>wait([5,30,20,10][index]).then(()=>completed.push(item))));
  assert.deepEqual(mergeHistoryItems(completed,[]).map(item=>item.label),input.map(item=>item.label));
});

test('optimistic and listener copies merge by immutable event ID without duplicates',()=>{
  const pending={id:'e1',eventId:'e1',sequence:1,syncState:'pending'},saved={id:'e1',eventId:'e1',sequence:1,syncState:'saved'};
  assert.deepEqual(mergeHistoryItems([saved],[pending]).map(item=>item.eventId),['e1']);
});

test('manual reorder remains authoritative and survives rebuilt history',()=>{
  const game=baseGame();game.playEvents=['a','b','c'].map((id,index)=>createPlayEvent({id,gameId:'g',quarter:1,player:players[0],statKey:'ast',sequence:index+1}));
  const first=buildGameHistory(game,[],players);game.eventSequenceOverrides=historyActionOrderOverrides([first[2],first[0],first[1]]);
  assert.deepEqual(buildGameHistory(game,[],players).map(item=>item.eventId),['c','a','b']);
});

test('insertion between B and C is stable after reload',()=>{
  const game=baseGame();game.playEvents=['a','b','c','d'].map((id,index)=>createPlayEvent({id,gameId:'g',quarter:1,player:players[0],statKey:'ast',sequence:index+1}));
  game.eventSequenceOverrides=historyInsertionOverrides(buildGameHistory(game,[],players),['d'],'b');
  assert.deepEqual(buildGameHistory(structuredClone(game),[],players).map(item=>item.eventId),['a','b','d','c']);
});

test('AST remains linked by immutable IDs after reorder and reload',()=>{
  let game=baseGame();const shot=createShot({id:'s',gameId:'g',playerId:'32',quarter:1,shotArea:'right_45_3p',shotType:'jump_shot',result:'made',createdAt:1});
  const result=planAssistMutation(game,[],players,{kind:'saveShot',shot,assistPlayerId:'8',now:10,playId:'play',assistId:'ast'});game=result.game;
  const stats=result.stats,history=buildGameHistory(game,stats,players),shotItem=history.find(item=>item.type==='shot'),ast=history.find(item=>item.statKey==='ast');
  game.eventSequenceOverrides={ [ast.eventId]:1,[shotItem.eventId]:2 };const reloaded=buildGameHistory(structuredClone(game),structuredClone(stats),players);
  const nextShot=reloaded.find(item=>item.type==='shot'),nextAst=reloaded.find(item=>item.statKey==='ast');
  assert.equal(nextShot.assistEventId,nextAst.eventId);assert.equal(nextAst.shotEventId,nextShot.eventId);
});

test('Miss cannot receive AST and cross-game IDs cannot resolve',()=>{
  const game=baseGame(),miss=createShot({id:'m',gameId:'g',playerId:'32',quarter:1,shotArea:'center_mid',shotType:'jump_shot',result:'missed',createdAt:1});
  assert.throws(()=>planAssistMutation(game,[],players,{kind:'saveShot',shot:miss,assistPlayerId:'8',now:2,playId:'p',assistId:'a'}),/Made/);
  assert.throws(()=>planAssistMutation(game,[],players,{kind:'link',shotEventId:'shot:other',assistPlayerId:'8',now:2}),/対象の履歴/);
});

test('failed optimistic event rolls back without removing saved siblings',()=>{
  const saved=[{id:'a',eventId:'a',sequence:1}],pending=[{id:'b',eventId:'b',sequence:2,syncState:'failed'}];
  const rolled=mergeHistoryItems(saved,pending.filter(item=>item.syncState!=='failed'));
  assert.deepEqual(rolled.map(item=>item.eventId),['a']);
});
