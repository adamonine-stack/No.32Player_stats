(() => {
  const ROWS = [
    ['FTA', 'FTM'],
    ['FOUL', '被FOUL'],
    ['AST', 'BLK'],
    ['OR', 'DR'],
    ['ドリブルカット', 'パスカット', 'その他STL'],
    ['パスミス', 'ドリブルミス', 'キャッチミス'],
    ['バイオレーション', 'その他TO']
  ];

  const style = document.createElement('style');
  style.textContent = `
    .stats-form-compact .stats-unified-card{display:flex;flex-direction:column;gap:3px;margin:3px 0 4px!important;padding:5px 6px!important;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(12,12,12,.72);box-sizing:border-box}
    .stats-form-compact .stats-unified-row{display:grid;gap:5px;align-items:end;min-width:0}
    .stats-form-compact .stats-unified-row.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
    .stats-form-compact .stats-unified-row.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
    .stats-form-compact .stats-unified-card label.stat-counter-enhanced{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;font-size:10.5px!important;line-height:1!important;grid-column:auto!important}
    .stats-form-compact .stats-unified-card .stat-counter-control{grid-template-columns:38px minmax(28px,1fr) 38px!important;width:100%!important;min-height:35px!important;height:35px!important;margin-top:1px!important;border-radius:9px!important}
    .stats-form-compact .stats-unified-card .stat-counter-button{min-width:38px!important;min-height:35px!important;height:35px!important;font-size:21px!important}
    .stats-form-compact .stats-unified-card .stat-counter-value{font-size:18px!important;padding:0 1px!important}
    .stats-form-compact .stats-unified-row.cols-3 label.stat-counter-enhanced{font-size:9.5px!important;white-space:nowrap}
    .stats-form-compact .stats-unified-row.cols-3 .stat-counter-control{grid-template-columns:30px minmax(24px,1fr) 30px!important}
    .stats-form-compact .stats-unified-row.cols-3 .stat-counter-button{min-width:30px!important;font-size:19px!important}
    @media(max-width:380px){.stats-form-compact .stats-unified-card{gap:2px;padding:4px!important}.stats-form-compact .stats-unified-row{gap:3px}.stats-form-compact .stats-unified-row.cols-3 label.stat-counter-enhanced{font-size:8.5px!important}.stats-form-compact .stats-unified-row.cols-3 .stat-counter-control{grid-template-columns:27px minmax(21px,1fr) 27px!important}.stats-form-compact .stats-unified-row.cols-3 .stat-counter-button{min-width:27px!important;font-size:18px!important}}
  `;
  document.head.appendChild(style);

  function normalizedText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('input,button,select,textarea,.stat-counter-control').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function findStatsCard() {
    const actions = document.querySelector('.stats-form-actions');
    return actions?.closest('.card') || actions?.parentElement || null;
  }

  function labelsByName(root) {
    const map = new Map();
    root.querySelectorAll('label.stat-counter-enhanced').forEach(label => map.set(normalizedText(label), label));
    return map;
  }

  function unifiedIsCurrent(unified) {
    if (!unified) return false;
    const rows = [...unified.querySelectorAll(':scope > .stats-unified-row')];
    if (rows.length !== ROWS.length) return false;
    return ROWS.every((names, index) => {
      const labels = [...rows[index].querySelectorAll(':scope > label')];
      return labels.length === names.length && names.every((name, i) => normalizedText(labels[i]) === name.toUpperCase());
    });
  }

  function buildUnifiedCard(card) {
    const body = card.querySelector('#sfBody');
    if (!body) return;

    let unified = body.querySelector(':scope > .stats-unified-card');
    if (unifiedIsCurrent(unified)) return;

    const labels = labelsByName(body);
    if (!ROWS.flat().every(name => labels.has(name.toUpperCase()))) return;

    if (!unified) {
      unified = document.createElement('div');
      unified.className = 'stats-unified-card';
    }
    unified.replaceChildren();

    ROWS.forEach(names => {
      const row = document.createElement('div');
      row.className = `stats-unified-row cols-${names.length}`;
      names.forEach(name => row.appendChild(labels.get(name.toUpperCase())));
      unified.appendChild(row);
    });

    /* Keep the unified fields inside #sfBody. When the selected player changes,
       app.js replaces #sfBody, so these inputs are replaced with that player's
       own inputs instead of surviving across players. */
    body.appendChild(unified);
  }

  function removeEmptyWrappers(card) {
    const body = card.querySelector('#sfBody');
    if (!body) return;
    [...body.querySelectorAll('.grid,div,section')].forEach(element => {
      if (element === body || element.classList.contains('stats-unified-card') || element.querySelector('.stats-unified-card')) return;
      if (element.children.length === 0 && !element.textContent.trim()) element.remove();
    });
  }

  function applyAdjustments() {
    const card = findStatsCard();
    if (!card) return;
    card.classList.add('stats-form-compact');
    buildUnifiedCard(card);
    removeEmptyWrappers(card);
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyAdjustments();
    });
  }

  const observer = new MutationObserver(scheduleApply);
  document.addEventListener('DOMContentLoaded', () => {
    scheduleApply();
    observer.observe(document.body, { childList:true, subtree:true });
  }, { once:true });
})();
