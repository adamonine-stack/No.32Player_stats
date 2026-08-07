(() => {
  const style = document.createElement('style');
  style.textContent = `
    #modalRoot .team-shot-analysis-modal .team-shot-analysis-filter-row [data-team-filter].active,
    #modalRoot .team-shot-analysis-modal .team-shot-analysis-filter-row [data-team-filter][aria-pressed="true"] {
      background: linear-gradient(135deg, #8a2be2, #6514cb) !important;
      border-color: #c4b5fd !important;
      color: #fff !important;
      box-shadow: inset 0 0 0 2px #a78bfa !important;
      opacity: 1 !important;
    }

    #modalRoot .team-shot-analysis-modal .team-shot-analysis-filter-row [data-team-filter]:not(.active) {
      background: rgba(255,255,255,.08) !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);

  function syncAria(root = document) {
    root.querySelectorAll?.('#modalRoot .team-shot-analysis-modal [data-team-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
  }

  const observer = new MutationObserver(records => {
    if (!records.some(record => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      return target?.closest?.('#modalRoot .team-shot-analysis-modal');
    })) return;
    syncAria();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => syncAria(), { once: true });
  else syncAria();
})();
