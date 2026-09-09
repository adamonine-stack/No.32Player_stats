// Quick-entry latest-history controls.
// Keep the compact latest-history card as the single navigation/edit surface.
(function(){
  const removeRedundantFooterControls=()=>{
    const modal=document.querySelector('#modalRoot>.modal.quick-entry-modal');
    if(!modal)return;
    const undo=modal.querySelector('#quickUndo');
    const history=modal.querySelector('#quickHistory');
    const footer=undo?.closest('.quick-footer')||history?.closest('.quick-footer');
    undo?.remove();
    history?.remove();
    if(footer&&!footer.querySelector('button'))footer.remove();
  };

  const observer=new MutationObserver(removeRedundantFooterControls);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  removeRedundantFooterControls();

  document.addEventListener('click',event=>{
    const edit=event.target.closest('[data-quick-latest-edit]');
    if(!edit)return;
    const latest=edit.closest('.quick-latest-history');
    if(!latest)return;

    // The compact card can be rebuilt by the local-history overlay. Route editing
    // through the full-history row rendered from the same current state so the
    // existing edit implementation always receives the canonical history item.
    event.preventDefault();
    event.stopImmediatePropagation();
    const eventId=edit.dataset.quickLatestEdit;
    const openAll=latest.querySelector('#quickHistoryAll');
    if(!eventId||!openAll)return;
    openAll.click();
    const row=[...document.querySelectorAll('#gameHistoryList [data-history-event-id]')]
      .find(element=>element.dataset.historyEventId===eventId);
    const fullEdit=row?.querySelector('[data-history-edit]');
    if(fullEdit)fullEdit.click();
    else window.openGameHistory?.(latest.dataset.gameId||'');
  },true);
})();
