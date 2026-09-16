const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,canonical(value[key])])):value;
const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const clone=value=>value===undefined?undefined:structuredClone(value);
const map=value=>value&&typeof value==='object'&&!Array.isArray(value);

// Keyed history rows are rebased onto the newest server row. Fields that this
// device did not change keep the server value; fields changed locally use the
// local value. If both devices changed the same field, the operation that is
// confirmed later wins that field. This lets history converge without dropping
// unrelated edits made on another device.
function rebaseRow(live,before,desired){
  if(!map(desired))return clone(desired);
  const previous=map(before)?before:{};
  const result=map(live)?clone(live):{};
  const keys=new Set([...Object.keys(previous),...Object.keys(desired)]);
  for(const key of keys){
    const hadBefore=Object.prototype.hasOwnProperty.call(previous,key);
    const hasDesired=Object.prototype.hasOwnProperty.call(desired,key);
    if(!hasDesired){
      if(hadBefore)delete result[key];
      continue;
    }
    if(!hadBefore||!equal(previous[key],desired[key]))result[key]=clone(desired[key]);
  }
  return result;
}

function applySessionPatch(current,before,patch){
  if(!patch)return clone(current);
  if(patch.kind==='rows'){
    const old=new Map((Array.isArray(before)?before:[]).map(row=>[row.id,row]));
    let rows=(Array.isArray(current)?current:[]).map(clone).filter(row=>!patch.removed.includes(row.id));
    for(const desired of patch.rows){
      const index=rows.findIndex(row=>row.id===desired.id);
      const live=index>=0?rows[index]:undefined;
      const rebased=rebaseRow(live,old.get(desired.id),desired);
      if(index>=0)rows[index]=rebased;else rows.push(rebased);
    }
    return rows;
  }
  if(patch.kind==='map'){
    const result=map(current)?clone(current):{};
    const previous=map(before)?before:{};
    for(const [key,child] of Object.entries(patch.fields))result[key]=applySessionPatch(result[key],previous[key],child);
    return result;
  }
  if(patch.kind==='number')return Math.max(0,(Number(current)||0)+patch.delta);
  return clone(patch.value);
}

// Scalar document fields still use conflict protection. Keyed history rows are
// handled by the three-way rebase above so another device's history update no
// longer blocks an entire quarter from syncing.
export function assertSessionPatch(current, before, patch) {
  if (!patch) return;
  if (patch.kind === 'map') {
    for (const [key, child] of Object.entries(patch.fields)) {
      if (['registered','quarter','id','gameId','playerId','seasonId'].includes(key)) continue;
      assertSessionPatch(current?.[key], before?.[key], child);
    }
  } else if (patch.kind === 'rows') {
    return;
  } else if (patch.kind === 'value' && current !== undefined && !equal(current,before) && !equal(current,patch.value)) {
    throw new Error('同じ項目が別端末で変更されています。未確定入力は端末に保持されています。');
  }
}

export function projectSessionDocument(current, change) {
  assertSessionPatch(current, change.before, change.patch);
  return applySessionPatch(current, change.before, change.patch);
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
