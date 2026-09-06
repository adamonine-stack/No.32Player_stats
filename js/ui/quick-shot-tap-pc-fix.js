(() => {
  // PC pointer activation for the under-basket "tap" shot type.
  // The quick-shot modal redraws itself when a type is selected. On some desktop
  // browsers the normal click can be lost during that redraw, so invoke the
  // already-bound handler directly on pointer release.
  document.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const button = event.target?.closest?.('.quick-shot-modal [data-quick-shot-type="tap"]');
    if (!button || button.disabled || !button.isConnected || typeof button.onclick !== 'function') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.onclick.call(button, event);
  }, {capture:true, passive:false});
})();