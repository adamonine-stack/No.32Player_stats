import test from 'node:test';
import assert from 'node:assert/strict';
import {TOURNAMENT_2026_CBG_HYOGO_MEN,TEAMS_2026_CBG_HYOGO_MEN,MATCHES_2026_CBG_HYOGO_FINAL_MEN} from '../js/data/2026-cbg-hyogo-men.js';

test('2026 CBG兵庫県予選の最終結果データ',()=>{
  assert.equal(TOURNAMENT_2026_CBG_HYOGO_MEN.participantCount,50);
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.length,50);
  assert.deepEqual(
    TEAMS_2026_CBG_HYOGO_MEN.filter(team=>team.numericPlacement).sort((a,b)=>a.numericPlacement-b.numericPlacement).map(team=>[team.numericPlacement,team.teamName,team.placementLabel]),
    [
      [1,'BRAVE BIRDS','優勝'],
      [2,'North Wave','準優勝'],
      [3,'センターサークル','3位'],
      [4,'BAY CROWN JUNIOR','4位'],
      [5,'Three B','5位'],
      [6,'DunkGo Club','6位'],
      [7,'HDC Academy Cranes','7位'],
      [8,'DIVE basketball academy','8位']
    ]
  );
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.filter(team=>team.placementLabel==='ベスト16').length,8);
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.filter(team=>team.placementLabel==='ベスト32').length,16);
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.filter(team=>team.placementLabel==='ベスト64以下・県大会出場').length,18);
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.find(team=>team.bracketSeed===18)?.teamName,'VLakers Basketball Club U15 男子');
  assert.equal(MATCHES_2026_CBG_HYOGO_FINAL_MEN.length,4);
  assert.deepEqual(MATCHES_2026_CBG_HYOGO_FINAL_MEN.map(match=>match.winner),['BRAVE BIRDS','センターサークル','Three B','HDC Academy Cranes']);
});
