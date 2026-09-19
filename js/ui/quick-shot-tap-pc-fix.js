(() => {
  // Desktop browsers can occasionally paint the quick-shot buttons a few pixels
  // away from the compositor hit-test layer after the court/type area updates.
  // Resolve the intended button from its visible DOM rectangle as a fallback so
  // the whole painted button remains clickable without affecting nearby controls.
  const BUTTON_SELECTOR = '.quick-shot-modal [data-quick-shot-type]';
  const GRID_SELECTOR = '#quickShotTypeOptions, .shot-type-grid';
  const HOVER_CLASS = 'pc-pointer-hit';
  const VERTICAL_FALLBACK_PX = 24;

  const usable = button => Boolean(
    button &&
    !button.disabled &&
    button.isConnected &&
    typeof button.onclick === 'function'
  );

  const clearSyntheticHover = except => {
    document.querySelectorAll(`${BUTTON_SELECTOR}.${HOVER_CLASS}`).forEach(button => {
      if (button !== except) button.classList.remove(HOVER_CLASS);
    });
  };

  const buttonFromPointer = event => {
    const direct = event.target?.closest?.(BUTTON_SELECTOR);
    if (usable(direct)) return direct;

    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;

    // Never steal a mouse action from another real control below/around the row.
    const interactive = event.target?.closest?.('button,input,label,select,textarea,a');
    if (interactive) return null;

    const modal = document.querySelector('.quick-shot-modal');
    const grid = modal?.querySelector?.(GRID_SELECTOR);
    if (!grid) return null;

    const x = event.clientX;
    const y = event.clientY;
    const gridRect = grid.getBoundingClientRect();
    if (
      x < gridRect.left ||
      x > gridRect.right ||
      y < gridRect.top - 6 ||
      y > gridRect.bottom + VERTICAL_FALLBACK_PX
    ) return null;

    let bestButton = null;
    let bestDistance = Infinity;
    grid.querySelectorAll('[data-quick-shot-type]').forEach(button => {
      if (!usable(button)) return;
      const rect = button.getBoundingClientRect();
      if (x < rect.left || x > rect.right) return;
      const distance = y < rect.top
        ? rect.top - y
        : y > rect.bottom
          ? y - rect.bottom
          : 0;
      if (distance <= VERTICAL_FALLBACK_PX && distance < bestDistance) {
        bestButton = button;
        bestDistance = distance;
      }
    });
    return bestButton;
  };

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const button = buttonFromPointer(event);
    clearSyntheticHover(button);
    button?.classList.add(HOVER_CLASS);
  }, true);

  document.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const button = buttonFromPointer(event);
    if (!usable(button)) return;
    clearSyntheticHover();
    event.preventDefault();
    event.stopImmediatePropagation();
    button.onclick.call(button, event);
  }, {capture:true, passive:false});
})();
