import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createStatsBaseline,assertStatsBaseline,LOAD_ERROR,CONFLICT_ERROR,withStatsLoadTimeout} from '../js/core/normal-stats-guard.js';
import {planAssistMutation} from '../js/calculations/assist-play-calculations.js';
import {buildGameHistory,historyInsertionOverrides} from '../js/calculations/game-event-calculations.js';
const code=fs.readFileSync(new URL('../js/core/assist-play-store.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function','async function');
const game={id:'g',statsRegistrationType:'quarter',quarters:4,playEvents:[]},players=[{id:'p'}];
const stat={id:'g_p',gameId:'g',playerId:'p',quarters:Object.fromEntries([1,2,3,4].map(q=>['q'+q,{registered:true,quarter:q,dr:3,shots:[{id:'s'+q,result:'made',assistPlayerId:'a',playId:'play'+q}]}]))};
function harness(g=game,s=stat){const docs=new Map([['games/g',structuredClone(g)],...(s?[['stats/g_p',structuredClone(s)]]:[])]);let writes=0,retry;
 const context=vm.createContext({crypto,assertStatsBaseline,planAssistMutation,buildGameHistory,historyInsertionOverrides,db:{},doc:(_,c,id)=>`${c}/${id}`,serverTimestamp:()=>123,runTransaction:async(_,fn)=>{
 const run=async()=>{const staged=[];const result=await fn({get:async ref=>({id:ref.split('/')[1],exists:()=>docs.has(ref),data:()=>structuredClone(docs.get(ref))}),set:(ref,data)=>staged.push([ref,data])});return {result,staged}};
 let result=await run();if(retry){retry();retry=null;result=await run()}for(const [ref,data] of result.staged){writes++;docs.set(ref,{...docs.get(ref),...structuredClone(data)})}return result.result;
 }});vm.runInContext(code,context);
 const baseline=createStatsBaseline(g,s,'p',g.statsRegistrationType==='quarter'?1:null);
 return {docs,baseline,writes:()=>writes,retry:fn=>retry=fn,save:(values={dr:0},base=baseline)=>context.commitAssistMutation(g,s?[s]:[],players,{kind:'reconcileStats',playerId:'p',quarter:base?.quarter??(g.statsRegistrationType==='quarter'?1:null),baseline:base,values,now:100})};}
test('③④ loaded Q edit and intentional zero preserve other Qs and shots',async()=>{for(const dr of [2,0]){const h=harness();await h.save({dr});const saved=h.docs.get('stats/g_p');assert.equal(saved.quarters.q1.dr,dr);assert.deepEqual(saved.quarters.q1.shots,stat.quarters.q1.shots);for(const q of [2,3,4])assert.deepEqual(saved.quarters['q'+q],stat.quarters['q'+q]);}});
test('⑤⑥ missing load baseline never writes initial zero',async()=>{const h=harness();await assert.rejects(h.save({dr:0},null),{message:LOAD_ERROR});assert.equal(h.writes(),0);assert.deepEqual(h.docs.get('stats/g_p'),stat)});
test('⑦ concurrent stat change rejects stale absolute save',async()=>{const h=harness();h.docs.get('stats/g_p').quarters.q1.dr=4;await assert.rejects(h.save({dr:3}),{message:CONFLICT_ERROR});assert.equal(h.writes(),0);assert.equal(h.docs.get('stats/g_p').quarters.q1.dr,4)});
test('transaction retry rechecks baseline before all writes',async()=>{const h=harness();h.retry(()=>h.docs.get('stats/g_p').quarters.q1.dr=4);await assert.rejects(h.save(),{message:CONFLICT_ERROR});assert.equal(h.writes(),0)});
test('⑧ truly absent Q or document can be registered',async()=>{for(const s of [null,{...stat,quarters:{q2:stat.quarters.q2}}]){const h=harness(game,s);await h.save({registered:true,quarter:1,dr:1});assert.equal(h.docs.get('stats/g_p').quarters.q1.dr,1)}});
test('new data after missing-document baseline conflicts',async()=>{const h=harness(game,null);h.docs.set('stats/g_p',structuredClone(stat));await assert.rejects(h.save(),{message:CONFLICT_ERROR});assert.equal(h.writes(),0)});
test('⑩ game mode supports edit and intentional zero',async()=>{const g={...game,statsRegistrationType:'game'},s={id:'g_p',gameId:'g',playerId:'p',quarters:4,dr:3};const h=harness(g,s);await h.save();assert.equal(h.docs.get('stats/g_p').dr,0)});
test('timestamp-only change is accepted; equal timestamp does not hide changes',async()=>{const h=harness();h.docs.get('stats/g_p').updatedAt=999;await h.save();const h2=harness();h2.docs.get('stats/g_p').quarters.q1.shots[0].result='missed';await assert.rejects(h2.save(),{message:CONFLICT_ERROR})});
test('history/association change and registration-mode changes conflict',async()=>{for(const mutate of [h=>h.docs.get('games/g').playEvents.push({id:'other'}),h=>h.docs.get('games/g').statsRegistrationType='game',h=>h.docs.get('stats/g_p').quarters.q1.shots[0].assistPlayerId='b']){const h=harness();mutate(h);await assert.rejects(h.save(),{message:CONFLICT_ERROR});assert.equal(h.writes(),0)}});
test('⑨ load timeout cannot resolve late as successful load',async()=>{await assert.rejects(withStatsLoadTimeout(()=>new Promise(resolve=>setTimeout(resolve,20)),1),{message:LOAD_ERROR})});
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
test('①②⑬⑭ actual participation save writes games participation only, all Q data unchanged',async()=>{
 const h=harness(),before=structuredClone([...h.docs]);const source=app.slice(app.indexOf('async function saveParticipationGame('),app.indexOf('\nwindow.openParticipationForm'));
 const writes=[];const c=vm.createContext({Object,db:{},doc:(_,collection,id)=>({collection,id}),serverTimestamp:()=>123,submitOfflineCapable:async(type,payload,save)=>{assert.equal(type,'gamePatch');return save()},setDoc:async(ref,data)=>{writes.push({ref,data});assert.equal(ref.collection,'games');assert.equal('playEvents' in data,false);Object.assign(h.docs.get('games/g'),structuredClone(data))}});vm.runInContext(source,c);
 for(const q of [1,2,3,4]){const g=h.docs.get('games/g');await c.saveParticipationGame(g,{quarterParticipation:{...g.quarterParticipation,['q'+q]:{starters:['p','a','b','c','d'],substitutions:[]}}});await c.saveParticipationGame(g,{quarterParticipation:{...g.quarterParticipation,['q'+q]:{...g.quarterParticipation['q'+q],substitutions:[{id:'sub'+q,playerOutId:'p',playerInId:'e',remainingSeconds:300}]}}})}
 assert.equal(writes.length,8);assert.deepEqual(h.docs.get('stats/g_p'),before[1][1]);assert.deepEqual(h.docs.get('games/g').playEvents,before[0][1].playEvents);
});
const loadCode=fs.readFileSync(new URL('../js/core/normal-stats-store.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export async function','async function');
function loader({offline=false,pending=false,fromCache=false,hasPendingWrites=false,fail=false,missing=false}={}){
 const metadata={fromCache,hasPendingWrites},snap={id:'g_p',data:()=>stat,metadata};
 const c=vm.createContext({navigator:{onLine:!offline},db:{},doc:()=>({}),collection:()=>({}),query:()=>({}),where:()=>({}),listOfflineOperations:async()=>pending?[{payload:{gameId:'g'}}]:[],createStatsBaseline,LOAD_ERROR,withStatsLoadTimeout,getDocFromServer:async()=>({exists:()=>true,data:()=>game,metadata}),getDocsFromServer:async()=>{if(fail)throw Error('read failed');return {metadata,docs:missing?[]:[snap]}}});vm.runInContext(loadCode,c);return ()=>c.loadNormalStats('g','p',1);
}
test('server-confirmed absence differs from read failure',async()=>{const result=await loader({missing:true})();assert.equal(result.stat,null);assert.equal(result.baseline.statFingerprint,'null');await assert.rejects(loader({fail:true})())});
test('offline, queue, cache and pending writes all fail closed',async()=>{for(const options of [{offline:true},{pending:true},{fromCache:true},{hasPendingWrites:true}])await assert.rejects(loader(options)(),{message:LOAD_ERROR})});
test('normal absolute save bypasses offline queue before optimistic mutation',()=>{const start=app.indexOf('async function saveAssistPlay('),end=app.indexOf('\nfunction assistPlayerLabel',start),body=app.slice(start,end),guard=body.slice(0,body.indexOf('  game=state.games'));assert.match(guard,/assertNormalStatsOnline/);assert.match(guard,/commitAssistMutation/);assert.doesNotMatch(guard,/submitOfflineCapable|planAssistMutation/);assert.match(body.slice(guard.length),/submitOfflineCapable\('assist'/)});
