import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createPlayEvent,reconcileStatEvents} from '../js/calculations/game-event-calculations.js';

const source=fs.readFileSync(new URL('../js/core/quick-history-store.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export async function','async function');
const player={id:'32',number:'32'};
const initialGame={id:'g',statsRegistrationType:'quarter',quarters:4,playEvents:[]};

function harness({offline=false,retry=false}={}){
  const docs=new Map([['games/g',structuredClone(initialGame)]]);let callbackCount=0;
  const run=async fn=>{callbackCount++;const staged=[];const result=await fn({get:async ref=>({id:ref.split('/')[1],exists:()=>docs.has(ref),data:()=>structuredClone(docs.get(ref))}),set:(ref,data)=>staged.push([ref,data])});return {result,staged}};
  const context=vm.createContext({createPlayEvent,reconcileStatEvents,db:{},doc:(_,collection,id)=>`${collection}/${id}`,serverTimestamp:()=>123,runTransaction:async(_,fn)=>{if(offline)throw Error('offline');if(retry)await run(fn);const {result,staged}=await run(fn);for(const [ref,data] of staged)docs.set(ref,{...docs.get(ref),...structuredClone(data)});return result}});
  vm.runInContext(source,context);return {docs,context,callbackCount:()=>callbackCount};
}

test('transaction callback retry keeps one REB ID, sequence and increment',async()=>{
  const h=harness({retry:true}),pending=[{id:'op-reb',statKey:'dr',delta:1,sequence:100,createdAt:10}];await h.context.commitQuickStatMutation({gameId:'g',player,quarter:1,changes:{dr:1},pending,seasonId:'s'});
  assert.equal(h.callbackCount(),2);assert.equal(h.docs.get('games/g').playEvents.length,1);assert.equal(h.docs.get('games/g').playEvents[0].id,'op-reb');assert.equal(h.docs.get('games/g').playEvents[0].sequence,100);assert.equal(h.docs.get('stats/g_32').quarters.q1.dr,1);
});

test('same operation replay after reconnect is idempotent',async()=>{
  const h=harness(),pending=[{id:'op-reb',statKey:'dr',delta:1,sequence:100,createdAt:10}],args={gameId:'g',player,quarter:1,changes:{dr:1},pending,seasonId:'s'};await h.context.commitQuickStatMutation(args);await h.context.commitQuickStatMutation(args);
  assert.equal(h.docs.get('games/g').playEvents.length,1);assert.equal(h.docs.get('stats/g_32').quarters.q1.dr,1);
});

test('offline before or during transaction leaves server documents unchanged',async()=>{
  const h=harness({offline:true}),before=structuredClone([...h.docs]);await assert.rejects(h.context.commitQuickStatMutation({gameId:'g',player,quarter:1,changes:{dr:1},pending:[{id:'op',statKey:'dr',delta:1,sequence:1}],seasonId:'s'}),/offline/);assert.deepEqual([...h.docs],before);
});

test('FT retry and reconnect replay do not double count',async()=>{
  const h=harness({retry:true}),operation={operationId:'op-ft',sequence:101,createdAt:11},args={gameId:'g',player,quarter:1,attempts:2,made:1,remainingSeconds:200,operation,seasonId:'s'};await h.context.commitQuickFreeThrowMutation(args);await h.context.commitQuickFreeThrowMutation(args);
  assert.equal(h.docs.get('games/g').playEvents.filter(item=>item.id==='op-ft').length,1);assert.equal(h.docs.get('stats/g_32').quarters.q1.fta,2);assert.equal(h.docs.get('stats/g_32').quarters.q1.ftm,1);
});

test('two-tab conflict retry preserves both events and both stat changes',async()=>{
  const h=harness(),a={gameId:'g',player,quarter:1,changes:{dr:1},pending:[{id:'tab-a',statKey:'dr',delta:1,sequence:100}],seasonId:'s'},b={gameId:'g',player,quarter:1,changes:{ast:1},pending:[{id:'tab-b',statKey:'ast',delta:1,sequence:100}],seasonId:'s'};await h.context.commitQuickStatMutation(b);await h.context.commitQuickStatMutation(a);
  assert.deepEqual(h.docs.get('games/g').playEvents.map(item=>item.id).sort(),['tab-a','tab-b']);assert.equal(h.docs.get('stats/g_32').quarters.q1.dr,1);assert.equal(h.docs.get('stats/g_32').quarters.q1.ast,1);
});
