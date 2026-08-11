import assert from "node:assert/strict";
import { selectedTeamQuarterStatus, teamGamePeriods, teamRegisteredQuarterNumbers, teamStatsForView } from "../js/calculations/team-game-period-calculations.js";
import { derived, sumStats } from "../js/calculations/stats-calculations.js";
const game={quarters:4,ownScore:65,oppScore:58,quarterScores:{q1:{team:12,opponent:16},q2:{team:30,opponent:30},q3:{team:45,opponent:40},q4:{team:65,opponent:58}}};
const periods=teamGamePeriods(game,"quarter","q2",[1,2,4]);
assert.deepEqual(periods.map(({label,team,opponent})=>[label,team,opponent]),[["1Q",12,16],["2Q",18,14],["3Q",15,10],["4Q",20,18],["FINAL",65,58]]);
assert.equal(periods[1].selected,true);assert.equal(periods[4].selected,false);assert.equal(periods[2].registered,false);
assert.equal(teamGamePeriods({...game,quarters:2},"quarter","game",[]).map(x=>x.label).join("/"),"1Q/2Q/FINAL");
assert.equal(teamGamePeriods({...game,quarters:5,quarterScores:{...game.quarterScores,q5:{team:70,opponent:63}}},"quarter","game",[]).map(x=>x.label).join("/"),"1Q/2Q/3Q/4Q/5Q/FINAL");
assert.ok(teamGamePeriods(game,"game","game",[]).slice(0,-1).every(x=>x.disabled));
assert.equal(selectedTeamQuarterStatus("quarter","q2",[2]),"registered");
assert.equal(selectedTeamQuarterStatus("quarter","q3",[2]),"unregistered");
assert.equal(selectedTeamQuarterStatus("game","q2",[]),"unavailable");
assert.equal(selectedTeamQuarterStatus("quarter","game",[]),"final");
const quarterGame={...game,id:"g1",statsRegistrationType:"quarter"};
const stats=[
  {id:"a",gameId:"g1",quarters:{q1:{registered:true,twoPa:4,twoPm:2,threePa:1,threePm:1,fta:2,ftm:1,ast:2,passCut:1,or:2,passMiss:1},q2:{registered:true,twoPa:3,twoPm:1,threePa:2,threePm:1,ast:1,dribbleCut:2,dr:3,otherTo:1}}},
  {id:"b",gameId:"g1",quarters:{q2:{registered:true,twoPa:5,twoPm:4,threePa:1,threePm:0,fta:2,ftm:2,ast:3,blk:1,stealOther:1,or:1,catchMiss:1}}}
];
assert.deepEqual(teamRegisteredQuarterNumbers(stats),[1,2]);
const q2=sumStats(teamStatsForView(quarterGame,stats,"q2"),[quarterGame]),q2d=derived(q2);
assert.deepEqual({twoPa:q2.twoPa,twoPm:q2.twoPm,threePa:q2.threePa,threePm:q2.threePm,fta:q2.fta,ftm:q2.ftm,ast:q2.ast,blk:q2.blk,stl:q2d.stl,reb:q2d.reb,to:q2d.to,pts:q2d.pts},{twoPa:8,twoPm:5,threePa:3,threePm:1,fta:2,ftm:2,ast:4,blk:1,stl:3,reb:4,to:2,pts:15});
const playerQ2=sumStats(teamStatsForView(quarterGame,[stats[0]],"q2"),[quarterGame]),playerQ2d=derived(playerQ2);
assert.deepEqual({pts:playerQ2d.pts,ast:playerQ2.ast,stl:playerQ2d.stl,reb:playerQ2d.reb,to:playerQ2d.to},{pts:5,ast:1,stl:2,reb:3,to:1});
assert.equal(teamStatsForView(quarterGame,stats,"q3").length,0);
assert.equal(teamStatsForView({...quarterGame,statsRegistrationType:"game"},stats,"q2"),stats);
console.log("team game periods: ok");
