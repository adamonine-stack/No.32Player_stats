import test from 'node:test';
import assert from 'node:assert/strict';
import { assistCandidates,planAssistMutation,nearbyMadeShots } from '../js/calculations/assist-play-calculations.js';
import { buildGameHistory,historyInsertionOverrides } from '../js/calculations/game-event-calculations.js';
import { createShot,collectShots,shotTotals } from '../js/calculations/shot-calculations.js';
import { sumStats } from '../js/calculations/stats-calculations.js';
const players=[4,7,8,21,32,12].map(n=>({id:String(n),number:String(n),name:`選手${n}`}));
const fixture=()=>({game:{id:'g',statsRegistrationType:'quarter',quarters:4,quarterParticipation:{q1:{starters:['4','7','8','21','32'],substitutions:[]},q2:{starters:['4','7','12','21','32'],substitutions:[]}}},stats:[]});
const shot=(id='s',result='made',quarter=1)=>createShot({id,gameId:'g',playerId:'32',quarter,shotArea:'right_45_3p',shotType:'jump_shot',result,remainingSeconds:'',createdAt:100});
let serial=0;
function mutate(f,action){const r=planAssistMutation(f.game,f.stats,players,{now:200,playId:`play${++serial}`,assistId:`ast${serial}`,...action});f.game=r.game;f.stats=[...f.stats.filter(s=>!r.stats.some(n=>n.id===s.id)),...r.stats];return r}
const history=f=>buildGameHistory(f.game,f.stats,players);
const total=f=>sumStats(f.stats,[f.game]);
test('Made + assist is independent, bidirectional, idempotent and quarter totals remain correct',()=>{
 const f=fixture(),s=shot();mutate(f,{kind:'saveShot',shot:s,assistPlayerId:'8'});
 const [sh]=history(f).filter(e=>e.type==='shot'),ast=history(f).find(e=>e.statKey==='ast');
 assert.equal(sh.assistEventId,ast.eventId);assert.equal(ast.shotEventId,sh.eventId);assert.equal(sh.playId,ast.playId);
 assert.equal(total(f).ast,1);assert.equal(total(f).threePm,1);assert.equal(total(f).threePa,1);
 mutate(f,{kind:'saveShot',shot:s,assistPlayerId:'8'});assert.equal(total(f).ast,1);assert.equal(total(f).threePm,1);
 mutate(f,{kind:'saveShot',shot:shot('q2','made',2),assistPlayerId:'12'});assert.equal(total(f).ast,2);assert.equal(f.stats.find(s=>s.playerId==='12').quarters.q2.ast,1);
 assert.equal(shotTotals(f.stats.find(s=>s.playerId==='32').quarters.q1.shots).threePm,1);
});
test('none and Miss only create shots; invalid assistant is rejected without mutating input',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot()});mutate(f,{kind:'saveShot',shot:shot('miss','missed')});assert.equal(total(f).ast,0);assert.equal(total(f).threePa,2);assert.equal(total(f).threePm,1);
 const before=JSON.stringify(f);assert.throws(()=>mutate(f,{kind:'saveShot',shot:shot('self'),assistPlayerId:'32'}));assert.equal(JSON.stringify(f),before);
 assert.throws(()=>mutate(f,{kind:'saveShot',shot:shot('bench'),assistPlayerId:'12'}));
});
test('starters, OUT/IN, multiple substitutions, re-entry, Q change and untimed snapshots',()=>{
 const f=fixture(),s={...shot(),remainingSeconds:400};
 const ids=s=>assistCandidates(f.game,1,s,players,f.stats).map(p=>p.id);
 assert.deepEqual(ids(s),['4','7','8','21']);
 f.game.quarterParticipation.q1.substitutions=[{id:'sub1',playerOutId:'8',playerInId:'12',remainingSeconds:300,sequence:80},{id:'sub2',playerOutId:'12',playerInId:'8',remainingSeconds:100,sequence:150}];
 assert.deepEqual(ids({...s,remainingSeconds:200}),['4','7','21','12']);assert.deepEqual(ids({...s,remainingSeconds:50}),['4','7','21','8']);
 assert.deepEqual(ids({...s,remainingSeconds:'',createdAt:100}),['4','7','21','12']);
 assert.deepEqual(ids({...s,remainingSeconds:'',onCourtPlayerIds:['4','7','8','21','32']}),['4','7','8','21']);
 assert.deepEqual(assistCandidates(f.game,2,s,players).map(p=>p.id),['4','7','12','21']);
});
test('old games fall back to registered game players, never require migration',()=>{
 const f=fixture();delete f.game.quarterParticipation;f.stats=[{id:'g_8',gameId:'g',playerId:'8',quarters:{q1:{ast:2,registered:true}}},{id:'g_32',gameId:'g',playerId:'32',quarters:{q1:{threePa:1,threePm:1,registered:true}}}];
 assert.deepEqual(assistCandidates(f.game,1,shot(),players,f.stats).map(p=>p.id),['8']);
 const old=history(f);assert.equal(total(f).ast,2);assert.equal(total(f).threePm,1);
 const ast=old.find(e=>e.statKey==='ast'),made=old.find(e=>e.statKey==='threePm');mutate(f,{kind:'link',shotEventId:made.eventId,assistEventId:ast.eventId});
 assert.equal(total(f).ast,2);assert.equal(total(f).threePm,1);assert.equal(history(f).find(e=>e.eventId===ast.eventId).shotEventId,made.eventId);
 assert.deepEqual(history(f).filter(e=>e.statKey==='ast').map(e=>e.eventId).sort(),old.filter(e=>e.statKey==='ast').map(e=>e.eventId).sort());
});
test('existing AST links both directions, change, unlink and relink never double count',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot(),assistPlayerId:'8'});const first=history(f).find(e=>e.type==='shot'),ast=history(f).find(e=>e.statKey==='ast');
 mutate(f,{kind:'unlink',eventId:first.eventId});assert.equal(total(f).ast,1);assert.equal(history(f).find(e=>e.statKey==='ast').shotEventId,null);
 mutate(f,{kind:'link',shotEventId:first.eventId,assistEventId:ast.eventId});assert.equal(total(f).ast,1);
 mutate(f,{kind:'link',shotEventId:first.eventId,assistPlayerId:'7'});assert.equal(total(f).ast,1);assert.equal(f.stats.find(s=>s.playerId==='8').quarters.q1.ast,0);assert.equal(f.stats.find(s=>s.playerId==='7').quarters.q1.ast,1);
 mutate(f,{kind:'saveShot',shot:shot('s2')});const second=history(f).find(e=>e.sourceId==='s2');mutate(f,{kind:'link',shotEventId:second.eventId,assistEventId:ast.eventId});
 assert.equal(history(f).find(e=>e.eventId===first.eventId).assistEventId,null);assert.equal(total(f).ast,1);
 mutate(f,{kind:'unlink',eventId:ast.eventId});assert.equal(total(f).ast,1);assert.equal(history(f).find(e=>e.eventId===second.eventId).assistEventId,null);
});
test('history adds new AST only when no matching unlinked AST exists',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot()});const sh=history(f)[0];mutate(f,{kind:'link',shotEventId:sh.eventId,assistPlayerId:'8'});assert.equal(total(f).ast,1);
 mutate(f,{kind:'unlink',eventId:sh.eventId});assert.throws(()=>mutate(f,{kind:'link',shotEventId:sh.eventId,assistPlayerId:'8'}),/既存AST/);assert.equal(total(f).ast,1);
 // A new live play must still add its own AST even if another independent AST exists.
 mutate(f,{kind:'saveShot',shot:shot('new'),assistPlayerId:'8'});assert.equal(total(f).ast,2);
});
test('reordering/insertion preserve IDs; nearest same-Q Made candidates exclude shooter and Miss',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot(),assistPlayerId:'8'});const ast=history(f).find(e=>e.statKey==='ast'),id=ast.shotEventId;
 mutate(f,{kind:'saveShot',shot:shot('other')});mutate(f,{kind:'saveShot',shot:shot('miss','missed')});mutate(f,{kind:'saveShot',shot:shot('q2','made',2)});
 f.game.eventSequenceOverrides=historyInsertionOverrides(history(f),[ast.eventId],null);
 assert.equal(history(f).find(e=>e.eventId===ast.eventId).shotEventId,id);
 assert.equal(nearbyMadeShots(history(f),ast).length,2);
 mutate(f,{kind:'saveShot',shot:shot('later')});assert.equal(history(f).find(e=>e.eventId===ast.eventId).shotEventId,id);
});
test('Made edit preserves links; Miss conversion and deletion unlink without deleting AST',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot(),assistPlayerId:'8'});const id=history(f).find(e=>e.type==='shot').eventId;
 mutate(f,{kind:'saveShot',shot:shot(),edit:true});assert.ok(history(f).find(e=>e.type==='shot').assistEventId);
 mutate(f,{kind:'saveShot',shot:shot('s','missed'),edit:true});assert.equal(history(f).find(e=>e.statKey==='ast').shotEventId,null);assert.equal(total(f).ast,1);assert.equal(total(f).threePm,0);
 mutate(f,{kind:'delete',eventId:id});assert.equal(total(f).threePa,0);assert.equal(total(f).ast,1);
 const ast=history(f).find(e=>e.statKey==='ast');mutate(f,{kind:'delete',eventId:ast.eventId});assert.equal(total(f).ast,0);
});
test('normal stat counter reduction unlinks the removed AST atomically',()=>{
 const f=fixture();mutate(f,{kind:'saveShot',shot:shot(),assistPlayerId:'8'});
 mutate(f,{kind:'reconcileStats',playerId:'8',quarter:1,values:{ast:0}});
 assert.equal(total(f).ast,0);assert.equal(total(f).threePm,1);assert.equal(history(f).find(e=>e.type==='shot').assistEventId,null);
});
test('first assist in a legacy game without participation or prior stats is usable',()=>{
 const f=fixture();delete f.game.quarterParticipation;mutate(f,{kind:'saveShot',shot:shot(),assistPlayerId:'8'});assert.equal(total(f).ast,1);
});
