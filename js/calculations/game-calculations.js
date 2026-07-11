import { num } from "./stats-calculations.js";

export function resultMark(game) {
  if (num(game.ownScore) > num(game.oppScore)) return '<b class="result-win">○</b>';
  if (num(game.ownScore) < num(game.oppScore)) return '<b class="result-loss">×</b>';
  return '<b class="result-draw">△</b>';
}

export function resultText(game) {
  if (num(game.ownScore) > num(game.oppScore)) return '<span class="result-win">○</span>';
  if (num(game.ownScore) < num(game.oppScore)) return '<span class="result-loss">×</span>';
  return '<span class="result-draw">△</span>';
}

export function resultWord(game) {
  if (num(game.ownScore) > num(game.oppScore)) return "勝利";
  if (num(game.ownScore) < num(game.oppScore)) return "敗戦";
  return "引分";
}

export function resultClass(game) {
  if (num(game.ownScore) > num(game.oppScore)) return "result-win";
  if (num(game.ownScore) < num(game.oppScore)) return "result-loss";
  return "result-draw";
}

export function gameRecord(games) {
  let w = 0;
  let l = 0;
  let d = 0;
  games.forEach(game => {
    if (num(game.ownScore) > num(game.oppScore)) w++;
    else if (num(game.ownScore) < num(game.oppScore)) l++;
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
