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

  function jumpNextQuarter(){
    const card=scroller(),history=list();
    if(!card||!history)return;
    const units=[...history.querySelectorAll(':scope > [data-history-action-id]')];
    if(!units.length)return;
    const cardTop=card.getBoundingClientRect().top;
    const visible=units.find(unit=>unit.getBoundingClientRect().bottom>cardTop+12)||units[0];
    const currentQuarter=quarterOf(visible);
    const target=units.find(unit=>quarterOf(unit)>currentQuarter);
    if(target)target.scrollIntoView({block:'start',behavior:'smooth'});
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
      root.appendChild(nav);
      nav.querySelector('[data-history-fixed-jump="top"]')?.addEventListener('click',jumpTop);
      nav.querySelector('[data-history-fixed-jump="next-quarter"]')?.addEventListener('click',jumpNextQuarter);
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    #modalRoot .game-history-fixed-nav{z-index:220}
    #modalRoot .game-history-modal{padding-bottom:84px}
    @media(max-width:800px){
      #modalRoot .game-history-fixed-nav{
        left:12px;right:12px;bottom:calc(18px + env(safe-area-inset-bottom));
        transform:none;width:auto;min-width:0;border-radius:13px;
      }
      #modalRoot .game-history-modal{padding-bottom:96px}
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
