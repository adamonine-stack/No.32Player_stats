(()=>{
  const root=document.getElementById('modalRoot');
  if(!root)return;

  function quarterOf(unit){
    const text=unit?.querySelector('.game-history-meta')?.textContent||'';
    const match=text.match(/(\d+)Q/);
    return match?Number(match[1]):0;
  }

  function scroller(){return root.querySelector('.game-history-modal')}
  function list(){return root.querySelector('#gameHistoryList')}

  function jumpTop(){
    const card=scroller();
    if(!card)return;
    card.scrollTo({top:0,behavior:'smooth'});
  }

  function jumpBottom(card){
    if(!card)return;
    card.scrollTo({top:card.scrollHeight,behavior:'smooth'});
  }

  function scrollToUnit(card,unit,block='start'){
    if(!card||!unit)return;
    const cardRect=card.getBoundingClientRect();
    const unitRect=unit.getBoundingClientRect();
    const current=card.scrollTop;
    let top=current+(unitRect.top-cardRect.top);
    if(block==='end')top=current+(unitRect.bottom-cardRect.bottom);
    const max=Math.max(0,card.scrollHeight-card.clientHeight);
    card.scrollTo({top:Math.max(0,Math.min(max,top)),behavior:'smooth'});
  }

  function jumpNextQuarter(){
    const card=scroller(),history=list();
    if(!card||!history)return;
    const units=[...history.querySelectorAll(':scope > [data-history-action-id]')];
    if(!units.length){jumpBottom(card);return}

    const cardRect=card.getBoundingClientRect();
    const visible=units.find(unit=>unit.getBoundingClientRect().bottom>cardRect.top+12)||units[0];
    const currentQuarter=quarterOf(visible);
    const quarters=[...new Set(units.map(quarterOf).filter(Number.isFinite).filter(q=>q>0))].sort((a,b)=>a-b);
    const lastQuarter=quarters.at(-1)||0;
    const nextQuarter=quarters.find(q=>q>currentQuarter);

    if(nextQuarter){
      const target=units.find(unit=>quarterOf(unit)===nextQuarter);
      scrollToUnit(card,target,'start');
      return;
    }

    // 最終Q表示中は、履歴の最終アクションではなくモーダル全体の最下部へ移動する。
    if(currentQuarter===lastQuarter){jumpBottom(card);return}
    jumpBottom(card);
  }

  function sync(){
    const card=scroller(),history=list();
    let nav=root.querySelector('#gameHistoryFixedNav');
    if(!card||!history){nav?.remove();return}
    if(!nav){
      nav=document.createElement('div');
      nav.id='gameHistoryFixedNav';
      nav.className='game-list-fixed-nav game-history-fixed-nav is-visible';
      nav.setAttribute('aria-label','試合履歴移動');
      nav.innerHTML=`
        <button type="button" class="game-list-fixed-nav-btn" data-history-fixed-jump="top">
          <span aria-hidden="true">↑</span><span>最上部</span>
        </button>
        <span class="game-list-fixed-nav-divider" aria-hidden="true"></span>
        <button type="button" class="game-list-fixed-nav-btn" data-history-fixed-jump="next-quarter">
          <span aria-hidden="true">↓</span><span>次のQへ</span>
        </button>`;
      card.appendChild(nav);
      nav.querySelector('[data-history-fixed-jump="top"]')?.addEventListener('click',jumpTop);
      nav.querySelector('[data-history-fixed-jump="next-quarter"]')?.addEventListener('click',jumpNextQuarter);
    }else if(nav.parentElement!==card){
      card.appendChild(nav);
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    #modalRoot .game-history-fixed-nav{
      position:relative;left:auto;right:auto;bottom:auto;transform:none;
      width:100%;min-width:0;margin:24px 0 0;z-index:auto;border-radius:13px;
    }
    #modalRoot .game-history-modal{padding-bottom:24px}
    @media(max-width:800px){
      #modalRoot .game-history-fixed-nav{
        position:relative;left:auto;right:auto;bottom:auto;transform:none;
        width:100%;min-width:0;margin:24px 0 0;border-radius:13px;
      }
      #modalRoot .game-history-modal{padding-bottom:24px}
    }
  `;
  document.head.appendChild(style);

  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;sync()});
  }).observe(root,{childList:true,subtree:true});
  sync();
})();
