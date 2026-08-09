import { state } from '../core/state.js';
import { setLastPlayerId } from '../core/storage.js';
import { detectShotArea, SHOT_COURT_SIZE, SHOT_AREAS } from '../calculations/shot-calculations.js?v=20260804-shot-types-v19';

(() => {
  const MODAL_SELECTOR = '#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal)';
  const selectedAreas = new Set();
  let suppressClickUntil = 0;

  const style = document.createElement('style');
  style.textContent = `
    ${MODAL_SELECTOR} .analysis-player-switcher{position:relative;z-index:60;margin:8px 0;padding:0}
    ${MODAL_SELECTOR} .analysis-player-button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:9px 12px;border:1px solid #475a86;border-radius:10px;background:#111b36;color:#fff;font-size:13px;font-weight:900;pointer-events:auto!important;touch-action:manipulation!important}
    ${MODAL_SELECTOR} .analysis-player-button::after{content:'▼';font-size:10px;color:#aab5d1}
    ${MODAL_SELECTOR} .analysis-player-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);z-index:1000;display:none;max-height:260px;overflow:auto;padding:6px;border:1px solid #475a86;border-radius:10px;background:#071126;box-shadow:0 12px 30px rgba(0,0,0,.5)}
    ${MODAL_SELECTOR} .analysis-player-menu.open{display:grid;gap:4px}
    ${MODAL_SELECTOR} .analysis-player-option{width:100%;text-align:left;padding:10px;border:0;border-radius:8px;background:rgba(255,255,255,.06);color:#fff;font-size:13px;font-weight:800}
    ${MODAL_SELECTOR} .analysis-player-option.active{background:linear-gradient(135deg,#8a2be2,#6514cb)}
    ${MODAL_SELECTOR} .analysis-area-selection-status{margin:6px 0 8px;padding:7px 9px;border-radius:9px;background:rgba(138,43,226,.12);border:1px solid rgba(167,139,250,.35);font-size:10px;font-weight:800;color:#ddd6fe}
    ${MODAL_SELECTOR} .shot-marker.analysis-area-muted,${MODAL_SELECTOR} .shot-foul-ring.analysis-area-muted,${MODAL_SELECTOR} .shot-selection-ring.analysis-area-muted{opacity:.10!important}
    ${MODAL_SELECTOR} .analysis-area-overlay{pointer-events:none}
    ${MODAL_SELECTOR}.analysis-has-area-selection [data-analysis-shot-area]{display:none!important}
    ${MODAL_SELECTOR}.analysis-has-area-selection [data-analysis-shot-area].analysis-area-visible{display:flex!important}
  `;
  document.head.appendChild(style);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const playerLabel = p => `${p?.number ? `No.${p.number} ` : ''}${p?.name || '名称未登録'}`;
  const areaLabel = id => SHOT_AREAS?.[id]?.label || SHOT_AREAS?.[id]?.name || id;
  const pointKey = (x,y) => `${Number(x).toFixed(3)}:${Number(y).toFixed(3)}`;

  function currentPlayer(){return state.players.find(p=>p.id===state.lastPlayerId)||state.players[0]||null}

  function switchPlayer(modal,nextId){
    if(!nextId||nextId===state.lastPlayerId)return;
    selectedAreas.clear();
    state.lastPlayerId=nextId;
    setLastPlayerId(nextId);
    document.dispatchEvent(new CustomEvent('analysis-player-change-requested',{detail:{playerId:nextId}}));
    modal.querySelector('.shot-close,[data-shot-analysis-close]')?.click();
    setTimeout(()=>{
      const trigger=document.querySelector('[data-open-shot-analysis],#openShotAnalysis');
      if(trigger)trigger.click(); else window.openShotAnalysis?.();
    },80);
  }

  function ensurePlayerSwitcher(modal){
    if(!modal||modal.querySelector('.analysis-player-switcher'))return;
    const current=currentPlayer();
    const wrap=document.createElement('div');
    wrap.className='analysis-player-switcher';
    wrap.innerHTML=`<button type="button" class="analysis-player-button">${esc(playerLabel(current))}</button><div class="analysis-player-menu">${state.players.map(p=>`<button type="button" class="analysis-player-option ${p.id===state.lastPlayerId?'active':''}" data-player-id="${esc(p.id)}">${esc(playerLabel(p))}</button>`).join('')}</div>`;
    const anchor=modal.querySelector('.shot-modal-head')||modal.querySelector('.shot-analysis-head')||modal.firstElementChild;
    if(anchor?.parentElement)anchor.insertAdjacentElement('afterend',wrap); else modal.prepend(wrap);
    const main=wrap.querySelector('.analysis-player-button'),menu=wrap.querySelector('.analysis-player-menu');
    main.onclick=e=>{e.preventDefault();e.stopPropagation();menu.classList.toggle('open')};
    menu.querySelectorAll('[data-player-id]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();menu.classList.remove('open');switchPlayer(modal,btn.dataset.playerId)});
  }

  function ensureStatus(modal){
    let status=modal.querySelector('.analysis-area-selection-status');
    if(!status){status=document.createElement('div');status.className='analysis-area-selection-status';modal.querySelector('#analysisShotCourt')?.insertAdjacentElement('beforebegin',status)}
    if(status)status.textContent=selectedAreas.size?`選択エリア：${[...selectedAreas].map(areaLabel).join(' / ')}（再タップで解除）`:'コートのエリアをタップすると単一・複数エリアを選択できます';
  }

  function courtPoint(event,svg){const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return null;return{x:Math.max(0,Math.min(SHOT_COURT_SIZE.width,(event.clientX-rect.left)/rect.width*SHOT_COURT_SIZE.width)),y:Math.max(0,Math.min(SHOT_COURT_SIZE.height,(event.clientY-rect.top)/rect.height*SHOT_COURT_SIZE.height))}}

  function syncAreaRows(modal){
    modal.classList.toggle('analysis-has-area-selection',selectedAreas.size>0);
    modal.querySelectorAll('[data-analysis-shot-area]').forEach(row=>{
      row.classList.remove('analysis-multi-selected');
      row.classList.toggle('analysis-area-visible',selectedAreas.has(row.dataset.analysisShotArea));
    });
  }

  function syncMarkers(modal){
    const court=modal.querySelector('#analysisShotCourt .shot-court');if(!court)return;
    if(!selectedAreas.size){court.querySelectorAll('.analysis-area-muted').forEach(el=>el.classList.remove('analysis-area-muted'));return}
    const selectedKeys=new Set();
    court.querySelectorAll('.shot-marker').forEach(marker=>{const x=Number(marker.getAttribute('cx')),y=Number(marker.getAttribute('cy'));const selected=selectedAreas.has(detectShotArea(x,y));marker.classList.toggle('analysis-area-muted',!selected);if(selected)selectedKeys.add(pointKey(x,y))});
    court.querySelectorAll('.shot-foul-ring,.shot-selection-ring').forEach(el=>el.classList.toggle('analysis-area-muted',!selectedKeys.has(pointKey(el.getAttribute('cx'),el.getAttribute('cy')))));
  }

  function renderAreaOverlay(modal){
    const svg=modal.querySelector('#analysisShotCourt .shot-court');if(!svg)return;
    svg.querySelector('.analysis-area-overlay')?.remove();
    if(!selectedAreas.size)return;
    const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.setAttribute('class','analysis-area-overlay');
    const step=2;
    for(let y=0;y<SHOT_COURT_SIZE.height;y+=step){for(let x=0;x<SHOT_COURT_SIZE.width;x+=step){const cx=x+step/2,cy=y+step/2;if(!selectedAreas.has(detectShotArea(cx,cy)))continue;const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',String(x));rect.setAttribute('y',String(y));rect.setAttribute('width',String(Math.min(step,SHOT_COURT_SIZE.width-x)+.15));rect.setAttribute('height',String(Math.min(step,SHOT_COURT_SIZE.height-y)+.15));rect.setAttribute('fill','#8b5cf6');rect.setAttribute('fill-opacity','.26');group.appendChild(rect)}}
    const firstMarker=svg.querySelector('.shot-marker,.shot-foul-ring,.shot-selection-ring');if(firstMarker)svg.insertBefore(group,firstMarker);else svg.appendChild(group);
  }

  function applySelection(modal){ensureStatus(modal);syncAreaRows(modal);syncMarkers(modal);renderAreaOverlay(modal);document.dispatchEvent(new CustomEvent('analysis-single-areas-changed',{detail:{areas:[...selectedAreas]}}))}
  function toggleArea(modal,areaId){if(!areaId)return;document.dispatchEvent(new CustomEvent('analysis-composite-reset-requested'));if(selectedAreas.has(areaId))selectedAreas.delete(areaId);else selectedAreas.add(areaId);applySelection(modal)}

  function selectFromCourt(event){
    const svg=event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);if(!svg)return false;
    if(event.target.closest?.('.shot-marker,.shot-foul-ring,.shot-selection-ring'))return false;
    const point=courtPoint(event,svg);if(!point)return false;const areaId=detectShotArea(point.x,point.y);if(!areaId)return false;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();suppressClickUntil=performance.now()+450;toggleArea(svg.closest(MODAL_SELECTOR),areaId);return true;
  }

  document.addEventListener('analysis-composite-activated',()=>{if(!selectedAreas.size)return;selectedAreas.clear();const modal=document.querySelector(MODAL_SELECTOR);if(modal)applySelection(modal)});
  document.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')selectFromCourt(event)},{capture:true,passive:false});
  document.addEventListener('click',event=>{const svg=event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);if(svg&&performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();return}if(event.detail!==0)selectFromCourt(event)},true);
  document.addEventListener('click',event=>{const modal=document.querySelector(MODAL_SELECTOR);const menu=modal?.querySelector('.analysis-player-menu.open');if(menu&&!event.target.closest('.analysis-player-switcher'))menu.classList.remove('open')},true);

  let scheduled=false;
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const modal=document.querySelector(MODAL_SELECTOR);if(!modal)return;if(!modal.querySelector('.analysis-player-switcher'))ensurePlayerSwitcher(modal);if(!modal.querySelector('.analysis-area-selection-status'))ensureStatus(modal);if(selectedAreas.size&&!modal.querySelector('.analysis-area-overlay'))renderAreaOverlay(modal)})});
  observer.observe(document.getElementById('modalRoot')||document.body,{childList:true,subtree:true});
  const init=()=>{const modal=document.querySelector(MODAL_SELECTOR);if(modal){ensurePlayerSwitcher(modal);ensureStatus(modal);applySelection(modal)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
