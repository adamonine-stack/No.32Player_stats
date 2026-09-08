import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {HistoryJournal,createHistoryOverlay,applyHistoryPatch} from '../js/core/history-journal.js';
import {projectSessionDocument,stampSessionOverlay} from '../js/core/quarter-session-model.js';
import {assertStatsBaseline,createStatsBaseline} from '../js/core/normal-stats-guard.js';
import {buildGameHistory,createPlayEvent} from '../js/calculations/game-event-calculations.js';
import {planAssistMutation} from '../js/calculations/assist-play-calculations.js';
import {gamePlayingTime} from '../js/calculations/participation-calculations.js';
const base={id:'g',statsRegistrationType:'quarter',quarters:4,playEvents:[],quarterParticipation:{q1:{starters:['p','a','b','c','d'],substitutions:[]}}};
const players=['p','a','b','c','d','e'].map((id,i)=>({id,number:String(i+1)}));
const code=fs.readFileSync(new URL('../js/core/quarter-session-store.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export async function','async function');
function server(initial=base,stats=[]){
 const docs=new Map([['games/g',structuredClone(initial)],...stats.map(s=>['stats/'+s.id,structuredClone(s)])]);let failed=false,lost=false,writes=0;
 const merge=(a,b)=>{const out={...a};for(const [k,v] of Object.entries(b))out[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(a?.[k],v):structuredClone(v);return out};
 const ctx=vm.createContext({projectSessionDocument,assertStatsBaseline,db:{},doc:(_,c,id)=>c+'/'+id,serverTimestamp:()=>({seconds:1}),runTransaction:async(_,callback)=>{
  const pending=[];const result=await callback({get:async key=>({id:key.split('/')[1],exists:()=>docs.has(key),data:()=>structuredClone(docs.get(key))}),set:(key,data)=>pending.push([key,data])});
  if(failed){failed=false;throw Error('offline')}
  for(const [key,value] of pending){docs.set(key,merge(docs.get(key),value));writes++}
  if(lost){lost=false;throw Error('response lost')}return result;
 }});vm.runInContext(code,ctx);
 return {docs,commit:ctx.commitQuarterOperation,fail:()=>failed=true,lose:()=>lost=true,writes:()=>writes,game:()=>docs.get('games/g'),stats:()=>[...docs].filter(([k])=>k.startsWith('stats/')).map(([k,v])=>({...v,id:k.split('/')[1]}))};
}
function client(device='A',game=base,stats=[]){let g=structuredClone(game),s=structuredClone(stats),seq=0,clock=0;const ops=[];
 const stage=(afterGame,afterStats,now=1000,quarter=1,payload={})=>{
  const beforeGame=g,beforeStats=s,id=`${device}-${++seq}`;clock=Math.max(clock,now);
  const op={id,operationId:id,deviceId:device,gameId:'g',quarter,clientCreatedAt:clock,createdAt:clock,localSequence:seq,type:'event',ownerUid:'qa',sessionVersion:1,syncState:'draft',historyClock:{clientId:device+':q'+quarter,revision:seq},payload,overlay:createHistoryOverlay(beforeGame,beforeStats,afterGame,afterStats)};
  stampSessionOverlay(op.overlay,{deviceId:device,operationId:id,clientCreatedAt:clock,localSequence:seq});
  g=applyHistoryPatch(beforeGame,op.overlay.documents[0].patch);s=[...beforeStats];for(const change of op.overlay.documents.slice(1)){const next=applyHistoryPatch(s.find(x=>'stats/'+x.id===change.key),change.patch);s=[...s.filter(x=>x.id!==next.id),next]};ops.push(op);return op;
 };
 const stat=(key,now=1000,q=1)=>{const id='g_p',old=s.find(x=>x.id===id)||{id,gameId:'g',playerId:'p'},source=old.quarters?.['q'+q]||{},event=createPlayEvent({id:`${device}-event-${seq+1}`,gameId:'g',quarter:q,player:players[0],statKey:key,type:key==='pf'?'foul':'stat',sequence:now});return stage({...g,playEvents:[...g.playEvents,event]},[...s.filter(x=>x.id!==id),{...old,quarters:{...old.quarters,['q'+q]:{...source,[key]:(source[key]||0)+1,registered:true,quarter:q}}}],now,q)};
 const assist=(action,now=1000)=>{const result=planAssistMutation(g,s,players,{playId:`${device}-play-${seq+1}`,assistId:`${device}-ast-${seq+1}`,now, ...action});return stage(result.game,[...s.filter(x=>!result.stats.some(n=>n.id===x.id)),...result.stats],now)};
 return {ops,stage,stat,assist,game:()=>g,stats:()=>s,history:()=>buildGameHistory(g,s,players)};
}
const run=async(s,ops)=>{for(const op of ops)await s.commit(op)};
for(const key of ['dr','or','ast','blk','pf','passCut','passMiss'])test(`${key}: input, durable projection, atomic Q registration and duplicate receipt`,async()=>{
 const c=client(),op=c.stat(key),s=server();assert.equal(c.history().length,1);await s.commit(op);await s.commit(op);assert.equal(s.game().playEvents.length,1);assert.equal(s.stats()[0].quarters.q1[key],1);assert.equal(s.stats()[0].quarters.q1.registered,true);assert.equal(s.docs.size,3);
});
test('20 actions visible immediately; stale listener, restart and game-first/stat-first listeners cannot erase them',async()=>{
 const c=client();for(let i=0;i<20;i++)c.stat('dr',1000+i);const j=new HistoryJournal();j.receive('games',[base]);for(const op of structuredClone(c.ops))j.start(op);j.receive('games',[base]);j.receive('stats',[]);const h=()=>buildGameHistory(j.project('games',[base])[0],j.project('stats',[]),players);assert.equal(h().length,20);
 const s=server();await run(s,c.ops);for(const op of c.ops)j.complete(op.id);j.receive('games',[s.game()]);assert.equal(h().length,20);j.receive('stats',s.stats());assert.equal(j.retire().length,20);assert.equal(buildGameHistory(s.game(),s.stats(),players).length,20);assert.equal(s.stats()[0].quarters.q1.dr,20);
});
for(const order of ['AB','BA'])test(`two devices interleave and converge in ${order} synchronization order`,async()=>{
 const a=client('A'),b=client('B');a.stat('dr',1001);a.stat('ast',1004);a.stat('blk',1008);b.stat('passMiss',1002);b.stat('passCut',1006);b.stat('dr',1009);const s=server();await run(s,order==='AB'?[...a.ops,...b.ops]:[...b.ops,...a.ops]);const h=buildGameHistory(s.game(),s.stats(),players);assert.deepEqual(h.map(x=>x.clientCreatedAt),[1001,1002,1004,1006,1008,1009]);assert.equal(s.stats()[0].quarters.q1.dr,2);
});
test('clock rollback, same millisecond, and cross-device clock offset form a total order',async()=>{
 const a=client('A'),b=client('B');for(const time of [3000,1000,999,3000])a.stat('dr',time);for(const time of [2999,3000,3001])b.stat('blk',time);const s=server();await run(s,[...b.ops,...a.ops]);const h=buildGameHistory(s.game(),s.stats(),players);assert.deepEqual(h.filter(x=>x.deviceId==='A').map(x=>x.localSequence),[1,2,3,4]);for(let n=0;n<5;n++){const mixed={...s.game(),playEvents:[...s.game().playEvents].reverse()};assert.deepEqual(buildGameHistory(mixed,s.stats(),players).map(x=>x.id),h.map(x=>x.id))}
});
test('failure before commit keeps documents unchanged; retry resumes without duplicates',async()=>{const c=client();c.stat('dr');c.stat('pf');const s=server();await s.commit(c.ops[0]);s.fail();await assert.rejects(s.commit(c.ops[1]));assert.equal(s.game().playEvents.length,1);await run(s,c.ops);assert.equal(s.game().playEvents.length,2)});
test('lost commit response followed by replay does not increment twice',async()=>{const c=client(),op=c.stat('dr'),s=server();s.lose();await assert.rejects(s.commit(op));await s.commit(op);assert.equal(s.stats()[0].quarters.q1.dr,1)});
test('Q2 may commit before Q1 without acknowledging Q1',async()=>{const c=client();c.stat('dr',1000,1);c.stat('dr',1001,2);const s=server();await s.commit(c.ops[1]);await s.commit(c.ops[0]);assert.equal(s.stats()[0].quarters.q1.dr,1);assert.equal(s.stats()[0].quarters.q2.dr,1)});
const shot={id:'shot',gameId:'g',playerId:'p',quarter:1,shotArea:'center_mid',shotType:'jump_shot',result:'made',shotValue:2,shotX:50,shotY:30,createdAt:1000,sequence:1000};
test('SHOT+AST and point data commit in one transaction and survive Q edit',async()=>{const c=client();c.assist({kind:'saveShot',shot,assistPlayerId:'a'});const s=server();await run(s,c.ops);const h=buildGameHistory(s.game(),s.stats(),players),sh=h.find(x=>x.type==='shot'),ast=h.find(x=>x.statKey==='ast');assert.equal(sh.playId,ast.playId);assert.equal(ast.shotEventId,sh.eventId);assert.equal(s.stats().find(x=>x.playerId==='p').quarters.q1.shots[0].shotX,50);
 const edit=client('C',s.game(),s.stats());edit.assist({kind:'saveShot',shot:{...s.stats().find(x=>x.playerId==='p').quarters.q1.shots[0],shotX:52},edit:true},2000);await run(s,edit.ops);assert.equal(s.stats().find(x=>x.playerId==='p').quarters.q1.shots[0].shotX,52);assert.equal(s.stats().find(x=>x.playerId==='a').quarters.q1.ast,1);
});
test('FT 2/3 commits and edit/delete replay preserves counters',async()=>{const c=client(),ft=createPlayEvent({id:'ft',gameId:'g',quarter:1,player:players[0],type:'freeThrow',attempts:3,made:2,sequence:1000});c.stage({...base,playEvents:[ft]},[{id:'g_p',gameId:'g',playerId:'p',quarters:{q1:{fta:3,ftm:2,quarter:1,registered:true}}}]);const s=server();await run(s,c.ops);const edit=client('C',s.game(),s.stats());edit.assist({kind:'delete',eventId:'ft'});await run(s,edit.ops);await run(s,edit.ops);assert.equal(s.stats()[0].quarters.q1.fta,0);assert.equal(s.game().playEvents.length,0)});
test('IN/OUT and playing time preserve another device substitution and other Q',async()=>{const a=client('A'),b=client('B');for(const [c,id,seconds,out,inside] of [[a,'sub1',300,'p','e'],[b,'sub2',200,'e','p']])c.stage({...base,quarterParticipation:{q1:{...base.quarterParticipation.q1,substitutions:[{id,sequence:1000,remainingSeconds:seconds,playerOutId:out,playerInId:inside}]}}},[],1000);const s=server();await run(s,[...b.ops,...a.ops]);assert.equal(s.game().quarterParticipation.q1.substitutions.length,2);assert.equal(gamePlayingTime(s.game()).p,380)});
test('existing totals and other Q are retained; no empty overwrite',async()=>{const existing={id:'g_p',gameId:'g',playerId:'p',quarters:{q1:{registered:true,dr:7,twoPa:4,shots:[shot]},q2:{registered:true,dr:9}}},c=client('A',base,[existing]);c.stat('dr');const s=server(base,[existing]);await run(s,c.ops);assert.equal(s.stats()[0].quarters.q1.dr,8);assert.deepEqual(s.stats()[0].quarters.q2,existing.quarters.q2);assert.deepEqual(s.stats()[0].quarters.q1.shots,[shot])});
test('same-event concurrent edit is rejected atomically, retaining local operation',async()=>{const c=client();c.assist({kind:'saveShot',shot});const s=server();await run(s,c.ops);const a=client('C',s.game(),s.stats()),b=client('B',s.game(),s.stats());a.assist({kind:'saveShot',shot:{...shot,shotX:51},edit:true});b.assist({kind:'saveShot',shot:{...shot,shotX:52},edit:true});await run(s,a.ops);const previous=structuredClone([...s.docs]);await assert.rejects(run(s,b.ops));assert.deepEqual([...s.docs],previous);assert.equal(b.ops.length,1)});
test('absolute-form safety baseline checked again inside transaction',async()=>{const stat={id:'g_p',gameId:'g',playerId:'p',quarters:{q1:{registered:true,quarter:1,dr:3}}},c=client('A',base,[stat]);const action={kind:'reconcileStats',playerId:'p',quarter:1,values:{dr:0},baseline:createStatsBaseline(base,stat,'p',1)};const r=planAssistMutation(base,[stat],players,action);const op=c.stage(r.game,r.stats,1000,1,{action});const s=server(base,[{...stat,quarters:{q1:{...stat.quarters.q1,dr:4}}}]);await assert.rejects(s.commit(op));assert.equal(s.stats()[0].quarters.q1.dr,4);assert.equal(s.writes(),0)});
test('same-device predecessor receipt prevents another tab from overtaking an earlier draft',async()=>{
 const c=client();c.stat('dr');c.stat('pf');c.ops[1].predecessorId=c.ops[0].operationId;const s=server();
 await assert.rejects(s.commit(c.ops[1]),/前の入力/);assert.equal(s.writes(),0);
 await run(s,c.ops);await run(s,c.ops);assert.equal(s.game().playEvents.length,2);
});
