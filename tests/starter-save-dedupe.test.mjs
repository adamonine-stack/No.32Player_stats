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
  assert.ok(sync.includes("compactNoopSessionOperations(currentUser.uid)"));
});
