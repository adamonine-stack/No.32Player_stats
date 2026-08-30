(()=>{
  const root=document.getElementById('modalRoot');
  if(!root)return;

  let editMode=false;
  let scheduled=false;
  const TONE_CLASSES=['history-tone-made','history-tone-miss','history-tone-mixed','history-tone-ast','history-tone-reb','history-tone-stl','history-tone-blk','history-tone-to','history-tone-foul','history-tone-fouled','history-tone-sub','history-tone-neutral'];

  function actionSpan(content){
    let span=content.querySelector('.game-history-action-text');
    if(span)return span;
    const firstBreak=[...content.childNodes].find(node=>node.nodeName==='BR');
    const actionNode=firstBreak?.nextSibling;
    if(!actionNode||actionNode.nodeType!==Node.TEXT_NODE)return null;
    span=document.createElement('span');
    span.className='game-history-action-text';
    span.textContent=actionNode.textContent||'';
    content.replaceChild(span,actionNode);
    return span;
  }

  function historyTone(text){
    const value=(text||'').trim();
    if(/\bOUT\s*→.*\bIN\b/i.test(value))return 'sub';
    if(/^被FOUL/.test(value))return 'fouled';
    if(/^FOUL/.test(value))return 'foul';
    if(/^AST\b/.test(value))return 'ast';
    if(/^REB[：:]/.test(value))return 'reb';
    if(/^STL[：:]/.test(value))return 'stl';
    if(/^BLK\b/.test(value))return 'blk';
    if(/^TO[：:]/.test(value))return 'to';
    const ft=value.match(/^FT\s+(\d+)\/(\d+)/i);
    if(ft){
      const made=Number(ft[1]),attempts=Number(ft[2]);
      if(attempts>0&&made===attempts)return 'made';
      if(made===0)return 'miss';
      return 'mixed';
    }
    if(/\bMade\b/i.test(value))return 'made';
    if(/\bMiss\b/i.test(value))return 'miss';
    return 'neutral';
  }

  function styleSubstitution(span){
    if(span.dataset.historySubStyled)return;
    const text=span.textContent||'';
    const parts=text.split(/(OUT|IN)/g);
    if(parts.length<3)return;
    span.textContent='';
    parts.forEach(part=>{
      if(part==='OUT'||part==='IN'){
        const marker=document.createElement('strong');
        marker.className=`game-history-sub-${part.toLowerCase()}`;
        marker.textContent=part;
        span.appendChild(marker);
      }else span.appendChild(document.createTextNode(part));
    });
    span.dataset.historySubStyled='1';
  }

  function decorateRows(card){
    card.querySelectorAll('.game-history-row').forEach(row=>{
      const content=row.querySelector('.game-history-content');
      if(!content)return;
      const span=actionSpan(content);
      if(!span)return;
      const tone=historyTone(span.textContent);
      row.classList.remove(...TONE_CLASSES);
      row.classList.add(`history-tone-${tone}`);
      if(tone==='sub')styleSubstitution(span);
    });
  }

  function applyMode(card){
    decorateRows(card);
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
