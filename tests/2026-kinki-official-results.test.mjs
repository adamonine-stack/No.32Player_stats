import test from 'node:test';
import assert from 'node:assert/strict';
import { VERIFIED_2026_KINKI_RESULT_EVENTS } from '../js/data/2026-kinki-jwc-soutai-results-men.js';
import { JWC_2026_ALL_TEAM_SUPPLEMENTS } from '../js/data/2026-kinki-jwc-all-teams-men.js';
import { TEAMS_2026_CBG_HYOGO_MEN } from '../js/data/2026-cbg-hyogo-men.js';
import { TEAMS_2026_KYOTO_JHS_SOUTAI_MEN } from '../js/data/2025-2026-kyoto-history-men.js';
import { TEAMS_2026_OSAKA_U15_MEN } from '../js/data/2026-osaka-u15-men.js';
import { TEAMS_2026_NARA_U15_MEN, MATCHES_2026_NARA_U15_MEN } from '../js/data/2026-nara-u15-men.js';

const normalized=s=>String(s).normalize('NFKC').replace(/[\s　.\-・]/g,'').toLocaleLowerCase('ja');
const jwcEvents=VERIFIED_2026_KINKI_RESULT_EVENTS.filter(e=>e.tournament.id.includes('jwc-qualifier'));
const combined=e=>[...e.teams,...JWC_2026_ALL_TEAM_SUPPLEMENTS[e.tournament.id]];

test('five completed 2026 Kinki JWC prefectures have separate, non-duplicated male-team entries',()=>{
  const totals={'兵庫県':76,'大阪府':90,'滋賀県':11,'奈良県':8,'和歌山県':17};
  assert.equal(jwcEvents.length,5);
  for(const e of jwcEvents){
    const teams=combined(e);
    assert.equal(teams.length,totals[e.tournament.prefecture],e.tournament.prefecture);
    assert.equal(new Set(teams.map(x=>normalized(x.teamName))).size,teams.length);
    assert.equal(e.tournament.gender,'男子');
    for(const x of teams){
      assert.ok(x.teamName&&x.placementLabel);
      if(x.resultConfirmed===false){
        assert.equal(x.teamPowerEligible,false);
        assert.equal(x.placementConfirmed,false);
        assert.equal(x.rank,null);
      }
    }
  }
});
test('Nara and Wakayama JWC brackets have independently confirmed placements for all entries',()=>{
  for(const pref of ['奈良県','和歌山県']){
    const e=jwcEvents.find(x=>x.tournament.prefecture===pref);
    assert.ok(combined(e).every(x=>x.resultConfirmed!==false&&x.placementConfirmed!==false));
  }
});
test('unfinished Kyoto 2026 JWC must not be imported as finalized',()=>{
  assert.equal(jwcEvents.some(x=>x.tournament.prefecture==='京都府'),false);
});
test('CBG Hyogo is separate from summer-club tournament and contains 50 records',()=>{
  assert.equal(TEAMS_2026_CBG_HYOGO_MEN.length,50);
  assert.ok(TEAMS_2026_CBG_HYOGO_MEN.some(t=>t.teamName==='BRUINS ashiya'));
});
test('official Kyoto 2026 middle-school summer roster includes its two opening-round losers',()=>{
  assert.equal(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN.length,10);
  assert.equal(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN.find(t=>t.teamName==='宇治中学校').placementLabel,'ベスト16');
  assert.equal(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN.find(t=>t.teamName==='加悦中学校').placementLabel,'ベスト16');
});
test('Osaka 2026 summer club runner-up reflects official association statement',()=>{
  assert.equal(TEAMS_2026_OSAKA_U15_MEN.find(t=>t.teamName==='T-SMILE').placementLabel,'準優勝');
  assert.notEqual(TEAMS_2026_OSAKA_U15_MEN.find(t=>t.teamName==='REDFORCES').placementLabel,'準優勝');
});
test('Nara summer club quarterfinal losers are never labeled round-of-16',()=>{
  const byName=new Map(TEAMS_2026_NARA_U15_MEN.map(t=>[t.teamName,t]));
  for(const g of MATCHES_2026_NARA_U15_MEN.filter(g=>g.round==='準々決勝')){
    const team=byName.get(g.loser);
    assert.ok(team);
    assert.equal(team.placementLabel,'ベスト8',g.loser);
  }
});
