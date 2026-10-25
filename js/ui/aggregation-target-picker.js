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
  return `<div class="analysis-target-row"><div class="aggregation-picker" data-target-picker><span>対象選択</span><select id="${prefix}Target" hidden aria-hidden="true" tabindex="-1"><option value="">選択してください</option>${items.map(item=>`<option value="${escape(item.id)}" ${item.id===target?'selected':''}>${escape(item.label)}</option>`).join('')}</select><button type="button" class="aggregation-picker-open" data-target-open><span>${escape(selected?.label||'対象を選択してください')}</span><span aria-hidden="true">›</span></button></div></div>`;
}
let closeActivePicker;
export function bindTargetPickers(gamesByPrefix) {
  closeActivePicker?.(false);
  document.querySelectorAll('[data-target-picker]').forEach(root=>{
    const select=root.querySelector('select[id]'), {games,mode}=gamesByPrefix[select.id]||{};
    if(!games) return;
    const items=targetPickerItems(games,mode), trigger=root.querySelector('[data-target-open]');
    trigger.onclick=()=>{
      const view=document.querySelector('#view'), scroll=window.scrollY;
      if(!view) return;
      const previous=[...view.children].map(element=>({element,hidden:element.hidden}));
      previous.forEach(({element})=>element.hidden=true);
      const page=document.createElement('section');
      page.className='aggregation-target-page';
      page.setAttribute('aria-label',mode==='game'?'試合を選択':'大会を選択');
      const months=[...new Set(items.flatMap(item=>item.months))].sort().reverse();
      page.innerHTML=`<header class="aggregation-target-head"><button type="button" class="btn ghost" data-target-back>‹ 戻る</button><h2>${mode==='game'?'試合を選択':'大会を選択'}</h2></header><div class="aggregation-target-filters"><label>キーワード検索<input type="search" data-target-search placeholder="${mode==='game'?'対戦相手・大会名・日付':'大会名・日付'}" autocomplete="off"></label><div class="aggregation-target-month-row"><label>年月<select data-target-month><option value="">すべての年月</option>${months.map(month=>`<option value="${escape(month)}">${escape(month)}</option>`).join('')}</select></label><button type="button" class="btn ghost" data-target-reset>条件クリア</button></div></div><p data-target-count role="status"></p><div class="aggregation-target-results"></div>`;
      view.append(page);
      const search=page.querySelector('[data-target-search]'),month=page.querySelector('[data-target-month]'),results=page.querySelector('.aggregation-target-results');
      const close=(restore=true)=>{
        document.removeEventListener('keydown',onKey);
        page.remove();previous.forEach(({element,hidden})=>element.hidden=hidden);
        closeActivePicker=null;
        if(restore){window.scrollTo(0,scroll);trigger.focus({preventScroll:true})}
      };
      const onKey=event=>{if(event.key==='Escape')close()};
      closeActivePicker=close;document.addEventListener('keydown',onKey);
      const update=()=>{
        const filtered=filterTargetPickerItems(items,search.value,month.value);
        page.querySelector('[data-target-count]').textContent=`${filtered.length}件 / 全${items.length}件（新しい順）`;
        results.innerHTML=filtered.length?filtered.map(item=>`<button type="button" class="aggregation-target-item" data-target-value="${escape(item.id)}" aria-pressed="${item.id===select.value}"><span class="aggregation-target-copy"><strong>${escape(item.label)}</strong><small>${escape(item.detail)}</small></span><span class="aggregation-target-check" aria-hidden="true">${item.id===select.value?'✓':'›'}</span></button>`).join(''):'<p class="aggregation-target-empty">該当する対象がありません。<br>検索条件を変更してください。</p>';
      };
      search.oninput=update;month.onchange=update;
      page.querySelector('[data-target-back]').onclick=()=>close();
      page.querySelector('[data-target-reset]').onclick=()=>{search.value='';month.value='';update()};
      results.onclick=event=>{const button=event.target.closest('[data-target-value]');if(!button)return;select.value=button.dataset.targetValue;close();select.dispatchEvent(new Event('change',{bubbles:true}))};
      update();window.scrollTo(0,0);page.querySelector('[data-target-back]').focus({preventScroll:true});
    };
  });
}
