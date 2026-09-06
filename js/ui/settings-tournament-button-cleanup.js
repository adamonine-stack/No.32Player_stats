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

  function cleanup(){
    for(const selector of obsoleteSelectors){
      root.querySelectorAll(selector).forEach(button=>button.remove());
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
