(() => {
  const SCORE_INPUT_SELECTOR = '#gOwn, #gOppScore, input[id^="qTeam"], input[id^="qOpp"]';
  let focusState = null;
  let restoreTimers = [];

  function isMobileSafariLike() {
    return window.matchMedia?.('(max-width: 800px)').matches;
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
    [80, 180, 350, 550].forEach(delay => {
      restoreTimers.push(setTimeout(restorePosition, delay));
    });
  }

  document.addEventListener('focusin', event => {
    const input = event.target.closest?.(SCORE_INPUT_SELECTOR);
    if (!input || !isMobileSafariLike()) return;

    const card = input.closest('#modalRoot > .modal > .card');
    focusState = {
      input,
      card,
      cardScrollTop: card?.scrollTop || 0,
      windowScrollX: window.scrollX || 0,
      windowScrollY: window.scrollY || 0
    };
    scheduleRestore();
  }, true);

  document.addEventListener('focusout', event => {
    if (!focusState || event.target !== focusState.input) return;
    clearRestoreTimers();
    focusState = null;
  }, true);

  window.visualViewport?.addEventListener('resize', () => {
    if (focusState) scheduleRestore();
  });

  window.visualViewport?.addEventListener('scroll', () => {
    if (focusState) scheduleRestore();
  });
})();
