// Keyboard input is another way to click the existing quick-entry controls.
(() => {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  const desktop = matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
  const scopeSelector = '.modal[data-quick-keyboard="true"]';
  const choices = '[data-quick-player],[data-quick-action],[data-quick-detail],[data-quick-shot-type],[data-quick-shot-result],[data-assist-player],[data-ft-attempts],[data-ft-made],#saveQuickFt,#quickShotFoul';
  const backSelector = '#quickBack,#quickActionBack,#assistBack,.shot-close';
  const editingSelector = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="spinbutton"]';
  let decorated = [];
  const held = new Set();
  const eventKey = event => /^Numpad[0-9]$/.test(event.code) ? event.code.slice(-1) : event.key;

  function available(control) {
    return control.isConnected && !control.matches(':disabled') &&
      !control.closest('[hidden],[inert],[aria-hidden="true"],[aria-disabled="true"]') &&
      control.getClientRects().length > 0 &&
      getComputedStyle(control).visibility === 'visible';
  }

  function targets(scope) {
    if (!scope || !desktop.matches) return [];
    const primary = [...scope.querySelectorAll(choices)];
    const secondary = [...scope.querySelectorAll('button')].filter(button => !primary.includes(button));
    // No pagination or roster changes: additional controls remain clickable.
    return [...primary, ...secondary].filter(available).slice(0, 10);
  }

  function refresh() {
    observer.disconnect();
    decorated.forEach(control => control.removeAttribute('data-quick-key'));
    const scope = root.querySelector(scopeSelector);
    decorated = targets(scope).map((control, index) => {
      const host = control.id === 'quickShotFoul' ? control.closest('label') : control;
      host.setAttribute('data-quick-key', String((index + 1) % 10));
      return host;
    });
    observer.observe(root, {subtree: true, childList: true, attributes: true,
      attributeFilter: ['disabled', 'hidden', 'class', 'style', 'inert', 'aria-hidden', 'aria-disabled', 'data-quick-keyboard']});
  }

  function feedback(control) {
    document.querySelectorAll('.quick-keyboard-pressed').forEach(flash => flash.remove());
    const host = control.id === 'quickShotFoul' ? control.closest('label') : control;
    const box = host.getBoundingClientRect();
    const flash = document.createElement('div');
    flash.className = 'quick-keyboard-pressed';
    flash.setAttribute('aria-hidden', 'true');
    Object.assign(flash.style, {left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`});
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 120);
  }

  document.addEventListener('keydown', event => {
    const key = eventKey(event);
    if (!/^[0-9]$/.test(key) && key !== 'Escape') return;
    const alreadyHeld = held.has(key);
    held.add(key);
    if (event.defaultPrevented || event.repeat || alreadyHeld || event.isComposing ||
        event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ||
        !desktop.matches || !document.hasFocus() || document.visibilityState !== 'visible' ||
        event.target?.closest?.(editingSelector) || document.activeElement?.closest?.(editingSelector)) return;
    const scope = root.querySelector(scopeSelector);
    if (!scope || scope.querySelector('[role="dialog"],dialog[open],[aria-modal="true"]')) return;
    const control = key === 'Escape'
      ? [...scope.querySelectorAll(backSelector)].find(available)
      : targets(scope)[key === '0' ? 9 : Number(key) - 1];
    if (!control) return;
    event.preventDefault();
    feedback(control);
    control.click();
  });
  document.addEventListener('keyup', event => held.delete(eventKey(event)));
  window.addEventListener('blur', () => held.clear());
  document.addEventListener('visibilitychange', () => held.clear());
  window.addEventListener('resize', refresh);
  desktop.addEventListener('change', refresh);
  const observer = new MutationObserver(refresh);
  refresh();
})();
