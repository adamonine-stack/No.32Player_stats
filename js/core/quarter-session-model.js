import { applyHistoryPatch } from './history-journal.js?v=20260908-quarter-session-v2';

const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,canonical(value[key])])):value;
const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
// Only changed rows/values are checked. Independent additions and numeric
// deltas commute; an edit of the same event must not silently replace a peer.
export function assertSessionPatch(current, before, patch) {
  if (!patch) return;
  if (patch.kind === 'map') {
    for (const [key, child] of Object.entries(patch.fields)) {
      if (['registered','quarter','id','gameId','playerId','seasonId'].includes(key)) continue;
      assertSessionPatch(current?.[key], before?.[key], child);
    }
  } else if (patch.kind === 'rows') {
    const old = new Map((before || []).map(row => [row.id,row]));
    const live = new Map((current || []).map(row => [row.id,row]));
    for (const id of [...patch.removed,...patch.rows.map(row=>row.id)]) {
      if (!equal(old.get(id),live.get(id))) throw new Error('同じ履歴が別端末で変更されています。未確定入力は端末に保持されています。');
    }
  } else if (patch.kind === 'value' && current !== undefined && !equal(current,before) && !equal(current,patch.value)) {
    throw new Error('同じ項目が別端末で変更されています。未確定入力は端末に保持されています。');
  }
}

export function projectSessionDocument(current, change) {
  assertSessionPatch(current, change.before, change.patch);
  return applyHistoryPatch(current, change.patch);
}

export function stampSessionOverlay(overlay, metadata) {
  const walk = (patch,before) => {
    if (!patch) return;
    if (patch.kind === 'map') for (const [key,child] of Object.entries(patch.fields)) walk(child,before?.[key]);
    if (patch.kind === 'rows') for (const row of patch.rows) {
      if ((before || []).some(old=>old.id===row.id)) continue;
      if ('sequence' in row || 'createdAt' in row) Object.assign(row,metadata,{sequence:metadata.clientCreatedAt * 1000});
    }
  };
  for (const change of overlay.documents) walk(change.patch,change.before);
  return overlay;
}

export function sessionScope(type,payload,options={}) {
  const gameId=payload.gameId || payload.game?.id;
  const changedQuarter=options.overlay?.documents.flatMap(change=>Object.keys(change.patch?.fields?.quarterParticipation?.fields||{})).find(Boolean);
  const quarter=Number(options.quarter || payload.quarter || payload.action?.quarter || payload.action?.shot?.quarter || changedQuarter?.slice(1) || 1);
  if (!gameId || !Number.isInteger(quarter) || quarter<1) throw new Error('保存対象の試合・Qを確認できません。');
  return {gameId,quarter};
}
