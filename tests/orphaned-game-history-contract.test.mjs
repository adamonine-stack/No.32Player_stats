import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('authoritative games snapshots and auth restore both prune orphaned local overlays before sync replay', async () => {
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  const localHistory=await readFile(new URL('../js/core/local-history.js',import.meta.url),'utf8');
  assert.match(app,/gamesSnapshotAuthoritative=false/);
  assert.match(app,/gamesSnapshotAuthoritative=false;serverGames=\[\]/);
  assert.match(app,/if\(!s\.metadata\.fromCache\)\{gamesSnapshotAuthoritative=true;await reconcileLoadedAuthoritativeGames\(seasonId\)\}/);
  assert.match(app,/if\(u&&gamesSnapshotAuthoritative\)await reconcileLoadedAuthoritativeGames\(/);
  assert.match(app,/await reconcileLoadedAuthoritativeGames[\s\S]*await initializeOfflineSync\(u\)/);
  assert.match(app,/async function reconcileLoadedAuthoritativeGames\(seasonId\)\{const reconciliation=await reconcileAuthoritativeGames\(serverGames,\{seasonId,allSeasonsId:ALL_SEASONS_ID\}\)/);
  assert.match(app,/if\(reconciliation\.discarded\)pruneStatsToLoadedGames\(\)/);
  assert.match(localHistory,/export async function reconcileAuthoritativeGames\(rows=\[\], \{seasonId='', allSeasonsId='all'\} = \{\}\)/);
  assert.match(localHistory,/journal\.operations\.delete\(id\);[\s\S]*removeOfflineOperation\(id\)/);
});
