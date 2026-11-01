import test from 'node:test';
import assert from 'node:assert/strict';
import { registeredTournamentNames, officialGameSelection, officialGameStatus, selectedTournamentName } from '../js/calculations/game-registration-calculations.js';

test('registered tournaments combine game names, tournament records, and editing value', () => {
  const names = registeredTournamentNames(
    [{ tournament: 'CBG兵庫県予選' }, { tournament: ' CBG兵庫県予選 ' }, { tournament: '練習試合' }],
    [{ name: 'JWC兵庫県予選' }, { tournamentName: 'CBG兵庫県予選' }],
    '過去の大会'
  );
  assert.equal(names.filter(name => name === 'CBG兵庫県予選').length, 1);
  assert.deepEqual(new Set(names), new Set(['CBG兵庫県予選', '練習試合', 'JWC兵庫県予選', '過去の大会']));
});

test('new or existing tournament is saved as a trimmed name', () => {
  assert.equal(selectedTournamentName(' JWC兵庫県予選 ', '未使用'), 'JWC兵庫県予選');
  assert.equal(selectedTournamentName('', ' 新規大会 '), '新規大会');
  assert.equal(selectedTournamentName('', ''), '');
});

test('official game selection preserves unset legacy games', () => {
  assert.equal(officialGameSelection({}), '');
  assert.equal(officialGameSelection({ isOfficialGame: true }), 'official');
  assert.equal(officialGameSelection({ isOfficialGame: false }), 'unofficial');
  assert.equal(officialGameStatus('official'), true);
  assert.equal(officialGameStatus('unofficial'), false);
  assert.equal(officialGameStatus(''), null);
});
