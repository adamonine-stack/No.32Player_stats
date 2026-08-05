(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* R32 mobile stats entry tuning. Court SVG is intentionally untouched. */
    @media (max-width: 600px) {
      .stats-form-compact .shot-method-compact {
        margin: 0 0 4px !important;
        padding: 7px 9px !important;
        display: grid !important;
        gap: 5px !important;
      }
      .stats-form-compact .shot-method-compact h2,
      .stats-form-compact .shot-method-compact h3,
      .stats-form-compact .shot-method-compact h4 {
        margin: 0 !important;
        font-size: 15px !important;
        line-height: 1.15 !important;
      }
      .stats-form-compact .shot-method-compact .seg,
      .stats-form-compact .shot-method-compact [class*="segment"] {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 38px !important;
        height: 38px !important;
        gap: 3px !important;
        align-items: stretch !important;
        overflow: hidden !important;
      }
      .stats-form-compact .shot-method-compact .seg button,
      .stats-form-compact .shot-method-compact [class*="segment"] button,
      .stats-form-compact .shot-method-compact button {
        min-height: 38px !important;
        height: 38px !important;
        margin: 0 !important;
        padding: 0 7px !important;
        font-size: 13px !important;
        line-height: 1 !important;
        border-radius: 9px !important;
        align-self: stretch !important;
      }
      .stats-form-compact .shooting-number-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 5px !important;
        width: 100% !important;
        margin: 0 !important;
      }
      .stats-form-compact .shooting-number-grid label {
        min-width: 0 !important;
        grid-column: auto !important;
        font-size: 10.5px !important;
        line-height: 1 !important;
      }
      .stats-form-compact .shooting-number-grid .num-wrap { display: block !important; }
      .stats-form-compact .shooting-number-grid input[type="number"] {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 34px !important;
        padding: 4px 7px !important;
        font-size: 17px !important;
        border-radius: 10px !important;
      }
      .stats-form-compact .shooting-number-grid .num-steps { display: none !important; }
      .stats-form-compact .shot-launch {
        min-height: 42px !important;
        height: 42px !important;
        margin: 5px 0 7px !important;
        padding: 6px 10px !important;
      }
      .stats-form-compact .stat-counter-control {
        grid-template-columns: 52px minmax(42px, 1fr) 52px !important;
        min-height: 44px !important;
      }
      .stats-form-compact .stat-counter-button {
        min-width: 52px !important;
        min-height: 44px !important;
        color: #c084fc !important;
        background: rgba(124, 58, 237, .18) !important;
        font-size: 26px !important;
        font-weight: 800 !important;
      }
      .stats-form-compact .stat-counter-button:active {
        color: #fff !important;
        background: rgba(124, 58, 237, .62) !important;
      }
      .stats-form-compact .stat-counter-button:disabled {
        color: rgba(192, 132, 252, .35) !important;
        background: rgba(124, 58, 237, .08) !important;
        opacity: 1 !important;
      }
      .stats-form-compact .stats-unified-row.three-columns,
      .stats-form-compact .stats-unified-row.cols3,
      .stats-form-compact .stats-form-grid.cols3 { gap: 8px !important; }
      .stats-form-compact .stats-unified-card {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      .stats-form-compact .stats-form-actions {
        position: relative !important;
        margin-top: 5px !important;
        padding: 0 0 max(10px, env(safe-area-inset-bottom)) !important;
        min-height: 58px !important;
        align-items: stretch !important;
        overflow: visible !important;
      }
      .stats-form-compact .stats-form-actions .btn,
      .stats-form-compact .stats-form-actions button {
        min-height: 50px !important;
        height: 50px !important;
        padding: 8px 12px !important;
        line-height: 1.1 !important;
        white-space: nowrap !important;
      }
      #modalRoot > .modal.stats-entry-modal > .card {
        padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
        scroll-padding-bottom: 72px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
