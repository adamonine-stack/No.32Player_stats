import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createOfflineOperation, isRetryableNetworkError, sortOfflineOperations} from '../js/core/offline-operation-queue.js';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const sync = readFileSync(new URL('../js/core/offline-sync.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

test('offline operations preserve input order and immutable identifiers', () => {
  const later = createOfflineOperation('quickStat', {}, {id: 'b', createdAt: 2000});
  const earlier = createOfflineOperation('assist', {}, {id: 'a', createdAt: 1000, ownerUid: 'user-1'});
  assert.deepEqual(sortOfflineOperations([later, earlier]).map(item => item.id), ['a', 'b']);
  assert.equal(earlier.id, 'a');
  assert.equal(earlier.createdAt, 1000);
  assert.equal(earlier.ownerUid, 'user-1');
});

test('only network failures are eligible for offline queuing', () => {
  assert.equal(isRetryableNetworkError({code: 'unavailable'}), true);
  assert.equal(isRetryableNetworkError({code: 'permission-denied'}), false);
});

test('successful synchronization removes payload while failures remain', () => {
  const successBlock = /await execute\(operation\);[\s\S]*?await removeOfflineOperation\(operation\.id\)/;
  assert.match(sync, successBlock);
  assert.match(sync, /catch \(error\)[\s\S]*?updateOfflineOperation/);
  assert.doesNotMatch(sync, /catch \(error\)[\s\S]{0,120}removeOfflineOperation/);
});

test('quick stats, free throws, shots, assists and participation use the offline queue', () => {
  assert.match(app, /submitOfflineCapable\('quickStat'/);
  assert.match(app, /submitOfflineCapable\('freeThrow'/);
  assert.match(app, /submitOfflineCapable\('assist'/);
  assert.match(app, /saveParticipationGame[\s\S]*?submitOfflineCapable\('gamePatch'/);
});

test('service worker caches the app shell and replaces old cache versions', () => {
  assert.match(worker, /APP_SHELL/);
  // SDK requests use the shared gstatic host branch.
  assert.match(worker, /requestUrl\.hostname === 'www\.gstatic\.com'/);
  assert.match(worker, /caches\.delete/);
  assert.match(worker, /event\.request\.mode === 'navigate'/);
});
