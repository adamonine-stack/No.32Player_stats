(() => {
  const ROWS = [
    ['FTA', 'FTM'],
    ['FOUL', '被FOUL'],
    ['AST', 'BLK'],
    ['OR', 'DR'],
    ['ドリブルカット', 'パスカット', 'その他STL'],
    ['パスミス', 'ドリブルミス', 'キャッチミス'],
    ['バイオレーション', 'その他TO']
  ];

  const style = document.createElement('style');
  style.textContent = `
    /* スタッツ入力画面専用 */
    .stats-form-compact .shot-method-compact {
      margin: 0 0 3px !important;
      padding: 3px 6px !important;
      border-radius: 10px !important;
    }

    .stats-form-compact .shot-method-compact h2,
    .stats-form-compact .shot-method-compact h3,
    .stats-form-compact .shot-method-compact h4 {
      margin: 0 0 2px !important;
      font-size: 12px !important;
      line-height: 1.05 !important;
    }

    .stats-form-compact .shot-method-compact .seg,
    .stats-form-compact .shot-method-compact [class*="segment"] {
      margin: 0 !important;
      min-height: 29px !important;
    }

    .stats-form-compact .shot-method-compact .seg button,
    .stats-form-compact .shot-method-compact [class*="segment"] button,
    .stats-form-compact .shot-method-compact button {
      min-height: 29px !important;
      height: 29px !important;
      padding: 1px 6px !important;
      font-size: 12px !important;
      line-height: 1 !important;
    }

    /* 2PA・2PM・3PA・3PMは表示専用 */
    .stats-form-compact .shot-readonly-stat {
      margin: 0 !important;
      line-height: 1 !important;
      font-size: 10.5px !important;
    }

    .stats-form-compact .shot-readonly-stat input[type="number"],
    .stats-form-compact .shot-readonly-stat input[readonly],
    .stats-form-compact .shot-readonly-stat input[disabled] {
      min-height: 25px !important;
      height: 25px !important;
      padding: 1px 8px !important;
      margin-top: 1px !important;
      border-radius: 8px !important;
      font-size: 16px !important;
      line-height: 1 !important;
    }

    /* シュートボタン以降を一つのカードに統合 */
    .stats-form-compact .stats-unified-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 3px 0 4px !important;
      padding: 5px 6px !important;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 12px;
      background: rgba(12,12,12,.72);
      box-sizing: border-box;
    }

    .stats-form-compact .stats-unified-row {
      display: grid;
      gap: 5px;
      align-items: end;
      min-width: 0;
    }

    .stats-form-compact .stats-unified-row.cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stats-form-compact .stats-unified-row.cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .stats-form-compact .stats-unified-card label.stat-counter-enhanced {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      font-size: 10.5px !important;
      line-height: 1 !important;
    }

    .stats-form-compact .stats-unified-card .stat-counter-control {
      grid-template-columns: 38px minmax(28px, 1fr) 38px !important;
      width: 100% !important;
      min-height: 35px !important;
      height: 35px !important;
      margin-top: 1px !important;
      border-radius: 9px !important;
    }

    .stats-form-compact .stats-unified-card .stat-counter-button {
      min-width: 38px !important;
      min-height: 35px !important;
      height: 35px !important;
      font-size: 21px !important;
    }

    .stats-form-compact .stats-unified-card .stat-counter-value {
      font-size: 18px !important;
      padding: 0 1px !important;
    }

    .stats-form-compact .stats-unified-row.cols-3 label.stat-counter-enhanced {
      font-size: 9.5px !important;
      white-space: nowrap;
    }

    .stats-form-compact .stats-unified-row.cols-3 .stat-counter-control {
      grid-template-columns: 30px minmax(24px, 1fr) 30px !important;
    }

    .stats-form-compact .stats-unified-row.cols-3 .stat-counter-button {
      min-width: 30px !important;
      font-size: 19px !important;
    }

    .stats-form-compact .stats-form-actions {
      margin-top: 3px !important;
    }

    @media (max-width: 380px) {
      .stats-form-compact .stats-unified-card {
        gap: 2px;
        padding: 4px !important;
      }

      .stats-form-compact .stats-unified-row {
        gap: 3px;
      }

      .stats-form-compact .stats-unified-row.cols-3 label.stat-counter-enhanced {
        font-size: 8.5px !important;
      }

      .stats-form-compact .stats-unified-row.cols-3 .stat-counter-control {
        grid-template-columns: 27px minmax(21px, 1fr) 27px !important;
      }

      .stats-form-compact .stats-unified-row.cols-3 .stat-counter-button {
        min-width: 27px !important;
        font-size: 18px !important;
      }
    }
  `;
  document.head.appendChild(style);

  function normalizedText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('input, button, select, textarea, .stat-counter-control').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function findStatsCard() {
    const actions = document.querySelector('.stats-form-actions');
    return actions?.closest('.card') || actions?.parentElement || null;
  }

  function markShotReadOnlyStats(card) {
    card.querySelectorAll('label').forEach(label => {
      const text = normalizedText(label);
      if (['2PA', '2PM', '3PA', '3PM'].includes(text)) {
        label.classList.add('shot-readonly-stat');
      }
    });
  }

  function markShotMethodBox(card) {
    const candidates = [...card.querySelectorAll('div, section, fieldset')];
    const candidate = candidates.find(element => {
      const text = element.textContent.replace(/\s+/g, ' ').trim();
      return text.includes('従来の数値入力') && text.includes('シュート内訳入力');
    });
    if (!candidate) return;

    let target = candidate;
    while (target.parentElement && target.parentElement !== card) {
      const parentText = target.parentElement.textContent.replace(/\s+/g, ' ').trim();
      if (!parentText.includes('従来の数値入力') || !parentText.includes('シュート内訳入力')) break;
      if (parentText.length > 100) break;
      target = target.parentElement;
    }
    target.classList.add('shot-method-compact');
  }

  function labelsByName(card) {
    const map = new Map();
    card.querySelectorAll('label.stat-counter-enhanced').forEach(label => {
      map.set(normalizedText(label), label);
    });
    return map;
  }

  function findShootButton(card) {
    return [...card.querySelectorAll('button')].find(button =>
      button.textContent.replace(/\s+/g, '').trim() === 'シュート'
    ) || null;
  }

  function buildUnifiedCard(card) {
    const expectedNames = ROWS.flat();
    const labels = labelsByName(card);
    if (!expectedNames.every(name => labels.has(name.toUpperCase()))) return;

    let unified = card.querySelector('.stats-unified-card');
    if (!unified) {
      unified = document.createElement('div');
      unified.className = 'stats-unified-card';
    }
    unified.innerHTML = '';

    ROWS.forEach(names => {
      const row = document.createElement('div');
      row.className = `stats-unified-row cols-${names.length}`;
      names.forEach(name => row.appendChild(labels.get(name.toUpperCase())));
      unified.appendChild(row);
    });

    const actions = card.querySelector('.stats-form-actions');
    if (actions) {
      actions.before(unified);
      return;
    }

    const shootButton = findShootButton(card);
    if (shootButton) shootButton.insertAdjacentElement('afterend', unified);
  }

  function removeEmptyWrappers(card) {
    [...card.querySelectorAll('.grid, div, section')].forEach(element => {
      if (element === card || element.classList.contains('stats-unified-card')) return;
      if (element.querySelector('.stats-unified-card')) return;
      if (element.children.length === 0 && !element.textContent.trim()) element.remove();
    });
  }

  function applyAdjustments() {
    const card = findStatsCard();
    if (!card) return;
    card.classList.add('stats-form-compact');
    markShotReadOnlyStats(card);
    markShotMethodBox(card);
    buildUnifiedCard(card);
    removeEmptyWrappers(card);
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyAdjustments();
    });
  }

  const observer = new MutationObserver(scheduleApply);
  document.addEventListener('DOMContentLoaded', () => {
    scheduleApply();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
