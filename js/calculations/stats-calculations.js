export function num(x) {
  return Math.max(0, Number(x || 0));
}

export function pct(made, attempted) {
  return num(attempted) ? `${(num(made) / num(attempted) * 100).toFixed(1)}%` : "0.0%";
}

export function one(value, games) {
  return games ? (num(value) / games).toFixed(1) : "0.0";
}

export function sumStats(items, games = []) {
  const result = {
    q: 0,
    twoPa: 0,
    twoPm: 0,
    threePa: 0,
    threePm: 0,
    fta: 0,
    ftm: 0,
    ast: 0,
    blk: 0,
    passCut: 0,
    dribbleCut: 0,
    stealOther: 0,
    or: 0,
    dr: 0,
    passMiss: 0,
    dribbleMiss: 0,
    catchMiss: 0,
    violation: 0,
    otherTo: 0
  };
  for (const stat of items) {
    const game = games.find(item => item.id === stat.gameId);
    result.q += num(game?.quarters || stat.quarters || 0);
    for (const key in result) {
      if (key !== "q") result[key] += num(stat[key]);
    }
  }
  return result;
}

export function derived(stats) {
  const games = stats.q / 4 || 0;
  const fga = stats.twoPa + stats.threePa;
  const fgm = stats.twoPm + stats.threePm;
  const pts = stats.twoPm * 2 + stats.threePm * 3 + stats.ftm;
  const stl = stats.passCut + stats.dribbleCut + stats.stealOther;
  const reb = stats.or + stats.dr;
  const to = stats.passMiss + stats.dribbleMiss + stats.catchMiss + stats.violation + stats.otherTo;
  return { games, fga, fgm, pts, stl, reb, to };
}
