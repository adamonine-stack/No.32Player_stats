(() => {
  function normalizedText(label) {
    const clone = label.cloneNode(true);
    clone.querySelectorAll('input, button, select, textarea, .stat-counter-control').forEach(node => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function cleanupDuplicateFoulFields() {
    const actions = document.querySelector('.stats-form-actions');
    const card = actions?.closest('.card') || actions?.parentElement;
    if (!card) return;

    const unified = card.querySelector('.stats-unified-card');
    if (!unified) return;

    const labels = [...card.querySelectorAll('label')];
    for (const name of ['FOUL', '被FOUL']) {
      const matches = labels.filter(label => normalizedText(label) === name.toUpperCase());
      if (matches.length <= 1) continue;

      const keep = matches.find(label => unified.contains(label)) || matches[0];
      matches.forEach(label => {
        if (label !== keep) label.classList.add('duplicate-foul-field-hidden');
      });
    }
  }

  const style = document.createElement('style');
  style.textContent = '.duplicate-foul-field-hidden{display:none!important}';
  document.head.appendChild(style);

  function scheduleCleanup() {
    requestAnimationFrame(() => requestAnimationFrame(cleanupDuplicateFoulFields));
  }

  document.addEventListener('DOMContentLoaded', scheduleCleanup, { once: true });
  document.addEventListener('click', scheduleCleanup);
  document.addEventListener('change', scheduleCleanup);
})();
