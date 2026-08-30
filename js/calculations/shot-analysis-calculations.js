import { FIBA_COURT, SHOT_AREAS, SHOT_AREA_ORDER, detectShotArea, countsAsFieldGoalAttempt, normalizeShot, normalizedShotType, shotAreaForRecord } from './shot-calculations.js?v=20260822-foul-stats-v2';

export const SHOT_ANALYSIS_AREA_SHORTCUTS = Object.freeze([
  ['two', '2P'],
  ['three', '3P'],
  ['mid', 'ミドルシュート'],
  ['paint', 'ゴール下＋インサイド'],
  ['left', '左'],
  ['center', '正面'],
  ['right', '右']
]);

export const SHOT_ANALYSIS_DISTANCE_OPTIONS = Object.freeze([
  ['all', '全て'],
  ['paint', 'ゴール下＋インサイド'],
  ['mid', 'ミドル'],
  ['three', '3P'],
  ['mid_three', 'ミドル＋3P']
]);

export const SHOT_ANALYSIS_SIDE_OPTIONS = Object.freeze([
  ['all', '全て'],
  ['left', '左'],
  ['center', '正面'],
  ['right', '右']
]);

const SIDE_BY_AREA = Object.freeze({
  left_zero_mid: 'left',
  left_mid: 'left',
  center_mid: 'center',
  right_mid: 'right',
  right_zero_mid: 'right',
  left_corner_3p: 'left',
  left_45_3p: 'left',
  center_3p: 'center',
  right_45_3p: 'right',
  right_corner_3p: 'right'
});

const DISTANCE_BY_AREA = Object.freeze({
  under_basket: 'under',
  inside: 'inside',
  left_zero_mid: 'mid',
  left_mid: 'mid',
  center_mid: 'mid',
  right_mid: 'mid',
  right_zero_mid: 'mid',
  left_corner_3p: 'three',
  left_45_3p: 'three',
  center_3p: 'three',
  right_45_3p: 'three',
  right_corner_3p: 'three',
  backcourt_3p: 'three'
});

export function shotAnalysisAreaIds(shortcut = '') {
  return SHOT_AREA_ORDER.filter(id => {
    const area = SHOT_AREAS[id];
    if (shortcut === 'two') return area?.value === 2;
    if (shortcut === 'three') return area?.value === 3;
    if (shortcut === 'mid') return DISTANCE_BY_AREA[id] === 'mid';
    if (shortcut === 'paint') return DISTANCE_BY_AREA[id] === 'under' || DISTANCE_BY_AREA[id] === 'inside';
    return SIDE_BY_AREA[id] === shortcut;
  });
}

export function registeredShotTypeIds(shots = []) {
  return [...new Set(shots.map(normalizeShot).map(normalizedShotType).filter(Boolean))];
}

export function filterShotsBySelections(shots = [], { areaIds = [], results = [], typeIds = [] } = {}) {
  const areas = new Set(areaIds), selectedResults = new Set(results), types = new Set(typeIds);
  if (!areas.size || !selectedResults.size || !types.size) return [];
  return shots.map(normalizeShot).filter(shot => areas.has(shotAreaForRecord(shot))
    && types.has(normalizedShotType(shot))
    && (selectedResults.has(shot.result) || (selectedResults.has('fouled') && shot.wasFouled === true)));
}

export function insideAnalysisSide(xValue) {
  const x = Number(xValue);
  if (!Number.isFinite(x)) return null;
  const width = FIBA_COURT.paintRight - FIBA_COURT.paintLeft;
  const leftBoundary = FIBA_COURT.paintLeft + width / 3;
  const rightBoundary = FIBA_COURT.paintLeft + width * 2 / 3;
  if (x < leftBoundary) return 'left';
  if (x > rightBoundary) return 'right';
  return 'center';
}

export function shotAnalysisTags(shot = {}) {
  const normalized = normalizeShot(shot);
  const hasCoordinates = Number.isFinite(Number(normalized.shotX)) && Number.isFinite(Number(normalized.shotY));
  const area = hasCoordinates ? detectShotArea(normalized.shotX, normalized.shotY) : normalized.shotArea;
  const distance = DISTANCE_BY_AREA[area] || 'other';
  let side = SIDE_BY_AREA[area] || null;
  if (area === 'inside' && hasCoordinates) side = insideAnalysisSide(normalized.shotX);
  return { area, distance, side };
}

export function matchesShotAnalysisTags(shot = {}, { distance = 'all', side = 'all' } = {}) {
  const tags = shotAnalysisTags(shot);
  const distanceMatch = distance === 'all'
    || (distance === 'paint' && (tags.distance === 'under' || tags.distance === 'inside'))
    || (distance === 'mid' && tags.distance === 'mid')
    || (distance === 'three' && tags.distance === 'three')
    || (distance === 'mid_three' && (tags.distance === 'mid' || tags.distance === 'three'));
  // ゴール下は方向を持たないため、方向指定時には自動的に除外される。
  const sideMatch = side === 'all' || tags.side === side;
  return distanceMatch && sideMatch;
}

export function filterShotsByAnalysisTags(shots = [], filters = {}) {
  return shots.map(normalizeShot).filter(shot => matchesShotAnalysisTags(shot, filters) && !(filters.excludeBuzzerBeaters && shot.shotType === 'buzzer_beater'));
}

export function aggregateShotAnalysis(shots = [], filters = {}) {
  const selected = filterShotsByAnalysisTags(shots, filters);
  const registered = selected.length;
  const attempts = selected.filter(countsAsFieldGoalAttempt).length;
  const made = selected.filter(shot => shot.result === 'made').length;
  return {
    shots: selected,
    registered,
    attempts,
    made,
    rate: attempts ? `${(made / attempts * 100).toFixed(1)}%` : '-'
  };
}
