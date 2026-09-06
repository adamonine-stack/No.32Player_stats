import test from 'node:test';
import assert from 'node:assert/strict';
import { gameListRegistrationStatus } from '../js/calculations/game-list-status-calculations.js';

test('game-level registration displays zero registered Qs', () => {
  const game = { id: 'g1', quarters: 4, statsRegistrationType: 'game' };
  const stats = [{ id: 's1', gameId: 'g1', twoPa: 3 }];
  assert.deepEqual(gameListRegistrationStatus(game, stats), {
    totalQuarters: 4,
    registeredQuarters: 0,
    hasShotPoints: false
  });
});

test('quarter registration counts the union of registered Qs across players', () => {
  const game = { id: 'g1', quarters: 4, statsRegistrationType: 'quarter' };
  const stats = [
    { gameId: 'g1', quarters: { q1: { registered: true }, q2: { registered: true } } },
    { gameId: 'g1', quarters: { q2: { registered: true }, q3: { registered: true }, q4: { registered: false } } }
  ];
  assert.equal(gameListRegistrationStatus(game, stats).registeredQuarters, 3);
});

test('shot point registration is detected for game and quarter shot collections', () => {
  const game = { id: 'g1', quarters: 4, statsRegistrationType: 'quarter' };
  const stats = [{ gameId: 'g1', quarters: { q1: { registered: true, shots: [{ id: 'shot1' }] } } }];
  assert.equal(gameListRegistrationStatus(game, stats).hasShotPoints, true);
});
