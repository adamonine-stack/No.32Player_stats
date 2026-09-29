import test from 'node:test';
import assert from 'node:assert/strict';
import {TOURNAMENT_2026_CBG_HYOGO_MEN,TEAMS_2026_CBG_HYOGO_MEN} from '../js/data/2026-cbg-hyogo-men.js';

test('2026 CBG兵庫県予選の参加数と最終順位',()=>{
  assert.equal(TOURNAMENT_2026_CBG_HYOGO_MEN.participantCount,50);
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.length,50);
  const byName=new Map(TEAMS_2026_CBG_HYOGO_MEN.map(team=>[team.teamName,team]));
  assert.equal(byName.get('BRAVE BIRDS')?.placementLabel,'優勝');
  assert.equal(byName.get('North Wave')?.placementLabel,'準優勝');
  assert.equal(byName.get('センターサークル')?.placementLabel,'3位');
  assert.equal(byName.get('BAY CROWN JUNIOR')?.placementLabel,'4位');
  assert.equal(byName.get('V-WAVE')?.placementLabel,'5位');
  assert.equal(byName.get('DunkGo Club')?.placementLabel,'6位');
  assert.equal(byName.get('HDC Academy Cranes')?.placementLabel,'7位');
  assert.equal(byName.get('DIVE basketball academy')?.placementLabel,'8位');
});

test('順位グループ数が50チームのトーナメント構成と一致する',()=>{
  const counts=TEAMS_2026_CBG_HYOGO_MEN.reduce((acc,team)=>{acc[team.rank]=(acc[team.rank]||0)+1;return acc},{});
  assert.deepEqual(counts,{C:8,E:18,D:16,B:4,S:1,A:2,'A+':1});
});
