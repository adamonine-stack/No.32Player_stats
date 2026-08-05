(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* R32 mobile stats entry tuning. Court SVG is intentionally untouched. */
    @media (max-width: 600px) {
      .stats-form-compact .shot-method-compact {
        margin: 0 0 6px !important;
        padding: 10px !important;
        display: grid !important;
        gap: 8px !important;
      }

      .stats-form-compact .shot-method-compact h2,
      .stats-form-compact .shot-method-compact h3,
      .stats-form-compact .shot-method-compact h4 {
        margin: 0 !important;
        font-size: 16px !important;
        line-height: 1.2 !important;
      }

      .stats-form-compact .shot-method-compact .seg,
      .stats-form-compact .shot-method-compact [class*="segment"] {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 44px !important;
        height: 44px !important;
        gap: 4px !important;
        align-items: stretch !important;
        overflow: hidden !important;
      }

      .stats-form-compact .shot-method-compact .seg button,
      .stats-form-compact .shot-method-compact [class*="segment"] button,
      .stats-form-compact .shot-method-compact button {
        min-height: 44px !important;
        height: 44px !important;
        margin: 0 !important;
        padding: 0 8px !important;
        font-size: 14px !important;
        line-height: 1 !important;
        border-radius: 10px !important;
        align-self: stretch !important;
      }

      /* 2PA / 2PM / 3PA / 3PMを1段4列へ統一 */
      .stats-form-compact .shooting-number-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
        width: 100% !important;
      }

      .stats-form-compact .shooting-number-grid label {
        min-width: 0 !important;
        grid-column: auto !important;
      }

      .stats-form-compact .shooting-number-grid .num-wrap {
        display: block !important;
      }

      .stats-form-compact .shooting-number-grid input[type="number"] {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 40px !important;
        padding: 6px 8px !important;
        font-size: 18px !important;
      }

      .stats-form-compact .shooting-number-grid .num-steps {
        display: none !important;
      }

      /* ＋／−を紫色へ統一し、横方向のタップ領域を拡大 */
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

      /* 3列項目も各操作部の横幅を確保 */
      .stats-form-compact .stats-unified-row.three-columns,
      .stats-form-compact .stats-unified-row.cols3,
      .stats-form-compact .stats-form-grid.cols3 {
        gap: 8px !important;
      }

      .stats-form-compact .stats-unified-card {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
