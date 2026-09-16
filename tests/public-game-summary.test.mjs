import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicGameSummary, hasCompletePublicGameSummaryCoverage, participationRegistrationStatus } from '../js/calculations/public-game-summary.js';

const game={id:'g1',seasonId:'season_2026_27',quarters:4,statsRegistrationType:'quarter',quarterParticipation:{
 q1:{starters:['p1','p2','p3','p4','p5'],substitutions:[]},
 q2:{starters:['p1','p2','p3','p4'],substitutions:[]}
}};
const stats=[
 {id:'g1_p1',gameId:'g1',playerId:'p1',quarters:{q1:{registered:true,quarter:1,shots:[{id:'s1'}]},q2:{registered:true,quarter:2}}},
 {id:'g1_p2',gameId:'g1',playerId:'p2',quarters:{q2:{registered:true,quarter:2}}}
];

test('public game summary preserves game-list registration state',()=>{
 const summary=buildPublicGameSummary(game,stats);
 assert.equal(summary.gameId,'g1');
 assert.equal(summary.seasonId,'season_2026_27');
 assert.equal(summary.totalQuarters,4);
 assert.equal(summary.registeredQuarters,2);
 assert.equal(summary.hasShotPoints,true);
 assert.equal(summary.participationRegisteredQuarters,1);
 assert.equal(summary.participationTotalQuarters,4);
 assert.equal(summary.schemaVersion,1);
});

test('participation summary counts only quarters with five starters',()=>{
 assert.deepEqual(participationRegistrationStatus(game),{registeredQuarters:1,totalQuarters:4});
});

test('anonymous light mode requires summary coverage for every listed game',()=>{
 const summary=buildPublicGameSummary(game,stats);
 assert.equal(hasCompletePublicGameSummaryCoverage([game],[summary]),true);
 assert.equal(hasCompletePublicGameSummaryCoverage([game,{id:'g2'}],[summary]),false);
 assert.equal(hasCompletePublicGameSummaryCoverage([],[summary]),true);
});
