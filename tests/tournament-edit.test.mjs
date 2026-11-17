import test from 'node:test';
import assert from 'node:assert/strict';
import { commitTournamentEdit, tournamentMatchesRecord, tournamentReferencePatch, tournamentSeasonId } from '../js/calculations/tournament-edit-calculations.js';

const original = {id:'cup',name:'県大会',year:2026,seasonId:'season_2026_27',season:'2026-27',category:'U15',prefecture:'兵庫県',tournamentLevel:'prefecture',sourceType:'official',createdAt:'original-created'};
const patch = {name:'県大会（修正）',year:2026,seasonId:'season_2026_27',season:'2026-27',generation:'2026-27',category:'',prefecture:'',tournamentLevel:'national'};
function fixture() {
  let data = {
    tournaments:{cup:structuredClone(original)},
    games:{linked:{tournamentId:'cup',tournament:'県大会',date:'2026-11-01',ownScore:56,quarterParticipation:{q1:{starters:['p1']}}},legacy:{tournament:'県大会',date:'2026-11-02',seasonId:'season_2026_27'},older:{tournament:'県大会',date:'2025-11-02',seasonId:'season_2025_26'}},
    tournamentGames:{m1:{tournamentId:'cup',tournamentName:'県大会',scoreA:88}},
    opponentTeams:{team:{players:[{number:'1',name:'選手'}],tournamentPlacements:[{tournamentId:'cup',tournamentName:'県大会',year:2026,season:'2026-27',placementLabel:'優勝',wins:4},{tournamentId:'other',tournamentName:'別大会',placementLabel:'準優勝'}]}}
  };
  const store = {
    list:async kind=>Object.entries(data[kind]).map(([id,row])=>({...structuredClone(row),id})),
    timestamp:()=> 'now',calculateTeam:()=>({calculatedRank:'A+',teamPower:800}),
    transaction:async callback=>{
      const draft=structuredClone(data);
      let writes=0;
      const result=await callback({
        read:async(kind,id)=>draft[kind][id]?{...structuredClone(draft[kind][id]),id}:null,
        write:(kind,id,p)=>{if(store.failAfter && ++writes>=store.failAfter)throw Error('connection failed');draft[kind][id]={...draft[kind][id],...p}}
      });
      data=draft;return result;
    }
  };
  return {store,get data(){return data}};
}

test('record identity respects explicit IDs and isolates same-name years and generations',()=>{
  assert.equal(tournamentMatchesRecord({tournamentId:'cup'},original),true);
  assert.equal(tournamentMatchesRecord({tournamentId:'other',tournamentName:'県大会',year:2026},original),false);
  assert.equal(tournamentMatchesRecord({tournamentName:'県大会',year:2025},original),false);
  assert.equal(tournamentMatchesRecord({tournamentName:'県大会',year:2026,seasonId:'season_2025_26'},original),false);
  assert.equal(tournamentMatchesRecord({tournamentName:'県大会'},original),false);
  assert.equal(tournamentSeasonId({year:2025}),'season_2025_26');
});

test('an edit retains IDs, source metadata, results, players and game statistics',async()=>{
  const f=fixture();await commitTournamentEdit(f.store,original,patch);
  assert.equal(f.data.tournaments.cup.name,patch.name);
  assert.equal(f.data.tournaments.cup.sourceType,'official');
  assert.equal(f.data.tournaments.cup.createdAt,'original-created');
  assert.equal(f.data.games.linked.ownScore,56);
  assert.deepEqual(f.data.games.linked.quarterParticipation,{q1:{starters:['p1']}});
  assert.equal(f.data.games.legacy.tournament,patch.name);
  assert.equal(f.data.games.legacy.tournamentId,'cup');
  assert.equal(f.data.games.older.tournament,'県大会');
  assert.equal(f.data.tournamentGames.m1.scoreA,88);
  assert.equal(f.data.tournamentGames.m1.tournamentName,patch.name);
  assert.deepEqual(f.data.opponentTeams.team.players,[{number:'1',name:'選手'}]);
  const [edited,other]=f.data.opponentTeams.team.tournamentPlacements;
  assert.equal(edited.placementLabel,'優勝');assert.equal(edited.wins,4);
  assert.equal(edited.tournamentLevel,'national');assert.equal(edited.category,'');assert.equal(edited.prefecture,'');
  assert.equal(other.tournamentName,'別大会');
  assert.equal(f.data.opponentTeams.team.calculatedRank,'A+');
});

test('saving an unchanged name does not conflict with itself, but another master cannot be duplicated',async()=>{
  const f=fixture();await commitTournamentEdit(f.store,original,{...patch,name:original.name});
  const f2=fixture();f2.data.tournaments.other={name:patch.name,year:2026};
  await assert.rejects(commitTournamentEdit(f2.store,original,patch),/登録されています/);
  assert.equal(f2.data.tournaments.cup.name,original.name);
});

test('a failure rolls back both master and linked references',async()=>{
  const f=fixture(),before=structuredClone(f.data);f.store.failAfter=2;
  await assert.rejects(commitTournamentEdit(f.store,original,patch),/connection failed/);
  assert.deepEqual(f.data,before);
});

test('concurrent tournament edits and deletion are rejected before any writes',async()=>{
  const f=fixture();f.data.tournaments.cup.name='他端末の変更';
  await assert.rejects(commitTournamentEdit(f.store,original,patch),/別の端末/);
  assert.equal(f.data.games.linked.tournament,'県大会');
  delete f.data.tournaments.cup;
  await assert.rejects(commitTournamentEdit(f.store,original,patch),/削除されています/);
});

test('the latest roster and achievements are read again inside the transaction',async()=>{
  const f=fixture(),transact=f.store.transaction;
  f.store.transaction=callback=>{
    f.data.opponentTeams.team.tournamentPlacements.push({tournamentId:'new',tournamentName:'別端末で追加'});
    f.data.opponentTeams.team.players.push({number:'2',name:'追加選手'});
    return transact(callback);
  };
  await commitTournamentEdit(f.store,original,patch);
  assert.equal(f.data.opponentTeams.team.tournamentPlacements.length,3);
  assert.equal(f.data.opponentTeams.team.players.length,2);
});

test('moving tournament metadata preserves game generation and unrelated master fields',()=>{
  const moved={...patch,year:2027,seasonId:'season_2027_28',season:'2027-28',generation:'2027-28'};
  const gamePatch=tournamentReferencePatch({tournamentId:'cup',seasonId:'season_2026_27'},original,moved,'games');
  assert.deepEqual(gamePatch,{tournament:patch.name,tournamentId:'cup'});
  const teamPatch=tournamentReferencePatch({tournamentPlacements:[{tournamentId:'cup',year:2026,seasonId:'season_2026_27'}]},original,moved,'opponentTeams');
  assert.equal(teamPatch.tournamentPlacements[0].seasonId,'season_2027_28');
});
