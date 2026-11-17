import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStandaloneTournament, findDuplicateStandaloneTournament, normalizeStandaloneTournamentName } from '../js/calculations/tournament-registration-calculations.js';
import { registeredTournamentNames } from '../js/calculations/game-registration-calculations.js';

test('manual tournament registration builds master data without game fields', () => {
  const record = buildStandaloneTournament({
    name: '  CBG 兵庫県予選  ',
    year: '2026',
    seasonId: 'season_2026_27',
    seasonName: '2026-27',
    category: 'U15男子',
    prefecture: '兵庫県',
    tournamentLevel: 'prefecture'
  });
  assert.equal(record.name, 'CBG 兵庫県予選');
  assert.equal(record.year, 2026);
  assert.equal(record.seasonId, 'season_2026_27');
  assert.equal(record.sourceType, 'manual');
  assert.equal(record.tournamentLevel, 'prefecture');
  assert.equal('gameId' in record, false);
  assert.equal('opponent' in record, false);
  assert.deepEqual(registeredTournamentNames([], [record]), [record.name]);
});

test('duplicate checks normalize Japanese and ASCII text and retain year distinction', () => {
  const rows = [{ id: 't1', name: 'ＣＢＧ　兵庫県予選', year: 2026 }];
  assert.equal(normalizeStandaloneTournamentName(' CBG 兵庫県予選  '), 'cbg 兵庫県予選');
  assert.equal(findDuplicateStandaloneTournament(rows, 'CBG 兵庫県予選', '2026')?.id, 't1');
  assert.equal(findDuplicateStandaloneTournament(rows, 'CBG 兵庫県予選', 2025), null);
  assert.equal(findDuplicateStandaloneTournament(rows, '別の大会', 2026), null);
});

test('required fields and registration targets are validated before save', () => {
  const base = { name: '兵庫県大会', year: 2026, seasonId: 'season_2026_27', seasonName: '2026-27' };
  assert.throws(() => buildStandaloneTournament({ ...base, name: '　' }), /大会名/);
  assert.throws(() => buildStandaloneTournament({ ...base, year: '' }), /開催年度/);
  assert.throws(() => buildStandaloneTournament({ ...base, year: '2026.5' }), /開催年度/);
  assert.throws(() => buildStandaloneTournament({ ...base, seasonId: 'all' }), /世代/);
  assert.throws(() => buildStandaloneTournament({ ...base, tournamentLevel: 'unknown' }), /大会区分/);
});

test('app offers a separate tournament action without creating game records', async () => {
  const fs = await import('node:fs/promises');
  const app = await fs.readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /id="addTournamentMobile"/);
  assert.match(app, /tournamentButton\.onclick=openStandaloneTournamentForm/);
  assert.match(app, /setDoc\(doc\(db, 'tournaments', id\)/);
  assert.match(app, /gameTournamentRecordsPromise = null/);
});
