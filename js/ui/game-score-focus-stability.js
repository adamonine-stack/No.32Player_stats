(() => {
  const SCORE_INPUT_SELECTOR = '#gOwn, #gOppScore, input[id^="qTeam"], input[id^="qOpp"]';

  function prepareScoreInput(input) {
    if (!(input instanceof HTMLInputElement)) return;

    /*
     * iOS Safariはtype=numberの入力欄で独自のフォーカス拡大を行うことがある。
     * 値の保存処理は文字列でも既存のnum()で数値化されるため、
     * UI上はtext + numeric inputmodeへ変更して数値キーボードを使用する。
     */
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.autocomplete = 'off';
    input.enterKeyHint = 'done';
    input.setAttribute('aria-label', input.getAttribute('aria-label') || 'スコア');
    input.style.setProperty('font-size', '18px', 'important');
    input.style.setProperty('line-height', '1.25', 'important');
    input.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
    input.dataset.iosScorePrepared = 'true';

    input.addEventListener('input', () => {
      const sanitized = input.value.replace(/[^0-9]/g, '');
      if (input.value !== sanitized) input.value = sanitized;
    });
  }

  function prepareAll(root = document) {
    root.querySelectorAll?.(SCORE_INPUT_SELECTOR).forEach(input => {
      if (input.dataset.iosScorePrepared !== 'true') prepareScoreInput(input);
    });
  }

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.(SCORE_INPUT_SELECTOR)) prepareScoreInput(node);
        prepareAll(node);
      }
    }
  });

  function start() {
    prepareAll();
    observer.observe(document.querySelector('#modalRoot') || document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
