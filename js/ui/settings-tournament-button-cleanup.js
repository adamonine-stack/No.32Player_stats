(()=>{
  const root=document.getElementById('view');
  if(!root)return;

  // Tournament import controls were one-off administrative tools. Keep the
  // underlying import functions/data for compatibility, but remove their
  // obsolete buttons from the Settings UI so existing tournament/game data
  // is untouched.
  const obsoleteSelectors=[
    'button[onclick="dryRun2025OsakaJrWinterCupMen()"]',
    'button[onclick="import2025OsakaJrWinterCupMen()"]',
    'button[onclick="import2026ShigaMen()"]',
    'button[onclick="import2026KyotoMen()"]',
    'button[onclick="import2025HyogoJrWinterMen()"]',
    'button[onclick="import2025CbgHyogoMen()"]'
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
