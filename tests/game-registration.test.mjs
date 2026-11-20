import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_TYPES, registeredTournamentNames, officialGameSelection, officialGameStatus, gameTypeFields, exchangeMatchTournamentBackfill, selectedTournamentName } from '../js/calculations/game-registration-calculations.js';

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

test('three game classifications are stored with the corresponding official flag', () => {
  assert.deepEqual(GAME_TYPES, ['official', 'exchange_tournament', 'exchange_match']);
  for (const [type, isOfficial] of [['official', true], ['exchange_tournament', false], ['exchange_match', false]]) {
    const fields = gameTypeFields(type);
    assert.deepEqual(fields, { gameType: type, isOfficialGame: isOfficial });
    assert.equal(officialGameSelection(fields), type);
    assert.equal(officialGameStatus(type), isOfficial);
  }
});

test('old non-official and unset games are not silently assigned to an exchange category', () => {
  assert.equal(officialGameSelection({ isOfficialGame: false }), 'unofficial');
  assert.equal(officialGameSelection({}), '');
  assert.deepEqual(gameTypeFields('unofficial'), {});
  assert.deepEqual(gameTypeFields(''), {});
  assert.deepEqual(gameTypeFields('unexpected'), {});
  assert.equal(officialGameSelection({ gameType: 'exchange_tournament', isOfficialGame: false }), 'exchange_tournament');
  assert.equal(officialGameSelection({ gameType: 'exchange_match', isOfficialGame: false }), 'exchange_match');
});

test('exchange-match backfill updates only games with the exact tournament name', () => {
  assert.deepEqual(exchangeMatchTournamentBackfill({ tournament: '交流戦' }), { gameType: 'exchange_match', isOfficialGame: false });
  assert.deepEqual(exchangeMatchTournamentBackfill({ tournament: ' 交流戦 ', isOfficialGame: true }), { gameType: 'exchange_match', isOfficialGame: false });
  assert.deepEqual(exchangeMatchTournamentBackfill({ tournament: '交流戦', isOfficialGame: false }), { gameType: 'exchange_match', isOfficialGame: false });
  assert.equal(exchangeMatchTournamentBackfill({ tournament: '交流戦', gameType: 'exchange_match', isOfficialGame: false }), null);
  for (const name of ['交流大会', '交流戦大会', '交流戦 2026', '公式戦', '', null]) {
    assert.equal(exchangeMatchTournamentBackfill({ tournament: name, gameType: 'official' }), null);
  }
});
