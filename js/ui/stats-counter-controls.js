(() => {
  const EXCLUDED_LABELS = new Set(['2PA', '2PM', '3PA', '3PM']);
  const PURPLE = '#a855f7';

  const style = document.createElement('style');
  style.textContent = `
    .stat-counter-enhanced { position:relative; display:block!important; min-width:0; }
    .stat-counter-enhanced input[type="number"],
    .stat-counter-enhanced button:not(.stat-counter-button),
    .stat-counter-enhanced .number-stepper,
    .stat-counter-enhanced .input-stepper,
    .stat-counter-enhanced .stepper-buttons,
    .stat-counter-enhanced .number-controls,
    .stat-counter-enhanced .spin-buttons { display:none!important; }
    .stat-counter-control { position:relative; z-index:2; display:grid!important; grid-template-columns:44px minmax(40px,1fr) 44px; align-items:center; width:100%; min-height:42px; margin-top:2px; border:1px solid rgba(255,255,255,.22); border-radius:11px; background:rgba(0,0,0,.34); overflow:hidden; box-sizing:border-box; pointer-events:auto; }
    .stat-counter-button { position:relative; z-index:3; display:flex!important; align-items:center; justify-content:center; appearance:none; border:0; background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:24px; font-weight:600; line-height:1; width:100%; min-width:44px; min-height:42px; padding:0; cursor:pointer; touch-action:manipulation; pointer-events:auto!important; -webkit-tap-highlight-color:transparent; }
    .stat-counter-button:first-child { border-right:1px solid rgba(255,255,255,.15); }
    .stat-counter-button:last-child { border-left:1px solid rgba(255,255,255,.15); }
    .stat-counter-button:active { background:rgba(124,58,237,.38); }
    .stat-counter-button:disabled { opacity:.28; cursor:default; }
    .stat-counter-value { display:flex; align-items:center; justify-content:center; min-width:0; height:100%; padding:0 4px; color:#fff; font-size:21px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1; transition:color .12s ease; user-select:none; pointer-events:none; -webkit-user-select:none; }
    .stat-counter-value.is-increased { color:var(--accent,#ff8a00); }
    .stat-counter-value.is-decreased { color:${PURPLE}; }
    .stat-counter-value.is-unchanged { color:#fff; }
    .stats-form-compact { padding:10px 12px 12px!important; }
    .stats-form-compact h2,.stats-form-compact h3 { margin-top:0!important; margin-bottom:6px!important; line-height:1.2!important; }
    .stats-form-compact .grid { gap:4px 10px!important; }
    .stats-form-compact label { position:relative; z-index:1; margin:0!important; line-height:1.05!important; font-size:12px!important; }
    .stats-form-compact select,.stats-form-compact input:not([type="number"]) { min-height:38px!important; height:38px!important; padding-top:5px!important; padding-bottom:5px!important; }
    .stats-form-compact .seg,.stats-form-compact [class*="segment"] { margin-top:3px!important; margin-bottom:4px!important; }
    .stats-form-compact .seg button,.stats-form-compact [class*="segment"] button { min-height:38px!important; padding-top:5px!important; padding-bottom:5px!important; }
    .stats-form-compact .shot-registration-button,.stats-form-compact button[data-open-shot-registration],.stats-form-compact button[id*="shot" i]:not(.stat-counter-button),.stats-form-compact button[class*="shot" i]:not(.stat-counter-button) { min-height:46px!important; margin-top:5px!important; margin-bottom:6px!important; padding-top:7px!important; padding-bottom:7px!important; }
    .stats-form-compact .stats-form-actions { position:relative; z-index:1; margin-top:7px!important; padding-top:0!important; gap:7px!important; }
    .stats-form-compact .stats-form-actions .btn,.stats-form-compact .stats-form-actions button { min-height:44px!important; padding-top:7px!important; padding-bottom:7px!important; }
    .stats-form-compact .stat-counter-enhanced { padding:0!important; }
    @media (max-width:600px) {
      .stats-form-compact { padding:7px 9px 9px!important; }
      .stats-form-compact .grid { gap:2px 8px!important; }
      .stats-form-compact label { font-size:11.5px!important; }
      .stat-counter-control { grid-template-columns:44px minmax(34px,1fr) 44px; min-height:39px; margin-top:1px; border-radius:10px; }
      .stat-counter-button { min-width:44px; min-height:39px; font-size:23px; }
      .stat-counter-value { font-size:20px; padding-inline:2px; }
      .stats-form-compact select,.stats-form-compact input:not([type="number"]) { min-height:36px!important; height:36px!important; }
      .stats-form-compact .shot-registration-button,.stats-form-compact button[data-open-shot-registration],.stats-form-compact button[id*="shot" i]:not(.stat-counter-button),.stats-form-compact button[class*="shot" i]:not(.stat-counter-button) { min-height:42px!important; margin-top:3px!important; margin-bottom:4px!important; }
      .stats-form-compact .stats-form-actions { margin-top:5px!important; }
    }
  `;
  document.head.appendChild(style);

  function normalizedLabel(label) {
    const clone = label.cloneNode(true);
    clone.querySelectorAll('input, button, select, textarea, .stat-counter-control').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function statsActions() { return document.querySelector('.stats-form-actions'); }
  function isStatsForm() { return Boolean(statsActions()); }
  function statsCard() { return statsActions()?.closest('.card') || statsActions()?.parentElement || null; }

  function removeShotMethodExplanation(card) {
    if (!card) return;
    const phrases = ['方式を切り替えて保存すると','その方式の非FTシュートデータを使用します','シュート登録方式の説明'];
    [...card.querySelectorAll('p, small, .help, .hint, .muted, .note')].forEach(element => {
      const text = element.textContent.replace(/\s+/g, ' ').trim();
      if (phrases.some(phrase => text.includes(phrase))) element.remove();
    });
  }

  function prepareCompactStatsForm() {
    const card = statsCard();
    if (!card) return;
    card.classList.add('stats-form-compact');
    removeShotMethodExplanation(card);
  }

  function shouldEnhance(input) {
    if (!isStatsForm() || input.dataset.counterEnhanced === 'true' || input.disabled || input.readOnly) return false;
    const label = input.closest('label');
    if (!label) return false;
    return !EXCLUDED_LABELS.has(normalizedLabel(label));
  }

  function numericValue(input) {
    const parsed = Number(input?.value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  function controlForInput(input) {
    const label = input?.closest('label.stat-counter-enhanced');
    return label?.querySelector('.stat-counter-control') || null;
  }

  function updateVisual(input) {
    const control = controlForInput(input);
    if (!control) return;
    const current = numericValue(input);
    const baseline = Number(input.dataset.counterBaseline || 0);
    const value = control.querySelector('.stat-counter-value');
    const minus = control.querySelector('.stat-counter-minus');
    input.value = String(current);
    if (value) {
      value.textContent = String(current);
      value.classList.toggle('is-increased', current > baseline);
      value.classList.toggle('is-decreased', current < baseline);
      value.classList.toggle('is-unchanged', current === baseline);
    }
    if (minus) minus.disabled = current <= 0;
  }

  function inputForButton(button) {
    return button.closest('label.stat-counter-enhanced')?.querySelector('input[type="number"]') || null;
  }

  function changeValue(input, delta) {
    const current = numericValue(input);
    const next = Math.max(0, current + delta);
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    updateVisual(input);
  }

  function enhanceInput(input) {
    if (!shouldEnhance(input)) return;
    input.dataset.counterEnhanced = 'true';
    input.dataset.counterBaseline = String(numericValue(input));
    const label = input.closest('label');
    label.classList.add('stat-counter-enhanced');
    const control = document.createElement('div');
    control.className = 'stat-counter-control';
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', `${normalizedLabel(label)}の数値変更`);
    control.innerHTML = '<button type="button" class="stat-counter-button stat-counter-minus" aria-label="1減らす">−</button><span class="stat-counter-value is-unchanged" aria-live="polite"></span><button type="button" class="stat-counter-button stat-counter-plus" aria-label="1増やす">＋</button>';
    label.appendChild(control);
    updateVisual(input);
  }

  function enhanceAll(root = document) {
    if (!isStatsForm()) return;
    prepareCompactStatsForm();
    root.querySelectorAll?.('input[type="number"]').forEach(enhanceInput);
  }

  function resetBaselinesAfterSave() {
    if (!isStatsForm()) return;
    document.querySelectorAll('input[data-counter-enhanced="true"]').forEach(input => {
      input.dataset.counterBaseline = String(numericValue(input));
      updateVisual(input);
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.stats-form-compact .stat-counter-button');
    if (!button) return;
    const input = inputForButton(button);
    if (!input) return;
    event.preventDefault();
    const delta = button.classList.contains('stat-counter-plus') ? 1 : -1;
    changeValue(input, delta);
  });

  document.addEventListener('input', event => {
    if (event.target.matches?.('input[data-counter-enhanced="true"]')) updateVisual(event.target);
  });

  document.addEventListener('change', event => {
    if (event.target.matches?.('input[data-counter-enhanced="true"]')) updateVisual(event.target);
  });

  const mutationObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) enhanceAll(node);
      }
    }
    enhanceAll();
  });

  const toastObserver = new MutationObserver(() => {
    const toast = document.querySelector('#toast');
    if (toast?.classList.contains('show') && toast.textContent.trim() === '保存しました') resetBaselinesAfterSave();
  });

  document.addEventListener('DOMContentLoaded', () => {
    enhanceAll();
    mutationObserver.observe(document.body, { childList:true, subtree:true });
    const toast = document.querySelector('#toast');
    if (toast) toastObserver.observe(toast, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
  });
})();
