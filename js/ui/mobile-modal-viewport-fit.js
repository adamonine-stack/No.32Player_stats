(() => {
  const SHOT_POSITION_TITLE = 'シュート位置を選択';
  const SHOT_EDIT_TITLE = 'シュート明細を編集';

  function normalize(text = '') {
    return text.replace(/\s+/g, ' ').trim();
  }

  function configureModal() {
    const modal = document.querySelector('#modalRoot > .modal');
    const card = modal?.querySelector(':scope > .card');
    if (!modal || !card) return;

    modal.classList.remove('stats-entry-modal', 'shot-entry-viewport');

    const heading = normalize(card.querySelector('h2')?.textContent || '');
    if (heading.includes('スタッツ入力')) {
      modal.classList.add('stats-entry-modal');
      card.scrollTop = 0;
    }

    const isShotEntry = heading === SHOT_POSITION_TITLE || heading === SHOT_EDIT_TITLE;
    if (!isShotEntry) return;

    modal.classList.add('shot-entry-viewport');

    const head = card.querySelector('.shot-modal-head');
    const instruction = head?.querySelector('p.sub');
    if (instruction && normalize(instruction.textContent).includes('シュートを打った位置をタップしてください')) {
      instruction.remove();
    }

    /* 登録画面だけ凡例を削除。コートSVG、線、ラベル、座標、縦横比には触れない。 */
    const courtRoot = card.querySelector('#shotCourtRoot');
    const legend = courtRoot?.nextElementSibling;
    if (legend?.classList.contains('shot-marker-legend')) {
      legend.remove();
    }

    card.scrollTop = 0;
  }

  const observer = new MutationObserver(configureModal);

  function start() {
    const root = document.querySelector('#modalRoot');
    if (!root) return;
    observer.observe(root, { childList: true, subtree: true });
    configureModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
