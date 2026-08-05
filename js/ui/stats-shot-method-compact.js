(() => {
  const style = document.createElement('style');
  style.textContent = `
    .stats-form-compact .shot-method-compact {
      margin: 0 0 2px !important;
      padding: 1px 4px 2px !important;
      border-radius: 9px !important;
    }

    .stats-form-compact .shot-method-compact h2,
    .stats-form-compact .shot-method-compact h3,
    .stats-form-compact .shot-method-compact h4 {
      margin: 0 0 1px !important;
      font-size: 11.5px !important;
      line-height: 1 !important;
    }

    .stats-form-compact .shot-method-compact .seg,
    .stats-form-compact .shot-method-compact [class*="segment"] {
      margin: 0 !important;
      min-height: 27px !important;
      gap: 2px !important;
    }

    .stats-form-compact .shot-method-compact .seg button,
    .stats-form-compact .shot-method-compact [class*="segment"] button,
    .stats-form-compact .shot-method-compact button {
      min-height: 27px !important;
      height: 27px !important;
      padding: 0 5px !important;
      font-size: 11.5px !important;
      line-height: 1 !important;
      border-radius: 7px !important;
    }

    @media (max-width: 600px) {
      .stats-form-compact .shot-method-compact {
        margin-bottom: 1px !important;
        padding: 1px 3px !important;
      }

      .stats-form-compact .shot-method-compact h2,
      .stats-form-compact .shot-method-compact h3,
      .stats-form-compact .shot-method-compact h4 {
        font-size: 11px !important;
      }

      .stats-form-compact .shot-method-compact .seg,
      .stats-form-compact .shot-method-compact [class*="segment"] {
        min-height: 26px !important;
      }

      .stats-form-compact .shot-method-compact .seg button,
      .stats-form-compact .shot-method-compact [class*="segment"] button,
      .stats-form-compact .shot-method-compact button {
        min-height: 26px !important;
        height: 26px !important;
        padding: 0 4px !important;
        font-size: 11px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
