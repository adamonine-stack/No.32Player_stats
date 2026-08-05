(() => {
  const STAT_NAMES = new Set([
    'FTA','FTM','AST','BLK','OR','DR',
    'ドリブルカット','パスカット','その他STL',
    'パスミス','ドリブルミス','キャッチミス',
    'バイオレーション','その他TO'
  ]);

  function normalizedText(element) {
    if (!element) return '';
    const clone = element.cloneNode(true);
    clone.querySelectorAll('input, button, select, textarea, .stat-counter-control').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function statsCard() {
    const actions = document.querySelector('.stats-form-actions');
    return actions?.closest('.card') || actions?.parentElement || null;
  }

  function removeDuplicateUnifiedCards(card) {
    const cards = [...card.querySelectorAll('.stats-unified-card')];
    if (cards.length <= 1) return cards[0] || null;

    const primary = cards[0];
    cards.slice(1).forEach(duplicate => {
      duplicate.querySelectorAll('label.stat-counter-enhanced').forEach(label => {
        const name = normalizedText(label);
        if (!STAT_NAMES.has(name)) return;
        const alreadyExists = [...primary.querySelectorAll('label.stat-counter-enhanced')]
          .some(existing => normalizedText(existing) === name);
        if (!alreadyExists) primary.appendChild(label);
      });
      duplicate.remove();
    });
    return primary;
  }

  function removeDuplicateLabels(card) {
    const seen = new Set();
    [...card.querySelectorAll('label.stat-counter-enhanced')].forEach(label => {
      const name = normalizedText(label);
      if (!STAT_NAMES.has(name)) return;
      if (!seen.has(name)) {
        seen.add(name);
        return;
      }
      label.remove();
    });
  }

  function cleanEmptyRows(card) {
    card.querySelectorAll('.stats-unified-row').forEach(row => {
      if (!row.querySelector('label.stat-counter-enhanced')) row.remove();
    });
  }

  function guard() {
    const card = statsCard();
    if (!card) return;
    removeDuplicateUnifiedCards(card);
    removeDuplicateLabels(card);
    cleanEmptyRows(card);
  }

  let scheduled = false;
  function scheduleGuard() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      guard();
    });
  }

  const observer = new MutationObserver(scheduleGuard);
  document.addEventListener('DOMContentLoaded', () => {
    scheduleGuard();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
