(()=>{
  const root=document.getElementById('view');
  if(!root)return;

  // Keep only the Settings controls that are still required for normal
  // operation. The underlying one-off maintenance/import functions remain in
  // app.js for compatibility, so existing tournament/game data is untouched.
  //
  // Kept in the generation section:
  // - 新しい世代を作成
  // - migration前バックアップ
  // - Season migration
  //
  // Kept in the maintenance row:
  // - 再読み込み
  // - 全チームのシーズンランク再計算
  const obsoleteSelectors=[
    'button[onclick="rebuildHomeSummaries()"]',
    'button[onclick="dryRun2025OsakaJrWinterCupMen()"]',
    'button[onclick="import2025OsakaJrWinterCupMen()"]',
    'button[onclick="consolidate2025OsakaOpponentTeams()"]',
    'button[onclick="apply2026RankingAndKinkiMen()"]',
    'button[onclick="import2025OsakaClubCupMen()"]',
    'button[onclick="import2025OsakaJuniorChampionshipMen()"]',
    'button[onclick="import2025HyogoJhsSoutaiMen()"]',
    'button[onclick="import2025HyogoJhsRookiesMen()"]',
    'button[onclick="import2026ShigaMen()"]',
    'button[onclick="import2026KyotoMen()"]',
    'button[onclick="import2025HyogoJrWinterMen()"]',
    'button[onclick="import2025CbgHyogoMen()"]',
    'button[onclick="cleanupCbgDuplicates()"]',
    'button[onclick="consolidateHyogoOpponentTeams()"]'
  ];

  async function r32ForceFreshReload(){
    try{
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(key=>key.startsWith('r32-shell-')).map(key=>caches.delete(key)));
      }
      if('serviceWorker' in navigator){
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration=>registration.update().catch(()=>{})));
      }
    }catch(error){console.warn('R32 fresh reload cleanup failed',error)}
    const url=new URL(location.href);
    url.searchParams.set('r32v','20260915-hyogo-2026-history-v2');
    location.replace(url.toString());
  }

  function cleanup(){
    for(const selector of obsoleteSelectors){
      root.querySelectorAll(selector).forEach(button=>button.remove());
    }
    const reload=[...root.querySelectorAll('button')].find(button=>button.textContent.trim()==='再読み込み');
    if(reload&&!reload.dataset.r32FreshReload){
      reload.dataset.r32FreshReload='1';
      reload.onclick=event=>{event.preventDefault();r32ForceFreshReload()};
    }

    const settingsHeading=[...root.querySelectorAll('h2')].find(node=>node.textContent.trim()==='設定');
    const registered=typeof window.r32TournamentRegistered==='function'&&window.r32TournamentRegistered('2026-hyogo-jhs-soutai-men');
    const current=root.querySelector('button[onclick="import2026HyogoJhsSoutaiMen()"],button[data-r32-injected="2026-hyogo-jhs-soutai"]');
    if(registered&&current)current.remove();
    if(settingsHeading&&!registered&&!current&&typeof window.import2026HyogoJhsSoutaiMen==='function'){
      const button=document.createElement('button');
      button.className='btn';
      button.type='button';
      button.textContent='2026 兵庫県中学校総体を登録';
      button.dataset.r32Injected='2026-hyogo-jhs-soutai';
      button.onclick=()=>window.import2026HyogoJhsSoutaiMen();
      const host=[...root.querySelectorAll('.row')].find(row=>[...row.querySelectorAll('button')].some(button=>button.textContent.includes('全チームのランク')&&button.textContent.includes('Power再計算')))
        || settingsHeading.parentElement?.querySelector('.row');
      host?.appendChild(button);
    }
  }

  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanup()});
  }).observe(root,{childList:true,subtree:true});

  cleanup();
})();
