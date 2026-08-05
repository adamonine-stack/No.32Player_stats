(() => {
  const style = document.createElement('style');
  style.textContent = `
    .stats-form-compact .stats-unified-card,
    .stats-form-compact .stats-unified-row,
    .stats-form-compact .stat-counter-enhanced,
    .stats-form-compact .stat-counter-control,
    .stats-form-compact .stat-counter-button {
      position: relative;
    }
    .stats-form-compact .stat-counter-button {
      z-index: 3;
      pointer-events: auto !important;
    }
    .stats-form-compact .stat-counter-value {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  function numericValue(input) {
    const parsed = Number(input?.value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  function updateCounter(input) {
    const label = input.closest('label.stat-counter-enhanced');
    const control = label?.querySelector('.stat-counter-control');
    if (!control) return;
    const current = numericValue(input);
    const baseline = Number(input.dataset.counterBaseline || 0);
    const value = control.querySelector('.stat-counter-value');
    const minus = control.querySelector('.stat-counter-minus');
    input.value = String(current);
    if (value) {
      value.textContent = String(current);
      value.classList.toggle('is-increased', current > baseline);
      value.classList.toggle('is-decreased', current < baseline);
      value.classList.toggle('is-unchanged', current === baseline);
    }
    if (minus) minus.disabled = current <= 0;
  }

  function inputForButton(button) {
    const label = button.closest('label.stat-counter-enhanced');
    return label?.querySelector('input[type="number"]') || null;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.stats-form-compact .stat-counter-button');
    if (!button) return;

    const input = inputForButton(button);
    if (!input) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const delta = button.classList.contains('stat-counter-plus') ? 1 : -1;
    const current = numericValue(input);
    const next = Math.max(0, current + delta);
    if (next === current) {
      updateCounter(input);
      return;
    }

    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    updateCounter(input);
  }, true);
})();
