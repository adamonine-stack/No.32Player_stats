(() => {
  const SCORE_INPUT_SELECTOR = '#gOwn, #gOppScore, input[id^="qTeam"], input[id^="qOpp"]';
  const MOBILE_QUERY = '(max-width: 800px)';
  let activeInput = null;
  let keypad = null;

  function isMobile() {
    return window.matchMedia?.(MOBILE_QUERY).matches;
  }

  function emitValueChange(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setValue(nextValue) {
    if (!activeInput) return;
    const normalized = String(nextValue ?? '').replace(/\D/g, '').slice(0, 3);
    activeInput.value = normalized;
    emitValueChange(activeInput);
  }

  function closeKeypad() {
    keypad?.remove();
    keypad = null;
    activeInput?.classList.remove('score-keypad-active');
    activeInput = null;
    document.body.classList.remove('score-keypad-open');
  }

  function buildKeypad() {
    const root = document.createElement('div');
    root.className = 'score-keypad';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'スコア入力');
    root.innerHTML = `
      <div class="score-keypad__panel">
        <div class="score-keypad__display" aria-live="polite"></div>
        <div class="score-keypad__grid">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" data-key="${n}">${n}</button>`).join('')}
          <button type="button" class="score-keypad__clear" data-action="clear">クリア</button>
          <button type="button" data-key="0">0</button>
          <button type="button" class="score-keypad__back" data-action="backspace">⌫</button>
        </div>
        <button type="button" class="score-keypad__done" data-action="done">入力完了</button>
      </div>`;

    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !activeInput) return;
      const key = button.dataset.key;
      const action = button.dataset.action;
      if (key !== undefined) setValue(`${activeInput.value || ''}${key}`);
      if (action === 'clear') setValue('');
      if (action === 'backspace') setValue(String(activeInput.value || '').slice(0, -1));
      if (action === 'done') closeKeypad();
      updateDisplay();
    });
    return root;
  }

  function updateDisplay() {
    const display = keypad?.querySelector('.score-keypad__display');
    if (display) display.textContent = activeInput?.value || '0';
  }

  function openKeypad(input) {
    if (!isMobile()) return;
    if (activeInput && activeInput !== input) activeInput.classList.remove('score-keypad-active');
    activeInput = input;
    activeInput.classList.add('score-keypad-active');
    activeInput.blur();
    if (!keypad) {
      keypad = buildKeypad();
      document.body.appendChild(keypad);
    }
    document.body.classList.add('score-keypad-open');
    updateDisplay();
  }

  function prepareInput(input) {
    if (input.dataset.customScoreKeypad === 'true') return;
    input.dataset.customScoreKeypad = 'true';
    input.readOnly = true;
    input.setAttribute('inputmode', 'none');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-haspopup', 'dialog');

    const open = event => {
      if (!isMobile()) return;
      event.preventDefault();
      event.stopPropagation();
      openKeypad(input);
    };
    input.addEventListener('pointerdown', open, { capture: true });
    input.addEventListener('click', open, { capture: true });
  }

  function prepareAll() {
    document.querySelectorAll(SCORE_INPUT_SELECTOR).forEach(prepareInput);
    if (!document.querySelector('#modalRoot > .modal')) closeKeypad();
  }

  const observer = new MutationObserver(prepareAll);
  function start() {
    prepareAll();
    observer.observe(document.querySelector('#modalRoot') || document.body, { childList: true, subtree: true });
    window.matchMedia?.(MOBILE_QUERY).addEventListener?.('change', event => {
      if (!event.matches) closeKeypad();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
