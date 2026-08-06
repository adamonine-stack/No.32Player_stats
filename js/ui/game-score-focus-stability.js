(() => {
  const SCORE_INPUT_SELECTOR = '#gOwn, #gOppScore, input[id^="qTeam"], input[id^="qOpp"]';
  const NORMAL_VIEWPORT = 'width=device-width,initial-scale=1,viewport-fit=cover';
  const LOCKED_VIEWPORT = 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  let focusState = null;
  let restoreTimers = [];
  let viewportRestoreTimer = null;

  function isMobileLayout() {
    return window.matchMedia?.('(max-width: 800px)').matches;
  }

  function viewportMeta() {
    return document.querySelector('meta[name="viewport"]');
  }

  function lockViewportBeforeFocus() {
    if (!isMobileLayout()) return;
    const meta = viewportMeta();
    if (meta) meta.setAttribute('content', LOCKED_VIEWPORT);
  }

  function resetViewportAfterInput() {
    const meta = viewportMeta();
    if (!meta) return;
    clearTimeout(viewportRestoreTimer);

    /* First force the visual viewport back to scale 1, then restore normal pinch zoom. */
    meta.setAttribute('content', LOCKED_VIEWPORT);
    window.scrollTo(focusState?.windowScrollX || 0, focusState?.windowScrollY || 0);
    viewportRestoreTimer = setTimeout(() => {
      meta.setAttribute('content', NORMAL_VIEWPORT);
      window.scrollTo(focusState?.windowScrollX || 0, focusState?.windowScrollY || 0);
    }, 320);
  }

  function prepareScoreInput(input) {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
    input.setAttribute('enterkeyhint', 'done');
    input.style.fontSize = '18px';
  }

  function clearRestoreTimers() {
    restoreTimers.forEach(timer => clearTimeout(timer));
    restoreTimers = [];
  }

  function restorePosition() {
    if (!focusState) return;
    const { card, cardScrollTop, windowScrollX, windowScrollY } = focusState;
    if (card?.isConnected) card.scrollTop = cardScrollTop;
    window.scrollTo(windowScrollX, windowScrollY);
  }

  function scheduleRestore() {
    clearRestoreTimers();
    requestAnimationFrame(() => {
      restorePosition();
      requestAnimationFrame(restorePosition);
    });
    [60, 140, 260, 420, 650].forEach(delay => {
      restoreTimers.push(setTimeout(restorePosition, delay));
    });
  }

  function captureBeforeFocus(input) {
    if (!input || !isMobileLayout()) return;
    prepareScoreInput(input);
    lockViewportBeforeFocus();
    const card = input.closest('#modalRoot > .modal > .card');
    focusState = {
      input,
      card,
      cardScrollTop: card?.scrollTop || 0,
      windowScrollX: window.scrollX || 0,
      windowScrollY: window.scrollY || 0
    };
  }

  function preFocusHandler(event) {
    const input = event.target.closest?.(SCORE_INPUT_SELECTOR);
    if (input) captureBeforeFocus(input);
  }

  document.addEventListener('pointerdown', preFocusHandler, true);
  document.addEventListener('touchstart', preFocusHandler, { capture: true, passive: true });

  document.addEventListener('focusin', event => {
    const input = event.target.closest?.(SCORE_INPUT_SELECTOR);
    if (!input || !isMobileLayout()) return;
    if (!focusState || focusState.input !== input) captureBeforeFocus(input);
    lockViewportBeforeFocus();
    scheduleRestore();
  }, true);

  document.addEventListener('focusout', event => {
    if (!focusState || event.target !== focusState.input) return;
    const savedState = focusState;
    clearRestoreTimers();
    resetViewportAfterInput();
    [80, 220, 420].forEach(delay => setTimeout(() => {
      if (savedState.card?.isConnected) savedState.card.scrollTop = savedState.cardScrollTop;
      window.scrollTo(savedState.windowScrollX, savedState.windowScrollY);
    }, delay));
    setTimeout(() => { focusState = null; }, 500);
  }, true);

  window.visualViewport?.addEventListener('resize', () => {
    if (focusState) scheduleRestore();
  });

  window.visualViewport?.addEventListener('scroll', () => {
    if (focusState) scheduleRestore();
  });

  const observer = new MutationObserver(() => {
    document.querySelectorAll(SCORE_INPUT_SELECTOR).forEach(prepareScoreInput);
  });

  function start() {
    document.querySelectorAll(SCORE_INPUT_SELECTOR).forEach(prepareScoreInput);
    observer.observe(document.querySelector('#modalRoot') || document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
