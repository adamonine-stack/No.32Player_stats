(() => {
  const openState = {
    analysis: false,
    team: false,
  };

  const inputIdForScope = scope => scope === 'team' ? 'teamTarget' : 'statTarget';

  function calendarForScope(scope) {
    return document.querySelector(`[data-calendar-scope="${scope}"]`);
  }

  function setCalendarOpen(scope, isOpen) {
    openState[scope] = isOpen;
    const calendar = calendarForScope(scope);
    if (calendar) {
      calendar.hidden = !isOpen;
      calendar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    const input = document.getElementById(inputIdForScope(scope));
    if (input) input.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function prepareDateTarget(scope) {
    const input = document.getElementById(inputIdForScope(scope));
    const calendar = calendarForScope(scope);
    if (!input || !calendar) return;

    // ブラウザ標準の日付ピッカーを表示させず、R32独自カレンダーだけを使用する。
    if (input.type === 'date') input.type = 'text';
    input.readOnly = true;
    input.inputMode = 'none';
    input.autocomplete = 'off';
    input.setAttribute('role', 'button');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-controls', `${scope}-day-calendar`);
    calendar.id = `${scope}-day-calendar`;

    calendar.hidden = !openState[scope];
    calendar.setAttribute('aria-hidden', openState[scope] ? 'false' : 'true');
    input.setAttribute('aria-expanded', openState[scope] ? 'true' : 'false');
  }

  function prepareAll() {
    prepareDateTarget('analysis');
    prepareDateTarget('team');
  }

  // アプリの再描画後も補正を維持する。
  const observer = new MutationObserver(prepareAll);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('click', event => {
    const modeButton = event.target.closest('.stat-mode-btn, .team-mode-btn');
    if (modeButton) {
      const mode = modeButton.dataset.mode || modeButton.dataset.teamMode;
      if (mode === 'day') {
        const scope = modeButton.classList.contains('team-mode-btn') ? 'team' : 'analysis';
        openState[scope] = true;
      }
      return;
    }

    const input = event.target.closest('#statTarget, #teamTarget');
    if (input) {
      const scope = input.id === 'teamTarget' ? 'team' : 'analysis';
      event.preventDefault();
      setCalendarOpen(scope, true);
      return;
    }

    const dateButton = event.target.closest('[data-calendar-date]');
    if (dateButton) {
      const calendar = dateButton.closest('[data-calendar-scope]');
      const scope = calendar?.dataset.calendarScope;
      if (scope === 'analysis' || scope === 'team') {
        // app.js側の選択処理・再描画より先に閉じる状態を保存する。
        openState[scope] = false;
        calendar.hidden = true;
        calendar.setAttribute('aria-hidden', 'true');
      }
    }
  }, true);

  document.addEventListener('keydown', event => {
    const input = event.target.closest?.('#statTarget, #teamTarget');
    if (!input || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    const scope = input.id === 'teamTarget' ? 'team' : 'analysis';
    setCalendarOpen(scope, true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAll, { once: true });
  } else {
    prepareAll();
  }
})();
