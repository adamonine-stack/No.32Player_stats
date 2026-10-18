import test from 'node:test';
import assert from 'node:assert/strict';
import { collectTeamAnalysisShots } from '../js/calculations/team-shot-list-calculations.js';
import { buildGameHistory } from '../js/calculations/game-event-calculations.js';
const games=[{id:'g',date:'2026-10-18'}];
const row=(id,quarter,remainingSeconds,createdAt=0)=>({id,quarter,remainingSeconds,createdAt,shotType:'jump_shot',result:'made'});

test('Q ascending, then registration order across players even when remaining clocks conflict or are missing',()=>{
 const stats=[{id:'s1',gameId:'g',playerId:'a',quarters:{q2:{shots:[row('q2',null,470,1)]},q1:{shots:[row('second',null,400,20)]}}},
 {id:'s2',gameId:'g',playerId:'b',quarters:{q1:{shots:[row('first',null,30,10),row('third',null,null,30),row('fourth',null,480,40)]}}}];
 const shots=collectTeamAnalysisShots(stats,games);
 assert.deepEqual(shots.map(s=>s.id),['first','second','third','fourth','q2']);
 assert.deepEqual(shots.map(s=>s.quarter),[1,1,1,1,2]);
 assert.equal(shots[0].playerId,'b');
});
test('registration order exactly matches history, including legacy timestamps, sequence and insertion overrides',()=>{
 const game={...games[0],statsRegistrationType:'quarter',eventSequenceOverrides:{'shot:s:1:inserted':1500}};
 const stats=[{id:'s',gameId:'g',playerId:'p',quarters:{q1:{shots:[row('legacy',1,100,1000),{...row('sequenced',1,400,9999),sequence:2000},{...row('inserted',1,480,99999),sequence:3000}]}}}];
 const expected=buildGameHistory(game,stats,[]).filter(item=>item.type==='shot').map(item=>item.sourceId);
 assert.deepEqual(expected,['legacy','inserted','sequenced']);
 assert.deepEqual(collectTeamAnalysisShots(stats,[game]).map(s=>s.id),expected);
});
test('whole-game registrations use history override keys with quarter zero even when a shot carries Q metadata',()=>{
 const stats=[{id:'s',gameId:'g',shots:[row('a',1,0,10),row('b',1,480,20)]}];
 const game={...games[0],eventSequenceOverrides:{'shot:s:0:b':5}};
 assert.deepEqual(collectTeamAnalysisShots(stats,[game]).map(s=>s.id),['b','a']);
});
test('same sequence uses history tie breakers instead of player-document order',()=>{
 const stats=[{id:'b',gameId:'g',shots:[{...row('b',1,480,20),sequence:100,deviceId:'b'}]},
 {id:'a',gameId:'g',shots:[{...row('a',1,20,10),sequence:100,deviceId:'a'}]}];
 assert.deepEqual(collectTeamAnalysisShots(stats,games).map(s=>s.id),['a','b']);
});
test('multiple games stay grouped in ascending date order with each game starting at Q1',()=>{
 const games=[{id:'new',date:'2026-10-18'},{id:'old',date:'2026-10-17'}];
 const stats=[{id:'n',gameId:'new',shots:[row('newQ1',1,400)]},{id:'o',gameId:'old',shots:[row('oldQ2',2,400),row('oldQ1',1,400)]}];
 assert.deepEqual(collectTeamAnalysisShots(stats,games).map(s=>s.id),['oldQ1','oldQ2','newQ1']);
});
test('selected Q is inherited; unknown Q remains unknown and row keys follow the original shot',()=>{
 const stats=[{id:'s',gameId:'g',quarter:3,shots:[row('same',null,400,20),row('same',null,20,10)]},{id:'legacy',gameId:'g',shots:[row('legacy',null,null)]}];
 const shots=collectTeamAnalysisShots(stats,games);
 assert.deepEqual(shots.map(s=>s.quarter),[3,3,null]);
 assert.deepEqual(shots.map(s=>s.teamAnalysisKey),['1','0','2']);
});
