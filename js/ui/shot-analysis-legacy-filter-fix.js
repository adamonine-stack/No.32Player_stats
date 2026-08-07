(() => {
  const LEGACY_FILTER_SELECTOR = '#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal) [data-shot-analysis-filter]';
  let syntheticClick = false;
  let suppressNativeClickUntil = 0;
  let lastButton = null;

  const style = document.createElement('style');
  style.textContent = `
    #modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal) #analysisQuickFilters,
    #modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal) .shot-analysis-filter-row {
      position: relative;
      z-index: 15;
      pointer-events: auto !important;
    }
    #modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal) [data-shot-analysis-filter] {
      position: relative;
      z-index: 16;
      pointer-events: auto !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  document.head.appendChild(style);

  function legacyFilterButton(target) {
    return target?.closest?.(LEGACY_FILTER_SELECTOR) || null;
  }

  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    const button = legacyFilterButton(event.target);
    if (!button || button.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    lastButton = button;
    suppressNativeClickUntil = performance.now() + 500;
    syntheticClick = true;
    button.click();
    syntheticClick = false;
  }, { capture: true, passive: false });

  document.addEventListener('click', event => {
    const button = legacyFilterButton(event.target);
    if (!button) return;
    if (syntheticClick) return;

    if (button === lastButton && performance.now() < suppressNativeClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
      lastButton = null;
      suppressNativeClickUntil = 0;
    }
  }, true);
})();
