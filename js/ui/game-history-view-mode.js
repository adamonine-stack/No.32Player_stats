(()=>{
  const root=document.getElementById('modalRoot');
  if(!root)return;

  let editMode=false;
  let scheduled=false;

  function applyMode(card){
    const editable=Boolean(card.querySelector('[data-history-insert],[data-history-drag],[data-history-edit],[data-history-delete]'));
    card.classList.toggle('game-history-readonly',!editMode);
    card.classList.toggle('game-history-editing',editMode);

    const head=card.querySelector('.participation-head');
    if(head){
      const subtitle=head.querySelector('.sub');
      if(subtitle){
        if(!subtitle.dataset.historyEditorText)subtitle.dataset.historyEditorText=subtitle.textContent||'';
        subtitle.textContent=editMode
          ? subtitle.dataset.historyEditorText
          : subtitle.dataset.historyEditorText.split('｜')[0].trim();
      }

      let toggle=head.querySelector('[data-history-mode-toggle]');
      if(editable&&!toggle){
        toggle=document.createElement('button');
        toggle.type='button';
        toggle.className='btn ghost game-history-mode-toggle';
        toggle.dataset.historyModeToggle='';
        const close=head.querySelector('#closeModal');
        head.insertBefore(toggle,close||null);
        toggle.addEventListener('click',()=>{
          editMode=!editMode;
          applyMode(card);
        });
      }
      if(toggle){
        toggle.textContent=editMode?'閲覧':'編集';
        toggle.setAttribute('aria-label',editMode?'閲覧モードに戻る':'試合履歴を編集する');
      }
    }

    card.querySelectorAll(':scope > p.sub').forEach(note=>{
      if((note.textContent||'').includes('順序情報なし'))note.classList.add('game-history-editor-note');
    });
  }

  function sync(){
    scheduled=false;
    const card=root.querySelector('.game-history-modal');
    if(card){
      applyMode(card);
      return;
    }
    if(!root.firstElementChild)editMode=false;
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(sync);
  }

  new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  schedule();
})();
