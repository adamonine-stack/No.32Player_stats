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
  }

  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanup()});
  }).observe(root,{childList:true,subtree:true});

  cleanup();
})();
