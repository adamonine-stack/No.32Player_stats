import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { planAssistMutation } from '../js/calculations/assist-play-calculations.js';
import { buildGameHistory,historyInsertionOverrides } from '../js/calculations/game-event-calculations.js';
import { createShot } from '../js/calculations/shot-calculations.js';
const code=fs.readFileSync(new URL('../js/core/assist-play-store.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function','async function');
const players=[4,7,8,21,32].map(n=>({id:String(n),number:String(n)}));
const game={id:'g',statsRegistrationType:'quarter',quarterParticipation:{q1:{starters:players.map(p=>p.id),substitutions:[]}}};
const shot=createShot({id:'s',gameId:'g',playerId:'32',quarter:1,shotArea:'right_45_3p',shotType:'jump_shot',result:'made',remainingSeconds:''});
function setup({fail=false,retry=false}={}){
 const docs=new Map([['games/g',game]]);let writes=0;
 const context=vm.createContext({crypto,planAssistMutation,buildGameHistory,historyInsertionOverrides,db:{},doc:(_,collection,id)=>`${collection}/${id}`,serverTimestamp:()=>123,
 runTransaction:async(_,fn)=>{
   const run=async()=>{const staged=[];const result=await fn({get:async ref=>({id:ref.split('/')[1],exists:()=>docs.has(ref),data:()=>docs.get(ref)}),set:(ref,data)=>{writes++;staged.push([ref,data])}});return {result,staged}};
   if(retry)await run();const {result,staged}=await run();if(fail)throw Error('simulated commit failure');for(const [ref,data] of staged)docs.set(ref,{...docs.get(ref),...data});return result;
 }});vm.runInContext(code,context);return {docs,save:()=>context.commitAssistMutation(game,[],players,{kind:'saveShot',shot,assistPlayerId:'8'}),writes:()=>writes};
}
test('transaction commit failure leaves both shooter and AST untouched',async()=>{const f=setup({fail:true});await assert.rejects(f.save(),/commit failure/);assert.equal(f.docs.size,1);assert.equal(f.docs.get('games/g').playEvents,undefined)});
test('transaction callback retries and repeated requests never double count',async()=>{const f=setup({retry:true});await f.save();await f.save();assert.equal(f.docs.get('stats/g_8').quarters.q1.ast,1);assert.equal(f.docs.get('stats/g_32').quarters.q1.threePm,1);assert.equal(f.docs.get('games/g').playEvents.length,1)});
