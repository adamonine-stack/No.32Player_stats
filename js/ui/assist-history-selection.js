(()=>{
  const root=document.getElementById('modalRoot');
  if(!root)return;
  let historySnapshot='';
  let sourceLabel='';
  const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function rememberHistory(){
    const list=root.querySelector('#gameHistoryList');
    if(!list)return;
    historySnapshot=list.innerHTML;
  }
  function rememberSource(){
    const card=root.querySelector('.quick-sheet-modal>.card,#modalRoot>.modal>.card');
    const heading=card?.querySelector('h2');
    if(!heading||heading.textContent.trim()!=='シュートと関連付け')return;
    const paragraphs=card.querySelectorAll(':scope > p');
    sourceLabel=paragraphs[0]?.textContent?.trim()||'AST';
  }
  function convertCandidateModal(){
    const card=root.querySelector('#modalRoot>.modal>.card');
    if(!card||card.dataset.historyAssistSelection==='1')return;
    const heading=card.querySelector('h2');
    if(!heading||heading.textContent.trim()!=='Madeシュートを選択')return;
    const candidateButtons=[...card.querySelectorAll('[data-assist-event]')];
    if(!candidateButtons.length||!historySnapshot)return;
    const candidates=new Map(candidateButtons.map(button=>[button.dataset.assistEvent,button]));
    const back=card.querySelector('#assistEditorBack');
    card.dataset.historyAssistSelection='1';
    card.classList.add('game-history-modal','assist-history-selection-modal');
    card.innerHTML=`<div class="assist-history-selection-head"><div><h2>履歴からシュートを選択</h2><p class="sub">${esc(sourceLabel)} に関連付けるMadeシュートを、試合履歴から選択してください。</p></div><button type="button" class="btn ghost" id="assistHistorySelectBack">戻る</button></div><div class="assist-history-source"><small>関連付け元</small><b>${esc(sourceLabel)}</b></div><div class="game-history-list assist-history-selection-list">${historySnapshot}</div>`;
    card.querySelectorAll('[data-history-insert],.game-history-drag,.game-history-actions').forEach(el=>el.remove());
    card.querySelectorAll('[data-history-action-id]').forEach(action=>{
      const ids=(()=>{try{return JSON.parse(action.dataset.historyEventIds||'[]')}catch{return []}})();
      const id=ids.find(value=>candidates.has(value))|| (candidates.has(action.dataset.historyActionId)?action.dataset.historyActionId:'');
      const row=action.querySelector('.game-history-row');
      if(id&&row){
        action.classList.add('assist-history-selectable');
        row.setAttribute('role','button');row.setAttribute('tabindex','0');
        const choose=()=>{if(action.classList.contains('saving'))return;action.classList.add('saving');candidates.get(id).click()};
        row.addEventListener('click',choose);row.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose()}});
      }else action.classList.add('assist-history-disabled');
    });
    card.querySelector('#assistHistorySelectBack').onclick=()=>back?.click();
    const selected=card.querySelector('.assist-history-selectable');selected?.scrollIntoView({block:'center'});
  }
  let scheduled=false;
  const sync=()=>{scheduled=false;rememberHistory();rememberSource();convertCandidateModal()};
  new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}).observe(root,{childList:true,subtree:true});
  sync();
})();
