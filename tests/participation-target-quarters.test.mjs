import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { getPlayerTargetQuarterCount, targetQuarterNumbers } from '../js/calculations/player-quarter-calculations.js';
import { sumStats } from '../js/calculations/stats-calculations.js';

const lineup = () => ({ starters: ['a', 'b', 'c', 'd', 'e'], substitutions: [] });
const game = { id: 'g1', quarters: 4, statsRegistrationType: 'quarter', quarterParticipation: {
  q1: lineup(), q2: lineup(), q4: { ...lineup(), substitutions: [{ id: 'sub', playerOutId: 'a', playerInId: 'f', remainingSeconds: 0 }] }
} };
const stats = [{ gameId: 'g1', playerId: 'a', quarters: { q1: { registered: true, ast: 1 }, q3: { registered: true, ast: 1 } } }];

test('target Qs combine stats and positive playing time once per game and Q', () => {
  assert.equal(getPlayerTargetQuarterCount('a', [game], stats), 4);
  assert.equal(getPlayerTargetQuarterCount('b', [game], stats), 3);
  assert.deepEqual(targetQuarterNumbers(game, stats), [1, 2, 3, 4]);
  assert.deepEqual(targetQuarterNumbers(game, []), [1, 2, 4]);
});

test('selected Q includes participation-only players and excludes other Qs and zero seconds', () => {
  assert.equal(getPlayerTargetQuarterCount('b', [game], stats, 'q2'), 1);
  assert.equal(getPlayerTargetQuarterCount('b', [game], stats, 'q3'), 0);
  assert.equal(getPlayerTargetQuarterCount('f', [game], stats), 0);
  assert.equal(getPlayerTargetQuarterCount('unknown', [game], stats), 0);
});

test('invalid lineups do not create appearances; stats-only and legacy games still count', () => {
  const invalid = { ...game, quarterParticipation: { q1: { starters: ['a'], substitutions: [] } } };
  assert.equal(getPlayerTargetQuarterCount('a', [invalid], []), 0);
  assert.equal(getPlayerTargetQuarterCount('a', [invalid], stats), 2);
  const legacy = { id: 'g2', quarters: 2, statsRegistrationType: 'game' };
  assert.equal(getPlayerTargetQuarterCount('a', [legacy], [{ gameId: 'g2', playerId: 'a', ast: 0 }]), 2);
});

test('team detail lists a player with only playing time in the selected Q', () => {
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const context = vm.createContext({ state: { players: [{ id: 'b', number: 2, name: 'B' }], teamMode: 'game' },
    teamStatsForGames: () => [], sumStats, getPlayerTargetQuarterCount,
    detailStatsView: () => 'q2', teamDetailPlayerPlayingTime: () => '08:00' });
  vm.runInContext(source.split('\n').find(line => line.startsWith('function teamDetailRows(')), context);
  context.games = [game];
  const rows = vm.runInContext("teamDetailRows(games, {kind:'value',value:s=>s.ast})", context);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].q, 1);
  assert.equal(rows[0].key, 0);
});
