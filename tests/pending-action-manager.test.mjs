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
const makeOp=(ctx,id,gameId='pending-manager-game')=>{
  const operation=ctx.createOfflineOperation('gamePatch',{gameId,data:{quarterParticipation:{q1:{starters:['1','2','3','4','5'],substitutions:[]}}}},{id,ownerUid:'manager-user'});
  Object.assign(operation,{gameId,quarter:1,overlay:{documents:[{key:`games/${gameId}`,before:{id:gameId},patch:{kind:'map',fields:{quarterParticipation:{kind:'map',fields:{q1:{kind:'map',fields:{starters:{kind:'value',value:['1','2','3','4','5']}}}}}}}}]}});
  return operation;
};

test('safe pending deletion rewires a dependent operation',async()=>{
  const ctx=open(),gameId='pending-manager-delete-game-'+Date.now();
  const first=makeOp(ctx,'manager-first-'+Date.now(),gameId);
  await ctx.enqueueSessionOperation(first);
  const middle=makeOp(ctx,'manager-middle-'+Date.now(),gameId);
  await ctx.enqueueSessionOperation(middle);
  const last=makeOp(ctx,'manager-last-'+Date.now(),gameId);
  await ctx.enqueueSessionOperation(last);
  assert.equal(middle.predecessorId,first.id);
  assert.equal(last.predecessorId,middle.id);
  await ctx.updateOfflineOperation({...last,syncState:'error',lastError:'前の入力を同期中です。少し待ってから再度確定してください。'});

  const result=await ctx.removeOfflineOperationSafely(middle.id,'manager-user');
  assert.equal(result.removed,true);
  assert.equal(result.rewired,1);
  const rows=await ctx.listOfflineOperations();
  assert.equal(rows.some(row=>row.id===middle.id),false);
  const savedLast=rows.find(row=>row.id===last.id);
  assert.equal(savedLast.predecessorId,first.id);
  assert.equal(savedLast.lastError,'');
});

test('pending manager exposes readable sync error reasons and controls',()=>{
  const sync=fs.readFileSync(new URL('../js/core/offline-sync.js',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  assert.ok(sync.includes("pendingOperationReason"));
  assert.ok(sync.includes("前の入力がまだ同期されていないため、この入力は待機しています。"));
  assert.ok(sync.includes("サーバーへの書き込み権限が拒否されています。"));
  assert.ok(sync.includes("通信エラーのため同期できません。"));
  assert.ok(sync.includes("export async function listPendingOperations()"));
  assert.ok(sync.includes("export async function retryPendingOperation(operationId)"));
  assert.ok(sync.includes("export async function deletePendingOperation(operationId)"));
  assert.ok(app.includes("同期できていない理由"));
  assert.ok(app.includes("data-retry-pending"));
  assert.ok(app.includes("data-delete-pending"));
  assert.ok(app.includes("openPendingOperationManager()"));
  assert.ok(app.includes("タップして未同期内容を確認"));
});
