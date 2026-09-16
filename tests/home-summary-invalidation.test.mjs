import test from 'node:test';
import assert from 'node:assert/strict';
import {planHomeSummaryRefresh} from '../js/calculations/home-summary-invalidation.js';

const base={id:'g1',seasonId:'season_2026_27',date:'2026-09-16',quarters:4,statsRegistrationType:'quarter',quarterParticipation:{q1:{starters:['p1','p2','p3','p4','p5'],substitutions:[]}},playEvents:[]};

test('playEvents-only changes do not refresh home summaries',()=>{
  const next={...base,playEvents:[{id:'e1',playerId:'p1',type:'stat'}]};
  assert.deepEqual(planHomeSummaryRefresh([base],[next]),{all:false,playerIds:[]});
});

test('participation changes refresh only affected players',()=>{
  const next={...base,quarterParticipation:{q1:{starters:['p1','p2','p3','p4','p5'],substitutions:[{id:'s1',playerOutId:'p5',playerInId:'p6'}]}}};
  assert.deepEqual(planHomeSummaryRefresh([base],[next]),{all:false,playerIds:['p1','p2','p3','p4','p5','p6']});
});

test('summary-wide game metadata changes refresh all summaries',()=>{
  assert.deepEqual(planHomeSummaryRefresh([base],[{...base,date:'2026-09-17'}]),{all:true,playerIds:[]});
});

test('game add or delete refreshes all summaries',()=>{
  assert.equal(planHomeSummaryRefresh([base],[]).all,true);
  assert.equal(planHomeSummaryRefresh([],[base]).all,true);
});
