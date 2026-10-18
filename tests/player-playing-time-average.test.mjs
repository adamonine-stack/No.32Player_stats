import assert from 'node:assert/strict';
import test from 'node:test';
import { averagePlayerPlayingTime, playerHasPlayingTime } from '../js/calculations/participation-calculations.js';
import { buildPlayerSeasonSummary } from '../js/calculations/player-season-summary.js';

function game(id, quarters, seconds, minutes = 8) {
  const duration = minutes * 60;
  const quarterParticipation = {};
  for (let q = 1; q <= quarters; q++) {
    const played = Math.min(seconds, duration);
    seconds -= played;
    quarterParticipation[`q${q}`] = {
      starters: ['p', 'b', 'c', 'd', 'e'],
      substitutions: played === duration ? [] : [{ remainingSeconds: duration - played, playerOutId: 'p', playerInId: 'bench' }]
    };
  }
  return { id, seasonId: 's', quarters, quarterDurationMinutes: minutes, quarterParticipation };
}

test('each game is normalized separately before averaging: 12/16 and 16/32 give 20 minutes', () => {
  assert.deepEqual(averagePlayerPlayingTime([game('a', 2, 720), game('b', 4, 960)], 'p'), { registered: true, seconds: 1200, gameCount: 2 });
});
test('different quarter durations use each game duration; zero time and unknown time do not dilute the average', () => {
  assert.deepEqual(averagePlayerPlayingTime([game('a', 1, 480), game('b', 2, 600, 10), game('zero', 4, 0), {}], 'p'), { registered: true, seconds: 1560, gameCount: 2 });
  assert.equal(playerHasPlayingTime(game('zero', 4, 0), 'p'), false);
  assert.equal(playerHasPlayingTime(game('yes', 2, 1), 'p'), true);
});
test('all game quarters are used even when participation is registered for only one quarter', () => {
  const partial = game('partial', 4, 480);
  delete partial.quarterParticipation.q2;
  delete partial.quarterParticipation.q3;
  delete partial.quarterParticipation.q4;
  assert.equal(averagePlayerPlayingTime([partial], 'p').seconds, 480);
});
test('summary counts time-only appearances, deduplicates stats + time, retains stats-only games and respects season', () => {
  const games = [game('a', 2, 720), game('b', 4, 960), game('zero', 4, 0), { ...game('other', 4, 1920), seasonId: 'other' }, { id: 'legacy', seasonId: 's', quarters: 4 }];
  const stats = [{ id: 'b_p', gameId: 'b', playerId: 'p', twoPm: 1 }, { id: 'legacy_p', gameId: 'legacy', playerId: 'p', twoPm: 2 }];
  const summary = buildPlayerSeasonSummary({ seasonId: 's', playerId: 'p', games, stats });
  assert.equal(summary.enteredGameCount, 3);
  assert.equal(summary.stats.twoPm, 3);
  assert.equal(summary.playingTime.seconds, 1200);
  assert.equal(summary.playingTime.gameCount, 2);
  assert.equal(summary.schemaVersion, 2);
});

test('individual game filtering and average label include time-only appearances', async () => {
  const { readFileSync } = await import('node:fs');
  const { runInNewContext } = await import('node:vm');
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const filter = app.match(/^function gamesWithStats\(.*$/m)[0];
  const games = [game('time', 2, 720), game('zero', 4, 0), { id: 'stats' }];
  const context = { state: { games }, statGameIds: () => new Set(['stats']), playerHasPlayingTime };
  runInNewContext(filter, context);
  assert.deepEqual(Array.from(context.gamesWithStats(games, 'p'), g => g.id), ['time', 'stats']);
  const heading = app.match(/^function withPlayingTimeHeading\(.*$/m)[0];
  const { formatClock } = await import('../js/calculations/participation-calculations.js');
  const ui = { visiblePlayingTime: () => ({ registered: true, seconds: 1200, gameCount: 2 }), formatClock };
  runInNewContext(app.match(/^function minText\(.*$/m)[0] + '\n' + heading, ui);
  const html = ui.withPlayingTimeHeading('<div class="section-title">基本スタッツ</div>');
  assert.match(html, /平均出場時間【4Q換算】/);
  assert.match(html, /20:00/);
});
