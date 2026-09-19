import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('authoritative games listener prunes orphaned local overlays but cached snapshots do not', async () => {
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  const localHistory=await readFile(new URL('../js/core/local-history.js',import.meta.url),'utf8');
  assert.match(app,/reconcileAuthoritativeGames/);
  assert.match(app,/if\(!s\.metadata\.fromCache\)await reconcileAuthoritativeGames\(serverGames,\{seasonId,allSeasonsId:ALL_SEASONS_ID\}\)/);
  assert.match(localHistory,/export async function reconcileAuthoritativeGames\(rows=\[\], \{seasonId='', allSeasonsId='all'\} = \{\}\)/);
  assert.match(localHistory,/orphanedGameOperationIds\(\[\.\.\.journal\.operations\.values\(\)\],rows\.map\(row=>row\.id\),\{seasonId,allSeasonsId\}\)/);
  assert.match(localHistory,/journal\.operations\.delete\(id\);[\s\S]*removeOfflineOperation\(id\)/);
});
