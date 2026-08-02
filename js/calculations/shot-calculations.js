export const SHOT_AREAS = Object.freeze({
  left_zero_mid: { label: "左0°ミドル", value: 2, group: "mid" },
  right_zero_mid: { label: "右0°ミドル", value: 2, group: "mid" },
  left_mid: { label: "左ミドル", value: 2, group: "mid" },
  center_mid: { label: "正面ミドル", value: 2, group: "mid" },
  right_mid: { label: "右ミドル", value: 2, group: "mid" },
  inside: { label: "インサイド", value: 2, group: "inside" },
  under_basket: { label: "ゴール下", value: 2, group: "under" },
  other_2p: { label: "その他2P", value: 2, group: "other" },
  left_corner_3p: { label: "左コーナー3P", value: 3, group: "three" },
  left_45_3p: { label: "左45°3P", value: 3, group: "three" },
  center_3p: { label: "正面3P", value: 3, group: "three" },
  right_45_3p: { label: "右45°3P", value: 3, group: "three" },
  right_corner_3p: { label: "右コーナー3P", value: 3, group: "three" },
  long_range_3p: { label: "ロング3P", value: 3, group: "three" }
});

export const SHOT_TYPES = Object.freeze({
  jump_shot: "ジャンプシュート",
  layup: "レイアップ",
  floater: "フローター",
  tap: "タップ",
  under_basket: "ジャンプシュート"
});

export const SHOT_AREA_ORDER = Object.freeze(Object.keys(SHOT_AREAS));
export const SHOT_TYPE_ORDER = Object.freeze(Object.keys(SHOT_TYPES));
export const SHOT_COURT_SIZE = Object.freeze({ width: 100, height: 93.333 });
export const FIBA_COURT = Object.freeze({ basketX: 50, basketY: 10.5, paintLeft: 33.667, paintRight: 66.333, freeThrowY: 38.667, threeRadius: 45, cornerLeft: 6, cornerRight: 94, cornerJoinY: 19.934, noChargeRadius: 8.667 });
export const UNDER_BASKET_ZONE = Object.freeze({ centerX: 50, centerY: 10.5, radiusX: 14, radiusY: 14 });
export const SHOT_AREA_MODEL_VERSION = "fiba-2024-r32-v1";

export function detectShotArea(xValue, yValue) {
  const x = Number(xValue), y = Number(yValue);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > SHOT_COURT_SIZE.width || y < 0 || y > SHOT_COURT_SIZE.height) return null;
  const { basketX, basketY, paintLeft, paintRight, freeThrowY, threeRadius, cornerLeft, cornerRight, cornerJoinY, noChargeRadius } = FIBA_COURT;
  if (y <= cornerJoinY && x < cornerLeft) return "left_corner_3p";
  if (y <= cornerJoinY && x > cornerRight) return "right_corner_3p";
  const isTwoPoint = x >= cornerLeft && x <= cornerRight && Math.hypot(x - basketX, y - basketY) <= threeRadius;
  if (!isTwoPoint) {
    const leftCenterBoundary = paintLeft;
    const rightCenterBoundary = 100 - leftCenterBoundary;
    if (x < leftCenterBoundary) return "left_45_3p";
    if (x > rightCenterBoundary) return "right_45_3p";
    return "center_3p";
  }
  const under = UNDER_BASKET_ZONE, normalizedX = (x - under.centerX) / under.radiusX;
  const underCurveY = under.centerY + under.radiusY * Math.sqrt(Math.max(0, 1 - normalizedX ** 2));
  if (Math.abs(normalizedX) <= 1 && y <= underCurveY) return "under_basket";
  if (x >= paintLeft && x <= paintRight && y <= freeThrowY) return "inside";
  if (y <= 24) return x < paintLeft ? "left_zero_mid" : x > paintRight ? "right_zero_mid" : "inside";
  if (x < paintLeft) return "left_mid";
  if (x > paintRight) return "right_mid";
  return "center_mid";
}

export function hasShotCoordinates(shot = {}) {
  return shot.shotX !== null && shot.shotX !== undefined && shot.shotY !== null && shot.shotY !== undefined
    && Number.isFinite(Number(shot.shotX)) && Number.isFinite(Number(shot.shotY));
}

export function shotAreaForRecord(shot = {}, detector = detectShotArea) {
  return hasShotCoordinates(shot) ? (detector(shot.shotX, shot.shotY) || shot.shotArea) : shot.shotArea;
}

export function reclassifyShot(shot = {}, detector = detectShotArea, modelVersion = SHOT_AREA_MODEL_VERSION) {
  const shotArea = shotAreaForRecord(shot, detector), area = SHOT_AREAS[shotArea];
  if (!area) return { ...shot };
  return { ...shot, shotArea, shotAreaLabel: area.label, shotValue: area.value, points: shot.result === "made" ? area.value : 0, shotAreaModelVersion: modelVersion };
}

export function reclassifyShots(shots = [], detector = detectShotArea, modelVersion = SHOT_AREA_MODEL_VERSION) {
  return shots.map(shot => reclassifyShot(shot, detector, modelVersion));
}

export function shotValueForArea(areaId) {
  return SHOT_AREAS[areaId]?.value || 0;
}

