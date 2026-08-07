(() => {
  const CLOSE_SELECTOR = '#modalRoot .shot-analysis-modal .shot-close';

  function closeShotAnalysisModal(event) {
    const button = event?.target?.closest?.(CLOSE_SELECTOR);
    if (!button) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const modalRoot = document.querySelector('#modalRoot');
    if (!modalRoot) return true;

    const bodyTop = parseFloat(document.body.style.top || '0');
    const restoreY = Number.isFinite(bodyTop) && bodyTop < 0 ? Math.abs(bodyTop) : window.scrollY;

    modalRoot.innerHTML = '';
    document.body.classList.remove('bg-login', 'bg-input', 'modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.style.top = '';

    requestAnimationFrame(() => window.scrollTo(0, restoreY));
    return true;
  }

  const style = document.createElement('style');
  style.textContent = `
    #modalRoot .shot-analysis-modal .shot-modal-head {
      position: relative;
      z-index: 20;
    }
    #modalRoot .shot-analysis-modal .shot-close {
      position: relative;
      z-index: 21;
      pointer-events: auto !important;
      touch-action: manipulation;
      flex: 0 0 auto;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('pointerup', event => {
    closeShotAnalysisModal(event);
  }, true);

  document.addEventListener('click', event => {
    closeShotAnalysisModal(event);
  }, true);
})();
