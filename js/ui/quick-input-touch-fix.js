(() => {
  const SELECTOR = [
    '[data-quick-close]',
    '[data-quick-shot-type]',
    '[data-quick-shot-result]',
    '.quick-shot-modal .shot-close'
  ].join(',');
  const MOVE_TOLERANCE_PX = 14;
  let active = null;

  const style = document.createElement('style');
  style.textContent = `
    ${SELECTOR} {
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-user-select: none !important;
      user-select: none !important;
    }
    .quick-shot-modal [data-quick-shot-type],
    .quick-shot-modal [data-quick-shot-result] {
      position: relative;
      z-index: 3;
      min-height: 48px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  function controlFrom(target) {
    const control = target?.closest?.(SELECTOR);
    if (!control || control.disabled || !control.isConnected) return null;
    return control;
  }

  document.addEventListener('pointerdown', event => {
    const control = controlFrom(event.target);
    if (!control || event.button > 0) return;
    active = {
      pointerId: event.pointerId,
      control,
      x: event.clientX,
      y: event.clientY
    };
  }, true);

  document.addEventListener('pointermove', event => {
    if (!active || active.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > MOVE_TOLERANCE_PX) active = null;
  }, true);

  document.addEventListener('pointercancel', event => {
    if (active?.pointerId === event.pointerId) active = null;
  }, true);

  document.addEventListener('pointerup', event => {
    if (!active || active.pointerId !== event.pointerId) return;
    const { control } = active;
    active = null;
    if (!control.isConnected || control.disabled) return;

    event.preventDefault();
    control.click();
  }, { capture: true, passive: false });
})();
