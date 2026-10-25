const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase();

export function targetPickerItems(games, mode) {
  const sorted = [...games].sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));
  if (mode === 'game') return sorted.map(game => ({id:game.id, label:`${game.date||'日付未登録'} vs ${game.opponent||'対戦相手未登録'}`, detail:game.tournament||'大会未登録', months:[String(game.date||'').slice(0,7)].filter(Boolean)}));
  const groups = new Map();
  for (const game of sorted) {
    if (!game.tournament) continue;
    if (!groups.has(game.tournament)) groups.set(game.tournament, {id:game.tournament,label:game.tournament,detail:'',months:[],dates:[],count:0});
    const item = groups.get(game.tournament);
    item.count++;
    if(game.date) { item.dates.push(game.date); item.months.push(game.date.slice(0,7)); }
  }
  return [...groups.values()].map(item => ({...item,months:[...new Set(item.months)],detail:`${item.count}試合${item.dates.length ? ` ｜ ${item.dates.at(-1)} ～ ${item.dates[0]}` : ''}`}));
}
export function filterTargetPickerItems(items, query='', month='') {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return items.filter(item => (!month || item.months.includes(month)) && words.every(word => normalize(`${item.label} ${item.detail}`).includes(word)));
}
export function targetPickerHtml(prefix,games,mode,target) {
  const items=targetPickerItems(games,mode), selected=items.find(item=>item.id===target);
  const months=[...new Set(items.flatMap(item=>item.months))].sort().reverse();
  return `<div class="analysis-target-row"><div class="aggregation-picker" data-target-picker><span>対象選択</span><select id="${prefix}Target" hidden aria-hidden="true" tabindex="-1"><option value="">選択してください</option>${items.map(item=>`<option value="${escape(item.id)}" ${item.id===target?'selected':''}>${escape(item.label)}</option>`).join('')}</select><details><summary>${escape(selected?.label||'対象を選択してください')}<small>検索・年月で絞り込む</small></summary><div class="aggregation-picker-tools"><label>検索<input type="search" data-target-search placeholder="${mode==='game'?'対戦相手・大会名・日付':'大会名・日付'}" autocomplete="off"></label><label>年月<select data-target-month><option value="">すべての年月</option>${months.map(month=>`<option value="${escape(month)}">${escape(month)}</option>`).join('')}</select></label><button type="button" data-target-reset>条件クリア</button></div><p data-target-count role="status"></p><div class="aggregation-picker-results"></div></details></div></div>`;
}
export function bindTargetPickers(gamesByPrefix) {
  document.querySelectorAll('[data-target-picker]').forEach(root=>{
    const select=root.querySelector('select[id]'), {games,mode}=gamesByPrefix[select.id]||{};
    if(!games) return;
    const items=targetPickerItems(games,mode),search=root.querySelector('[data-target-search]'),month=root.querySelector('[data-target-month]'),results=root.querySelector('.aggregation-picker-results');
    const update=()=>{
      const filtered=filterTargetPickerItems(items,search.value,month.value);
      root.querySelector('[data-target-count]').textContent=`${filtered.length}件 / 全${items.length}件（新しい順）`;
      results.innerHTML=filtered.length?filtered.map(item=>`<button type="button" data-target-value="${escape(item.id)}" aria-pressed="${item.id===select.value}"><span>${item.id===select.value?'✓ ':''}${escape(item.label)}</span><small>${escape(item.detail)}</small></button>`).join(''):'<p>該当する対象がありません。検索条件を変更してください。</p>';
    };
    search.oninput=update; month.onchange=update;
    root.querySelector('[data-target-reset]').onclick=()=>{search.value='';month.value='';update();search.focus()};
    results.onclick=event=>{const button=event.target.closest('[data-target-value]');if(!button)return;select.value=button.dataset.targetValue;select.dispatchEvent(new Event('change',{bubbles:true}))};
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){root.querySelector('details').open=false;root.querySelector('summary').focus()}});
    update();
  });
}
