import test from 'node:test';
import assert from 'node:assert/strict';
import { playerForSeason } from '../js/calculations/season-calculations.js';

test('playerForSeason preserves canonical player id while applying season fields', () => {
  const player = { id: 'player-32', name: 'Player 32', number: '32', category: 'U14' };
  const membership = { id: 'player-32_season_2026_27', playerId: 'player-32', seasonId: 'season_2026_27', number: '7', grade: 'U15', active: true };
  const result = playerForSeason(player, membership);
  assert.equal(result.id, 'player-32');
  assert.equal(result.playerId, 'player-32');
  assert.equal(result.number, '7');
  assert.equal(result.category, 'U15');
  assert.equal(result.seasonMembership.id, 'player-32_season_2026_27');
});
