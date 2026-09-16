import { OPPONENT_RANKS, isValidTournamentAchievement, placementLabelToRank } from "../calculations/opponent-team-calculations.js";
import { STAT_KEYS } from "../calculations/stats-calculations.js";

export const AUDIT_CONSISTENCY_MIGRATION_VERSION = "2026-09-17-audit-consistency-v1";

function normalizedStoredRank(item = {}) {
  const stored = String(item.placementRank || item.seasonRank || item.rankValue || "").trim();
  if (stored === "B+") return "B";
  return OPPONENT_RANKS.includes(stored) ? stored : null;
}

export function normalizeTournamentPlacementRank(item = {}) {
  const next = { ...item };
  if (!isValidTournamentAchievement(item)) {
    delete next.placementRank;
    delete next.seasonRank;
    delete next.rankValue;
    return next;
  }
  const rank = placementLabelToRank(item.placementLabel || item.placement) || normalizedStoredRank(item);
  if (!rank) return next;
  next.placementRank = rank;
  next.seasonRank = rank;
  next.rankValue = rank;
  return next;
}

export function normalizeTournamentPlacementRanks(placements = []) {
  return placements.map(normalizeTournamentPlacementRank);
}

function hasMeaningfulUnknownValue(value) {
  if (value == null || value === false || value === 0 || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export function quarterRecordHasMeaningfulData(record = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  if (record.registered === true) return true;
  if (Array.isArray(record.shots) && record.shots.length) return true;
  if (STAT_KEYS.some(key => Number(record[key] || 0) !== 0)) return true;
  if (Number(record.shotFouledCount || 0) !== 0) return true;
  const known = new Set(["registered", "quarter", "shots", "shotInputMode", "shotTrackingMode", "shotFouledCount", ...STAT_KEYS]);
  return Object.entries(record).some(([key, value]) => !known.has(key) && hasMeaningfulUnknownValue(value));
}

export function planSafeStatQuarterCleanup(stat = {}, game = {}) {
  const quarters = stat.quarters;
  const numeric = typeof quarters === "number" || (typeof quarters === "string" && quarters.trim() !== "" && Number.isFinite(Number(quarters)));
  if (numeric) {
    return {
      changed: false,
      legacyNumeric: true,
      quarters,
      removedNullQuarterKeys: 0,
      removedEmptyOutOfRangeQuarterKeys: 0,
      protectedOutOfRangeQuarterKeys: 0
    };
  }
  if (!quarters || typeof quarters !== "object" || Array.isArray(quarters)) {
    return {
      changed: false,
      legacyNumeric: false,
      quarters,
      removedNullQuarterKeys: 0,
      removedEmptyOutOfRangeQuarterKeys: 0,
      protectedOutOfRangeQuarterKeys: 0
    };
  }
  const totalQuarters = Math.max(0, Number(game.quarters || game.quarterCount || 0));
  const cleaned = {};
  let changed = false;
  let removedNullQuarterKeys = 0;
  let removedEmptyOutOfRangeQuarterKeys = 0;
  let protectedOutOfRangeQuarterKeys = 0;
  for (const [key, value] of Object.entries(quarters)) {
    const match = /^q(\d+)$/.exec(key);
    const quarter = match ? Number(match[1]) : 0;
    if (value == null) {
      changed = true;
      removedNullQuarterKeys++;
      continue;
    }
    if (totalQuarters > 0 && quarter > totalQuarters) {
      if (!quarterRecordHasMeaningfulData(value)) {
        changed = true;
        removedEmptyOutOfRangeQuarterKeys++;
        continue;
      }
      protectedOutOfRangeQuarterKeys++;
    }
    cleaned[key] = value;
  }
  return {
    changed,
    legacyNumeric: false,
    quarters: cleaned,
    removedNullQuarterKeys,
    removedEmptyOutOfRangeQuarterKeys,
    protectedOutOfRangeQuarterKeys
  };
}
