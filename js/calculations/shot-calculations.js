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
  under_basket: "ゴール下"
});

export const SHOT_AREA_ORDER = Object.freeze(Object.keys(SHOT_AREAS));
export const SHOT_TYPE_ORDER = Object.freeze(Object.keys(SHOT_TYPES));

export function shotValueForArea(areaId) {
  return SHOT_AREAS[areaId]?.value || 0;
}

export function allowedShotTypes(areaId) {
  const group = SHOT_AREAS[areaId]?.group;
  if (group === "three") return ["jump_shot"];
  if (group === "mid" || group === "other") return ["jump_shot", "floater"];
  if (group === "inside") return ["layup", "floater", "under_basket"];
  if (group === "under") return ["layup", "under_basket"];
  return [];
}

export function createShot({ id, gameId, playerId, quarter = null, shotArea, shotType, result, createdAt = Date.now() }) {
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
    if (shot?.shotValue === 2) {
      totals.twoPa++;
      if (shot.result === "made") totals.twoPm++;
    } else if (shot?.shotValue === 3) {
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
    const id = shot?.[field];
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
      shotType: row.shotType,
      result: slot.result,
      createdAt: createdAt + index
    });
  });
}
