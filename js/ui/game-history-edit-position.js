(() => {
  let returnTarget = null;

  const historyScroller = () => document.querySelector('#modalRoot .game-history-modal');

  function rememberEditPosition(button) {
    const row = button.closest('[data-history-event-id]');
    const scroller = historyScroller();
    if (!row || !scroller) return;
    const rowRect = row.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    returnTarget = {
      eventId: row.dataset.historyEventId,
      offsetTop: rowRect.top - scrollerRect.top
    };
  }

  function restoreEditPosition() {
    if (!returnTarget) return false;
    const scroller = historyScroller();
    if (!scroller) return false;
    const row = [...scroller.querySelectorAll('[data-history-event-id]')]
      .find(element => element.dataset.historyEventId === returnTarget.eventId);
    if (!row) return false;
    const scrollerRect = scroller.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    scroller.scrollTop += rowRect.top - scrollerRect.top - returnTarget.offsetTop;
    returnTarget = null;
    return true;
  }

  document.addEventListener('click', event => {
    const editButton = event.target.closest('[data-history-edit],[data-history-assist-edit]');
    if (editButton) rememberEditPosition(editButton);
  }, true);

  const observer = new MutationObserver(() => {
    if (!returnTarget || !historyScroller()) return;
    requestAnimationFrame(() => {
      restoreEditPosition();
      requestAnimationFrame(restoreEditPosition);
    });
  });

  const root = document.getElementById('modalRoot');
  if (root) observer.observe(root, { childList: true, subtree: true });
})();
