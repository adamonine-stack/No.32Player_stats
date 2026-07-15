export function num(x) {
  return Math.max(0, Number(x || 0));
}

export function pct(made, attempted) {
  return num(attempted) ? `${(num(made) / num(attempted) * 100).toFixed(1)}%` : "0.0%";
}

export function one(value, games) {
  return games ? (num(value) / games).toFixed(1) : "0.0";
}

export const STAT_KEYS = [
  "twoPa",
  "twoPm",
  "threePa",
  "threePm",
  "fta",
  "ftm",
  "ast",
  "blk",
  "passCut",
  "dribbleCut",
  "stealOther",
  "or",
  "dr",
  "passMiss",
  "dribbleMiss",
  "catchMiss",
  "violation",
  "otherTo"
];

function blankStats() {
  return {
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
}

function addStatValues(result, source = {}) {
  for (const key of STAT_KEYS) result[key] += num(source[key]);
}

export function getStatRegistrationType(stat = {}) {
  return stat.registrationType === "quarter" ? "quarter" : "game";
}

export function quarterKey(q) {
  return `q${num(q) || 1}`;
}

export function registeredQuarterNumbers(stat = {}) {
  if (getStatRegistrationType(stat) !== "quarter") return [];
  const quarters = stat.quarters || {};
  return Object.keys(quarters)
    .map(key => ({ key, value: quarters[key], q: num(String(key).replace(/\D/g, "")) }))
    .filter(item => item.q > 0 && item.value && typeof item.value === "object" && item.value.registered !== false)
    .sort((a, b) => a.q - b.q)
    .map(item => item.q);
}

export function statHasRegisteredData(stat = {}) {
  if (getStatRegistrationType(stat) === "quarter") return registeredQuarterNumbers(stat).length > 0;
  return Boolean(stat.id) || STAT_KEYS.some(key => stat[key] !== undefined);
}

export function sumStats(items, games = []) {
  const result = blankStats();
  for (const stat of items) {
    if (!statHasRegisteredData(stat)) continue;
    const game = games.find(item => item.id === stat.gameId);
    if (getStatRegistrationType(stat) === "quarter") {
      const qNumbers = registeredQuarterNumbers(stat);
      result.q += qNumbers.length;
      for (const q of qNumbers) addStatValues(result, stat.quarters?.[quarterKey(q)]);
    } else {
      result.q += num(game?.quarters || stat.quarters || 0);
      addStatValues(result, stat);
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
