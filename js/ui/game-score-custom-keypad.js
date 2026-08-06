(() => {
  const SCORE_INPUT_SELECTOR = '#gOwn, #gOppScore, input[id^="qTeam"], input[id^="qOpp"]';
  const MOBILE_QUERY = '(max-width: 800px)';
  let activeInput = null;
  let keypad = null;

  function isMobile() {
    return Boolean(window.matchMedia?.(MOBILE_QUERY).matches);
  }

  function scoreInputFromTarget(target) {
    return target instanceof Element ? target.closest(SCORE_INPUT_SELECTOR) : null;
  }

  function emitValueChange(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setValue(nextValue) {
    if (!activeInput?.isConnected) return;
    activeInput.value = String(nextValue ?? '').replace(/\D/g, '').slice(0, 3);
    emitValueChange(activeInput);
    updateDisplay();
  }

  function closeKeypad() {
    keypad?.remove();
    keypad = null;
    activeInput?.classList.remove('score-keypad-active');
    activeInput = null;
    document.body.classList.remove('score-keypad-open');
  }

  function updateDisplay() {
    const display = keypad?.querySelector('.score-keypad__display');
    if (display) display.textContent = activeInput?.value || '0';
  }

  function buildKeypad() {
    const root = document.createElement('div');
    root.className = 'score-keypad';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'スコア入力');
    root.innerHTML = `
      <div class="score-keypad__panel">
        <div class="score-keypad__display" aria-live="polite">0</div>
        <div class="score-keypad__grid">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" data-key="${n}">${n}</button>`).join('')}
          <button type="button" class="score-keypad__clear" data-action="clear">クリア</button>
          <button type="button" data-key="0">0</button>
          <button type="button" class="score-keypad__back" data-action="backspace">⌫</button>
        </div>
        <button type="button" class="score-keypad__done" data-action="done">入力完了</button>
      </div>`;

    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !activeInput) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.key !== undefined) setValue(`${activeInput.value || ''}${button.dataset.key}`);
      if (button.dataset.action === 'clear') setValue('');
      if (button.dataset.action === 'backspace') setValue(String(activeInput.value || '').slice(0, -1));
      if (button.dataset.action === 'done') closeKeypad();
    });
    return root;
  }

  function prepareInput(input) {
    if (!input || !isMobile()) return;
    input.dataset.customScoreKeypad = 'true';
    input.type = 'text';
    input.readOnly = true;
    input.setAttribute('inputmode', 'none');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-haspopup', 'dialog');
    input.style.fontSize = '18px';
  }

  function openKeypad(input) {
    if (!input || !isMobile()) return;
    prepareInput(input);
    if (document.activeElement === input) input.blur();
    activeInput?.classList.remove('score-keypad-active');
    activeInput = input;
    activeInput.classList.add('score-keypad-active');
    if (!keypad) {
      keypad = buildKeypad();
      document.body.appendChild(keypad);
    }
    document.body.classList.add('score-keypad-open');
    updateDisplay();
  }

  function interceptScoreInput(event) {
    const input = scoreInputFromTarget(event.target);
    if (!input || !isMobile()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openKeypad(input);
  }

  document.addEventListener('touchstart', interceptScoreInput, { capture: true, passive: false });
  document.addEventListener('pointerdown', interceptScoreInput, true);
  document.addEventListener('click', interceptScoreInput, true);
  document.addEventListener('focusin', event => {
    const input = scoreInputFromTarget(event.target);
    if (!input || !isMobile()) return;
    input.blur();
    openKeypad(input);
  }, true);

  function prepareAll() {
    document.querySelectorAll(SCORE_INPUT_SELECTOR).forEach(prepareInput);
    if (!document.querySelector('#modalRoot > .modal')) closeKeypad();
  }

  const observer = new MutationObserver(prepareAll);
  function start() {
    prepareAll();
    observer.observe(document.querySelector('#modalRoot') || document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
