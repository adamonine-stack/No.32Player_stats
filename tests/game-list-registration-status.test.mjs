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


import { foulRegistrationQuarterCount } from '../js/calculations/game-list-status-calculations.js';

test('foul Q count includes explicit zeros, deduplicates players and excludes incomplete or unregistered Qs', () => {
  const game = { id: 'g1', quarters: 4, statsRegistrationType: 'quarter' };
  const stats = [
    { gameId: 'g1', quarters: { q1: { pf: 0, fouled: 0 }, q2: { pf: 1 }, q3: { pf: 2, fouled: 3 }, q4: { registered: false, pf: 0, fouled: 0 }, q5: { pf: 1, fouled: 1 } } },
    { gameId: 'g1', quarters: { q1: { pf: 2, fouled: 0 }, q2: { pf: 0, fouled: 0 } } },
    { gameId: 'other', quarters: { q4: { pf: 1, fouled: 1 } } }
  ];
  assert.equal(foulRegistrationQuarterCount(game, stats), 3);
  assert.equal(foulRegistrationQuarterCount(game, []), 0);
  assert.equal(foulRegistrationQuarterCount({ ...game, statsRegistrationType: 'game' }, stats), 0);
});

test('action status distinguishes unordered counters, ordered overrides, and actual fouls', async () => {
  const { gameListActionStatus } = await import('../js/calculations/game-list-status-calculations.js');
  const game = {id:'g',statsRegistrationType:'quarter',quarters:4};
  const stats = [{id:'g_p',gameId:'g',playerId:'p',quarters:{q1:{registered:true,ast:1,twoPa:2,pf:0,fouled:0}}}];
  assert.deepEqual(gameListActionStatus(game,stats), {hasUnorderedNonShotStats:true,hasFoulRegistration:false});
  game.eventSequenceOverrides = {'legacy:g_p:1:ast:0':1};
  assert.deepEqual(gameListActionStatus(game,stats), {hasUnorderedNonShotStats:false,hasFoulRegistration:false});
  stats[0].quarters.q1.pf=1;
  assert.equal(gameListActionStatus(game,stats).hasFoulRegistration,true);
  game.playEvents=[{id:'f',playerId:'p',quarter:1,type:'foul',sequence:2}];
  assert.equal(gameListActionStatus(game,stats).hasUnorderedNonShotStats,false);
});
