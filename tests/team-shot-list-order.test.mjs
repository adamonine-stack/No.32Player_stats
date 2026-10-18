import test from 'node:test';
import assert from 'node:assert/strict';
import { collectTeamAnalysisShots } from '../js/calculations/team-shot-list-calculations.js';
const games=[{id:'g',date:'2026-10-18'}];
const row=(id,quarter,remainingSeconds,createdAt=0)=>({id,quarter,remainingSeconds,createdAt,shotType:'jump_shot',result:'made'});

test('interleaved players sort by Q then descending remaining time, regardless of input time',()=>{
 const stats=[{id:'s1',gameId:'g',playerId:'a',quarters:{q2:{shots:[row('q2',null,470)]},q1:{shots:[row('late',null,30,1)]}}},
 {id:'s2',gameId:'g',playerId:'b',quarters:{q1:{shots:[row('early',null,480,999),row('mid',null,240,1000),row('end',null,0)]}}}];
 const shots=collectTeamAnalysisShots(stats,games);
 assert.deepEqual(shots.map(s=>s.id),['early','mid','late','end','q2']);
 assert.deepEqual(shots.map(s=>s.quarter),[1,1,1,1,2]);
 assert.equal(shots[0].playerId,'b');
});
test('same clock uses sequence including history overrides, and unknown clocks follow timed shots in registration order',()=>{
 const stats=[{id:'s',gameId:'g',playerId:'p',shots:[row('unknownLate',1,null,20),row('unknownEarly',1,'',10),{...row('sameB',1,300),sequence:20},{...row('sameA',1,300),sequence:30},row('end',1,0)]}];
 const ordered=collectTeamAnalysisShots(stats,[{...games[0],eventSequenceOverrides:{'shot:s:1:sameA':10}}]);
 assert.deepEqual(ordered.map(s=>s.id),['sameA','sameB','end','unknownEarly','unknownLate']);
});
test('multiple games stay grouped in ascending date order with each game starting at Q1',()=>{
 const games=[{id:'new',date:'2026-10-18'},{id:'old',date:'2026-10-17'}];
 const stats=[{id:'n',gameId:'new',shots:[row('newQ1',1,400)]},{id:'o',gameId:'old',shots:[row('oldQ2',2,400),row('oldQ1',1,400)]}];
 assert.deepEqual(collectTeamAnalysisShots(stats,games).map(s=>s.id),['oldQ1','oldQ2','newQ1']);
});
test('flattened selected quarter is inherited; missing Q stays unknown and unique row keys survive sorting',()=>{
 const stats=[{id:'s',gameId:'g',quarter:3,shots:[row('same',null,20),row('same',null,400)]},{id:'legacy',gameId:'g',shots:[row('legacy',null,null)]}];
 const shots=collectTeamAnalysisShots(stats,games);
 assert.deepEqual(shots.map(s=>s.quarter),[3,3,null]);
 assert.deepEqual(shots.map(s=>s.teamAnalysisKey),['1','0','2']);
});
