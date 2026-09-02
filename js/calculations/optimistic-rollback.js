function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function rollbackOptimisticEvents(current = [], before = [], optimistic = [], operationIds = []) {
  const ids = new Set(operationIds);
  const beforeById = new Map(before.map(item => [item.id, item]));
  const optimisticById = new Map(optimistic.map(item => [item.id, item]));
  const rolled = [];
  for (const item of current) {
    if (!ids.has(item.id)) { rolled.push(item); continue; }
    const previous = beforeById.get(item.id), expected = optimisticById.get(item.id);
    if (!previous) {
      if (!expected || !same(item, expected)) rolled.push(item);
      continue;
    }
    rolled.push(expected && same(item, expected) ? previous : item);
  }
  for (const id of ids) {
    const previous=beforeById.get(id);
    if(previous && !rolled.some(item=>item.id===id))rolled.push(previous);
  }
  return rolled;
}

export function rollbackOptimisticStats(current = [], before = [], optimistic = []) {
  const beforeById=new Map(before.map(item=>[item.id,item])),optimisticById=new Map(optimistic.map(item=>[item.id,item]));
  const changedIds=new Set(optimistic.filter(item=>!same(item,beforeById.get(item.id))).map(item=>item.id));
  const rolled=[];
  for(const item of current){
    if(!changedIds.has(item.id)){rolled.push(item);continue}
    const previous=beforeById.get(item.id),expected=optimisticById.get(item.id);
    if(expected&&same(item,expected)){if(previous)rolled.push(previous)}else rolled.push(item);
  }
  return rolled;
}

export function changedOptimisticEventIds(before = [], optimistic = []) {
  const beforeById=new Map(before.map(item=>[item.id,item])),optimisticById=new Map(optimistic.map(item=>[item.id,item]));
  return [...new Set([...beforeById.keys(),...optimisticById.keys()])].filter(id=>!same(beforeById.get(id),optimisticById.get(id)));
}
