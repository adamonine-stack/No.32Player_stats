(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* スタッツ入力画面専用 */
    .stats-form-compact .stat-counter-enhanced.stat-counter-standard-width {
      grid-column: span 1 !important;
      width: 100% !important;
      max-width: none !important;
    }

    .stats-form-compact .stat-counter-enhanced.stat-counter-standard-width .stat-counter-control {
      width: 100% !important;
      max-width: none !important;
    }

    /* 2PA・2PM・3PA・3PMは表示専用なので高さを抑える */
    .stats-form-compact .shot-readonly-stat {
      margin: 0 !important;
      line-height: 1 !important;
      font-size: 11px !important;
    }

    .stats-form-compact .shot-readonly-stat input[type="number"],
    .stats-form-compact .shot-readonly-stat input[readonly],
    .stats-form-compact .shot-readonly-stat input[disabled] {
      min-height: 29px !important;
      height: 29px !important;
      padding: 2px 9px !important;
      margin-top: 1px !important;
      border-radius: 9px !important;
      font-size: 18px !important;
      line-height: 1 !important;
    }

    /* シュート登録方式切替枠をコンパクト化 */
    .stats-form-compact .shot-method-compact {
      margin: 0 0 4px !important;
      padding: 6px 8px !important;
      border-radius: 11px !important;
    }

    .stats-form-compact .shot-method-compact h2,
    .stats-form-compact .shot-method-compact h3,
    .stats-form-compact .shot-method-compact h4 {
      margin: 0 0 4px !important;
      font-size: 13px !important;
      line-height: 1.1 !important;
    }

    .stats-form-compact .shot-method-compact .seg,
    .stats-form-compact .shot-method-compact [class*="segment"] {
      margin: 0 !important;
      min-height: 34px !important;
    }

    .stats-form-compact .shot-method-compact .seg button,
    .stats-form-compact .shot-method-compact [class*="segment"] button,
    .stats-form-compact .shot-method-compact button {
      min-height: 34px !important;
      height: 34px !important;
      padding: 3px 8px !important;
      font-size: 13px !important;
      line-height: 1.1 !important;
    }

    @media (max-width: 600px) {
      .stats-form-compact .shot-readonly-stat input[type="number"],
      .stats-form-compact .shot-readonly-stat input[readonly],
      .stats-form-compact .shot-readonly-stat input[disabled] {
        min-height: 27px !important;
        height: 27px !important;
        padding: 1px 8px !important;
        font-size: 17px !important;
      }

      .stats-form-compact .shot-method-compact {
        padding: 4px 6px !important;
        margin-bottom: 3px !important;
      }

      .stats-form-compact .shot-method-compact .seg button,
      .stats-form-compact .shot-method-compact [class*="segment"] button,
      .stats-form-compact .shot-method-compact button {
        min-height: 32px !important;
        height: 32px !important;
        padding: 2px 6px !important;
        font-size: 12px !important;
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

  function markOtherStats(card) {
    card.querySelectorAll('label.stat-counter-enhanced').forEach(label => {
      const text = normalizedText(label);
      if (text === 'その他STL' || text === 'その他TO') {
        label.classList.add('stat-counter-standard-width');
      }
    });
  }

  function markShotReadOnlyStats(card) {
    card.querySelectorAll('label').forEach(label => {
      const text = normalizedText(label);
      if (!['2PA', '2PM', '3PA', '3PM'].includes(text)) return;
      label.classList.add('shot-readonly-stat');
    });
  }

  function markShotMethodBox(card) {
    const all = [...card.querySelectorAll('div, section, fieldset')];
    const candidate = all.find(element => {
      const text = element.textContent.replace(/\s+/g, ' ').trim();
      return text.includes('従来の数値入力') && text.includes('シュート内訳入力');
    });
    if (!candidate) return;

    let target = candidate;
    while (target.parentElement && target.parentElement !== card) {
      const parentText = target.parentElement.textContent.replace(/\s+/g, ' ').trim();
      if (!parentText.includes('従来の数値入力') || !parentText.includes('シュート内訳入力')) break;
      if (parentText.length > 120) break;
      target = target.parentElement;
    }
    target.classList.add('shot-method-compact');
  }

  function applyAdjustments() {
    const card = findStatsCard();
    if (!card) return;
    card.classList.add('stats-form-compact');
    markOtherStats(card);
    markShotReadOnlyStats(card);
    markShotMethodBox(card);
  }

  const observer = new MutationObserver(applyAdjustments);
  document.addEventListener('DOMContentLoaded', () => {
    applyAdjustments();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
