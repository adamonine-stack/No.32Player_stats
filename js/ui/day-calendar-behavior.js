(() => {
  const openState = {
    analysis: false,
    team: false,
  };

  const inputIdForScope = scope => scope === 'team' ? 'teamTarget' : 'statTarget';

  function calendarForScope(scope) {
    return document.querySelector(`[data-calendar-scope="${scope}"]`);
  }

  function dayTargetFromEvent(event) {
    const input = event.target.closest?.('input#statTarget, input#teamTarget');
    if (!input) return null;
    const scope = input.id === 'teamTarget' ? 'team' : 'analysis';
    if (!calendarForScope(scope)) return null;
    return { input, scope };
  }

  function setCalendarOpen(scope, isOpen) {
    openState[scope] = isOpen;
    const calendar = calendarForScope(scope);
    if (calendar) {
      calendar.hidden = !isOpen;
      calendar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    const input = document.getElementById(inputIdForScope(scope));
    if (input instanceof HTMLInputElement) {
      input.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      input.blur();
    }
  }

  function prepareDateTarget(scope) {
    const input = document.getElementById(inputIdForScope(scope));
    const calendar = calendarForScope(scope);
    if (!(input instanceof HTMLInputElement) || !calendar) return;

    // 日別集計の入力欄だけをR32独自カレンダーの起動ボタンとして扱う。
    // 試合・大会集計では同じIDを持つselectが使われるため、selectには一切干渉しない。
    if (input.type === 'date') input.type = 'text';
    input.readOnly = true;
    input.inputMode = 'none';
    input.autocomplete = 'off';
    input.tabIndex = 0;
    input.style.fontSize = '16px';
    input.style.touchAction = 'manipulation';
    input.style.webkitUserSelect = 'none';
    input.style.userSelect = 'none';
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

  // 日別集計の入力欄だけ、タップ開始時点でフォーカスを止めてiOS等の自動ズームを防止する。
  document.addEventListener('pointerdown', event => {
    const target = dayTargetFromEvent(event);
    if (!target) return;
    event.preventDefault();
    target.input.blur();
  }, true);

  document.addEventListener('touchstart', event => {
    const target = dayTargetFromEvent(event);
    if (!target) return;
    event.preventDefault();
    target.input.blur();
  }, { capture: true, passive: false });

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

    const target = dayTargetFromEvent(event);
    if (target) {
      event.preventDefault();
      target.input.blur();
      setCalendarOpen(target.scope, true);
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

  document.addEventListener('focusin', event => {
    const target = dayTargetFromEvent(event);
    if (!target) return;
    // タップ由来のフォーカスは直ちに外す。キーボード操作はkeydownで維持する。
    if (event.sourceCapabilities?.firesTouchEvents) target.input.blur();
  });

  document.addEventListener('keydown', event => {
    const target = dayTargetFromEvent(event);
    if (!target || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setCalendarOpen(target.scope, true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAll, { once: true });
  } else {
    prepareAll();
  }
})();
