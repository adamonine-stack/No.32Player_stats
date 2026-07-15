import { num } from "./stats-calculations.js";

export function resultMark(game) {
  const score = finalScoreFromQuarterScores(game);
  if (score.team > score.opponent) return '<b class="result-win">○</b>';
  if (score.team < score.opponent) return '<b class="result-loss">×</b>';
  return '<b class="result-draw">△</b>';
}

export function resultText(game) {
  const score = finalScoreFromQuarterScores(game);
  if (score.team > score.opponent) return '<span class="result-win">○</span>';
  if (score.team < score.opponent) return '<span class="result-loss">×</span>';
  return '<span class="result-draw">△</span>';
}

export function resultWord(game) {
  const score = finalScoreFromQuarterScores(game);
  if (score.team > score.opponent) return "勝利";
  if (score.team < score.opponent) return "敗戦";
  return "引分";
}

export function resultClass(game) {
  const score = finalScoreFromQuarterScores(game);
  if (score.team > score.opponent) return "result-win";
  if (score.team < score.opponent) return "result-loss";
  return "result-draw";
}

export function gameRecord(games) {
  let w = 0;
  let l = 0;
  let d = 0;
  games.forEach(game => {
    const score = finalScoreFromQuarterScores(game);
    if (score.team > score.opponent) w++;
    else if (score.team < score.opponent) l++;
    else d++;
  });
  const total = w + l + d;
  return { w, l, d, total, rate: total ? ((w / total) * 100).toFixed(1) : "0.0" };
}

export function dateRange(games) {
  const dates = games.map(game => game.date).filter(Boolean).sort();
  return dates.length ? `${dates[0]} ～ ${dates[dates.length - 1]}` : "日付未登録";
}

export function calculateTotalQuarters(games) {
  return games.reduce((total, game) => total + num(game.quarters), 0);
}

export function quarterScoreKey(q) {
  return `q${num(q) || 1}`;
}

export function quarterScoreValue(score = {}) {
  return {
    team: num(score.team),
    opponent: num(score.opponent)
  };
}

export function getQuarterScore(currentQuarterScore = {}, previousQuarterScore = {}) {
  const current = quarterScoreValue(currentQuarterScore);
  const previous = quarterScoreValue(previousQuarterScore);
  return {
    team: Math.max(0, current.team - previous.team),
    opponent: Math.max(0, current.opponent - previous.opponent)
  };
}

export function finalScoreFromQuarterScores(game = {}) {
  const qCount = num(game.quarters || game.quarterCount || 0);
  const scores = game.quarterScores || {};
  for (let q = qCount; q >= 1; q--) {
    const score = scores[quarterScoreKey(q)];
    if (score && (score.team !== undefined || score.opponent !== undefined)) return quarterScoreValue(score);
  }
  return { team: num(game.ownScore), opponent: num(game.oppScore) };
}

export function quarterScoreRows(game = {}) {
  const qCount = num(game.quarters || game.quarterCount || 0);
  const scores = game.quarterScores || {};
  let previous = { team: 0, opponent: 0 };
  const rows = [];
  for (let q = 1; q <= qCount; q++) {
    const current = scores[quarterScoreKey(q)];
    if (!current) {
      rows.push({ q, team: null, opponent: null });
      continue;
    }
    const single = getQuarterScore(current, previous);
    rows.push({ q, ...single });
    previous = quarterScoreValue(current);
  }
  return rows;
}
