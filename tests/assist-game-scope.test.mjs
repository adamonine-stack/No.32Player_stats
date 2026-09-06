import test from 'node:test';
import assert from 'node:assert/strict';
import {planAssistMutation} from '../js/calculations/assist-play-calculations.js';
import {buildGameHistory} from '../js/calculations/game-event-calculations.js';
const players=[{id:'31',number:'31',name:'YOSHI'},{id:'18',number:'18'}];
function setup(mode='quarter',sameShotId=false){
  const game={id:'target',statsRegistrationType:mode,playEvents:[]};
  const shot={id:'target-shot',gameId:game.id,playerId:'31',quarter:2,result:'made',shotValue:2,shotType:'running_shot',shotTypeLabel:'ランニングシュート',remainingSeconds:'',createdAt:10};
  const stat=(gameId,shot)=>({id:gameId+'_31',gameId,playerId:'31',...(mode==='quarter'?{quarters:{q2:{registered:true,quarter:2,twoPa:1,twoPm:1,shots:[shot]}}}:{twoPa:1,twoPm:1,shots:[shot]})});
  const other=stat('other',{...shot,id:sameShotId?shot.id:'other-shot',gameId:'other'}),target=stat('target',shot);
  return {game,shot,stats:[other,target]};
}
for(const mode of ['quarter','game'])for(const sameId of [false,true])test(`delete target Made with earlier other-game player (${mode}, same shot ID=${sameId})`,()=>{
  const f=setup(mode,sameId),before=structuredClone(f),item=buildGameHistory(f.game,f.stats,players).find(e=>e.type==='shot');
  const result=planAssistMutation(f.game,f.stats,players,{kind:'delete',eventId:item.eventId,now:20});
  assert.deepEqual(f,before,'inputs remain immutable');
  assert.deepEqual(result.stats.map(s=>s.id),['target_31'],'only selected game is changed');
  const source=mode==='quarter'?result.stats[0].quarters.q2:result.stats[0];
  assert.deepEqual(source.shots,[]);assert.equal(source.twoPa,0);assert.equal(source.twoPm,0);
});
test('linked Made deletion preserves assistant count and other game records',()=>{
  const f=setup();f.stats[1].quarters.q2.shots[0].assistEventId='ast';f.stats[1].quarters.q2.shots[0].playId='play';
  const shotId=buildGameHistory(f.game,f.stats,players)[0].eventId;
  f.game.playEvents=[{id:'ast',gameId:'target',playerId:'18',quarter:2,type:'stat',statKey:'ast',shotEventId:shotId,playId:'play'}];
  f.stats.unshift({id:'other_18',gameId:'other',playerId:'18',quarters:{q2:{ast:9}}});
  f.stats.push({id:'target_18',gameId:'target',playerId:'18',quarters:{q2:{ast:1}}});
  const before=structuredClone(f),r=planAssistMutation(f.game,f.stats,players,{kind:'delete',eventId:shotId});
  assert.deepEqual(f,before);assert.equal(r.game.playEvents[0].shotEventId,null);
  assert.ok(r.stats.every(s=>s.gameId==='target'));assert.equal(f.stats.at(-1).quarters.q2.ast,1);
});
test('pending/new shot uses the requested game even when same player exists elsewhere',()=>{
  const f=setup(),before=structuredClone(f);f.stats=f.stats.filter(s=>s.gameId!=='target');
  const r=planAssistMutation(f.game,f.stats,players,{kind:'saveShot',shot:f.shot,playId:'new',now:20});
  assert.deepEqual(r.stats.map(s=>s.id),['target_31']);assert.equal(r.stats[0].quarters.q2.shots[0].id,'target-shot');assert.deepEqual(f.stats[0],before.stats[0]);
});

test('a new Made assist ignores registrations belonging to another game',()=>{
  const f=setup();f.stats=[{id:'other_31',gameId:'other',playerId:'31',quarters:{q2:{twoPm:1}}}];
  const r=planAssistMutation(f.game,f.stats,players,{kind:'saveShot',shot:f.shot,assistPlayerId:'18',assistId:'ast',playId:'play',now:20});
  assert.equal(r.game.playEvents[0].playerId,'18');assert.ok(r.stats.every(s=>s.gameId==='target'));
  assert.equal(r.stats.find(s=>s.playerId==='18').quarters.q2.ast,1);
});

test('actual history delete handler completes with mixed-game client state',async()=>{
  const fs=await import('node:fs'),vm=await import('node:vm');
  const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  const extract=name=>{const start=app.search(new RegExp(`^(?:async )?function ${name}\\(`,'m'));const tail=app.slice(start),end=tail.search(/\n(?:async function |function |const |window\.)/);return end<0?tail:tail.slice(0,end)};
  const f=setup(),originalOther=structuredClone(f.stats[0]),item=buildGameHistory(f.game,f.stats,players)[0],messages=[];
  const context=vm.createContext({state:{stats:f.stats},crypto,structuredClone,console,confirm:()=>true,toast:message=>messages.push(message),gameHistoryForm:()=>{},planAssistMutation,
    isAssistEvent:item=>item.type==='stat'&&item.statKey==='ast',isMadeEvent:item=>item.type==='shot'&&item.result==='made',participationPlayers:()=>players,
    prepareHistoryOperation:()=>({sequence:20}),changedOptimisticEventIds:()=>[],quickSession:()=>({}),
    submitOfflineCapable:async(type,payload,commit)=>({queued:false,result:await commit()}),
    commitAssistMutation:async(game,stats,players,action)=>planAssistMutation(game,stats.filter(s=>s.gameId===game.id),players,action)
  });
  vm.runInContext(extract('saveAssistPlay')+'\n'+extract('deleteHistoryItem'),context);
  await context.deleteHistoryItem(f.game,item);
  assert.deepEqual(messages,['履歴を削除しました']);
  assert.equal(context.state.stats.find(s=>s.gameId==='target').quarters.q2.shots.length,0);
  assert.deepEqual(context.state.stats.find(s=>s.gameId==='other'),originalOther);
});