export function allowedShotTypes(areaId) {
  const group = SHOT_AREAS[areaId]?.group;
  if (group === "three") return ["jump_shot"];
  if (group === "mid" || group === "other") return ["jump_shot", "floater"];
  if (group === "inside") return ["layup", "floater", "jump_shot"];
  if (group === "under") return ["layup", "jump_shot", "floater", "tap"];
  return [];
}

export function createShot({ id, gameId, playerId, quarter = null, shotArea, shotX = null, shotY = null, shotType, result, createdAt = Date.now() }) {
  const hasCoordinates = shotX !== null && shotX !== undefined && shotY !== null && shotY !== undefined;
  const coordinateArea = hasCoordinates ? detectShotArea(shotX, shotY) : null;
  if (coordinateArea) shotArea = coordinateArea;
  const area = SHOT_AREAS[shotArea];
  if (!gameId || !playerId) throw new Error("試合と選手を選択してください");
  if (!area) throw new Error("シュートエリアを選択してください");
  if (!allowedShotTypes(shotArea).includes(shotType)) throw new Error("シュート種類を選択してください");
  if (!['made', 'missed'].includes(result)) throw new Error("成功または失敗を選択してください");
  const shotValue = area.value;
  return {
    id: id || `shot_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    gameId,
    playerId,
    quarter: quarter ? Number(quarter) : null,
    shotArea,
    shotAreaLabel: area.label,
    shotX: hasCoordinates && Number.isFinite(Number(shotX)) ? Number(Number(shotX).toFixed(3)) : null,
    shotY: hasCoordinates && Number.isFinite(Number(shotY)) ? Number(Number(shotY).toFixed(3)) : null,
    shotAreaModelVersion: SHOT_AREA_MODEL_VERSION,
    shotValue,
    shotType,
    shotTypeLabel: SHOT_TYPES[shotType],
    result,
    points: result === "made" ? shotValue : 0,
    createdAt
  };
}

export function shotTotals(shots = []) {
  return shots.reduce((totals, shot) => {
    const shotValue = SHOT_AREAS[shotAreaForRecord(shot)]?.value || shot?.shotValue;
    if (shotValue === 2) {
      totals.twoPa++;
      if (shot.result === "made") totals.twoPm++;
    } else if (shotValue === 3) {
      totals.threePa++;
      if (shot.result === "made") totals.threePm++;
    }
    return totals;
  }, { twoPa: 0, twoPm: 0, threePa: 0, threePm: 0 });
}

export function mergeShotTotals(source = {}, previousShots = [], nextShots = []) {
  const previous = shotTotals(previousShots);
  const next = shotTotals(nextShots);
  const result = {};
  for (const key of ["twoPa", "twoPm", "threePa", "threePm"]) {
    const legacyBase = Math.max(0, Number(source[key] || 0) - previous[key]);
    result[key] = legacyBase + next[key];
  }
  return result;
}

export function detailedShotTotals(source = {}, previousShots = [], nextShots = []) {
  return Array.isArray(source.shots)
    ? mergeShotTotals(source, previousShots, nextShots)
    : shotTotals(nextShots);
}

export function collectShots(items = []) {
  return items.flatMap(stat => {
    const topLevel = Array.isArray(stat?.shots) ? stat.shots : [];
    const quarterShots = stat?.quarters && typeof stat.quarters === "object"
      ? Object.values(stat.quarters).flatMap(q => Array.isArray(q?.shots) ? q.shots : [])
      : [];
    return [...topLevel, ...quarterShots];
  });
}

export function aggregateShots(shots = [], field, ids) {
  const result = Object.fromEntries(ids.map(id => [id, { made: 0, attempts: 0 }]));
  for (const shot of shots) {
    const id = field === "shotArea" ? shotAreaForRecord(shot) : shot?.[field];
    if (!result[id]) continue;
    result[id].attempts++;
    if (shot.result === "made") result[id].made++;
  }
  return result;
}

export function legacyShotSlots(source = {}) {
  const slots = [];
  const add = (shotValue, result, count) => {
    for (let index = 0; index < Math.max(0, Number(count || 0)); index++) {
      slots.push({ key: `${shotValue}p_${result}_${index + 1}`, shotValue, result });
    }
  };
  add(2, "made", source.twoPm);
  add(2, "missed", Math.max(0, Number(source.twoPa || 0) - Number(source.twoPm || 0)));
  add(3, "made", source.threePm);
  add(3, "missed", Math.max(0, Number(source.threePa || 0) - Number(source.threePm || 0)));
  return slots;
}

export function isLegacyShotBreakdownTarget(source = {}) {
  return source.shotTrackingMode !== "detailed"
    && !Array.isArray(source.shots)
    && legacyShotSlots(source).length > 0;
}

export function createLegacyBreakdownShots({ source = {}, rows = [], gameId, playerId, quarter = null, createdAt = Date.now() }) {
  const slots = legacyShotSlots(source);
  if (rows.length !== slots.length) throw new Error("既存の全シュート内訳を入力してください");
  return slots.map((slot, index) => {
    const row = rows[index] || {};
    if (shotValueForArea(row.shotArea) !== slot.shotValue) throw new Error(`${index + 1}行目のエリアを選択してください`);
    return createShot({
      id: `shot_legacy_${createdAt}_${index + 1}`,
      gameId,
      playerId,
      quarter,
      shotArea: row.shotArea,
      shotX: row.shotX,
      shotY: row.shotY,
      shotType: row.shotType,
      result: slot.result,
      createdAt: createdAt + index
    });
  });
}
