import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {indexedDB} from 'fake-indexeddb';
import {webcrypto} from 'node:crypto';
import {stampSessionOverlay} from '../js/core/quarter-session-model.js';

const queueCode=fs.readFileSync(new URL('../js/core/offline-operation-queue.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'')
  .replaceAll('export ','');
const open=()=>{
  const ctx=vm.createContext({indexedDB,crypto:webcrypto,stampSessionOverlay,setTimeout,clearTimeout,structuredClone});
  vm.runInContext(queueCode,ctx);
  return ctx;
};
const op=(ctx,id,patch)=> {
  const operation=ctx.createOfflineOperation('gamePatch',{gameId:'starter-game',data:{}},{id,ownerUid:'u'});
  Object.assign(operation,{gameId:'starter-game',quarter:1,overlay:{documents:[{key:'games/starter-game',before:{id:'starter-game'},patch}]}});
  return operation;
};

test('no-op starter retries are removed and predecessor chain is rewired',async()=>{
  const ctx=open();
  const first=op(ctx,'first',{kind:'map',fields:{quarterParticipation:{kind:'map',fields:{q1:{kind:'map',fields:{starters:{kind:'value',value:['1','2','3','4','5']}}}}}}});
  await ctx.enqueueSessionOperation(first);
  const noop=op(ctx,'noop',null);
  await ctx.enqueueSessionOperation(noop);
  const third=op(ctx,'third',{kind:'map',fields:{temporaryPlayers:{kind:'rows',removed:[],rows:[{id:'tmp'}]}}});
  await ctx.enqueueSessionOperation(third);
  assert.equal(third.predecessorId,'noop');

  const result=await ctx.compactNoopSessionOperations('u');
  assert.equal(result.removed,1);
  const rows=await ctx.listOfflineOperations();
  assert.equal(rows.some(row=>row.id==='noop'),false);
  assert.equal(rows.find(row=>row.id==='third').predecessorId,'first');

  const fourth=op(ctx,'fourth',{kind:'map',fields:{temporaryPlayers:{kind:'rows',removed:[],rows:[{id:'tmp2'}]}}});
  await ctx.enqueueSessionOperation(fourth);
  assert.equal(fourth.predecessorId,'third');
});

test('starter save UI locks while saving and offline sync skips empty overlays',()=>{
  const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  const sync=fs.readFileSync(new URL('../js/core/offline-sync.js',import.meta.url),'utf8');
  assert.ok(app.includes("saveStartersButton.disabled=true"));
  assert.ok(app.includes("saveStartersButton.textContent='保存中…'"));
  assert.ok(sync.includes("(options.overlay.documents||[]).every(change=>!change.patch)"));
  assert.ok(sync.includes("compactRedundantSessionOperations(currentUser.uid)"));
  assert.ok(app.includes("latestSyncStatus.pending?bulkSyncPending():synchronizeOfflineOperations()"));
});

test('repeated non-noop participation saves are compacted to one operation',async()=>{
  const ctx=open(),q1={starters:['1','2','3','4','5'],substitutions:[]};
  const make=id=>{
    const operation=ctx.createOfflineOperation('gamePatch',{gameId:'duplicate-game',data:{quarterParticipation:{q1}}},{id,ownerUid:'u'});
    Object.assign(operation,{gameId:'duplicate-game',quarter:1,overlay:{documents:[{key:'games/duplicate-game',before:{id:'duplicate-game'},patch:{kind:'map',fields:{quarterParticipation:{kind:'map',fields:{q1:{kind:'map',fields:{starters:{kind:'value',value:q1.starters}}}}}}}}]}});
    return operation;
  };
  await ctx.enqueueSessionOperation(make('duplicate-first'));
  await ctx.enqueueSessionOperation(make('duplicate-second'));
  const result=await ctx.compactRedundantSessionOperations('u');
  assert.equal(result.duplicateRemoved,1);
  const rows=await ctx.listOfflineOperations();
  assert.equal(rows.some(row=>row.id==='duplicate-first'),true);
  assert.equal(rows.some(row=>row.id==='duplicate-second'),false);
});

test('ownerless legacy draft is adopted when the current user confirms the quarter',async()=>{
  const ctx=open();
  const operation=ctx.createOfflineOperation('gamePatch',{gameId:'legacy-ownerless-game',data:{}},{id:'legacy-ownerless',ownerUid:''});
  Object.assign(operation,{gameId:'legacy-ownerless-game',quarter:1,overlay:{documents:[{key:'games/legacy-ownerless-game',before:{id:'legacy-ownerless-game'},patch:{kind:'map',fields:{quarterParticipation:{kind:'map',fields:{q1:{kind:'map',fields:{starters:{kind:'value',value:['1','2','3','4','5']}}}}}}}}]}});
  await ctx.enqueueSessionOperation(operation);
  await ctx.markQuarterReady('legacy-ownerless-game',1,'current-user');
  const saved=(await ctx.listOfflineOperations()).find(row=>row.id==='legacy-ownerless');
  assert.equal(saved.ownerUid,'current-user');
  assert.equal(saved.syncState,'ready');
  assert.equal(saved.lastError,'');
});
