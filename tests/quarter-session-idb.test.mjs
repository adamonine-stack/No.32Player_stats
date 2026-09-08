import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {stampSessionOverlay} from '../js/core/quarter-session-model.js';
const code=fs.readFileSync(new URL('../js/core/offline-operation-queue.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');
const open=()=>{const ctx=vm.createContext({indexedDB,crypto:webcrypto,stampSessionOverlay,setTimeout,clearTimeout,structuredClone});vm.runInContext(code,ctx);return ctx};
test('real IndexedDB transactions retain 20 immutable operations across module restart, clock rollback and two tabs',async()=>{
 const a=open(),b=open(),ops=[];
 for(let i=0;i<20;i++){
  const ctx=i%2?a:b;
  const op=ctx.createOfflineOperation('quickStat',{statKey:'dr'},{ownerUid:'u'});
  Object.assign(op,{gameId:'idb-game',quarter:1,overlay:{documents:[]}});
  await ctx.enqueueSessionOperation(op);ops.push(op);
 }
 const restored=await open().listOfflineOperations();
 assert.equal(restored.length,20);assert.equal(new Set(restored.map(o=>o.operationId)).size,20);
 assert.equal(new Set(restored.map(o=>o.deviceId)).size,1);
 assert.deepEqual(Array.from(restored,o=>o.localSequence),Array.from({length:20},(_,i)=>i+1));
 assert.equal(restored[19].predecessorId,restored[18].operationId);
 assert.ok(restored.every(o=>o.syncState==='draft'));
 await Promise.all([a.markQuarterReady('idb-game',1,'u'),b.markQuarterReady('idb-game',1,'u')]);
 const ready=await b.listOfflineOperations();assert.ok(ready.every(o=>o.syncState==='ready'));
 await a.updateOfflineOperation({...ready[0],committed:true,syncState:'synced'});
 await b.markQuarterReady('idb-game',1,'u');assert.equal((await a.listOfflineOperations())[0].syncState,'synced');
 // A later module instance must use persisted logical time, not a reset clock.
 const c=open();vm.runInContext('Date.now=()=>1',c);
 const later=c.createOfflineOperation('quickStat',{}, {ownerUid:'u'});Object.assign(later,{gameId:'idb-game',quarter:1,overlay:{documents:[]}});await c.enqueueSessionOperation(later);
 assert.equal(later.clientCreatedAt,restored[19].clientCreatedAt);assert.equal(later.localSequence,21);
 assert.equal(later.operationId,later.id);
});
