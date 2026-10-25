import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /AUDIT_CONSISTENCY_MIGRATION_VERSION/);
assert.match(app, /normalizeTournamentPlacementRanks\(opponentPlacements\(team\)\)/);
assert.match(app, /async function ensureAuditConsistencyMigration\(\)/);
assert.match(app, /if\(u\)ensureAuditConsistencyMigration\(\)\.catch/);
assert.match(app, /mergeFields:\['quarters','auditConsistencyMigrationVersion','updatedAt'\]/);
assert.match(app, /async function rebuildConsistencySummaries\(games,stats\)/);
assert.match(app, /latestRank=rankForGame\(game,team\)\|\|null/);

console.log('audit consistency app contract: ok');
