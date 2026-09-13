import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('game deletion discards local quarter-session operations before deleting Firestore data', async () => {
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  const sync=await readFile(new URL('../js/core/offline-sync.js',import.meta.url),'utf8');
  assert.match(sync,/export async function discardPendingOperationsForGame\(gameId\)/);
  assert.match(app,/await discardPendingOperationsForGame\(gameId\);[\s\S]*getDocs\(query\(collection\(db,'stats'\),where\('gameId','==',gameId\)\)\)[\s\S]*deleteDoc\(doc\(db,'games',gameId\)\)/);
  assert.equal((app.match(/await deleteGameAndRelatedData\(g\)/g)||[]).length,2);
});
