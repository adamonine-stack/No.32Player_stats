import { finalScoreFromQuarterScores, quarterScoreRows } from "./game-calculations.js";
import { getGameStatsRegistrationType, quarterKey, registeredQuarterNumbers } from "./stats-calculations.js";

export function teamRegisteredQuarterNumbers(stats = []) {
  return [...new Set(stats.flatMap(registeredQuarterNumbers))].sort((a, b) => a - b);
}

export function teamStatsForView(game = {}, stats = [], selectedView = "game") {
  if (getGameStatsRegistrationType(game) !== "quarter" || selectedView === "game") return stats;
  const quarter = Number(String(selectedView).replace("q", ""));
  const key = quarterKey(quarter);
  return stats
    .filter(stat => registeredQuarterNumbers(stat).includes(quarter))
    .map(stat => ({ ...stat, quarters: { [key]: stat.quarters[key] } }));
}

export function hasTeamDetailRegistration(stats = []) {
  return stats.length > 0;
}

export function teamGamePeriods(game = {}, registrationType = "game", selectedView = "game", registeredQuarters = []) {
  const registered = new Set(registeredQuarters.map(Number));
  const quarterMode = registrationType === "quarter";
  const quarters = quarterScoreRows(game).map(score => ({
    view: `q${score.q}`, label: `${score.q}Q`, team: score.team, opponent: score.opponent,
    selected: selectedView === `q${score.q}`, disabled: !quarterMode, registered: registered.has(score.q)
  }));
  const final = finalScoreFromQuarterScores(game);
  return [...quarters, { view: "game", label: "FINAL", team: final.team, opponent: final.opponent,
    selected: selectedView === "game", disabled: false, registered: true }];
}

export function selectedTeamQuarterStatus(registrationType = "game", selectedView = "game", registeredQuarters = []) {
  if (selectedView === "game") return "final";
  if (registrationType !== "quarter") return "unavailable";
  const quarter = Number(String(selectedView).replace("q", ""));
  return registeredQuarters.map(Number).includes(quarter) ? "registered" : "unregistered";
}
