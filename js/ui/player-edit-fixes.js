(() => {
  function addDeleteButton(playerId) {
    const root = document.querySelector('#modalRoot .modal .card');
    if (!root || root.querySelector('#deletePlayerRegistration')) return;
    const title = root.querySelector('h2');
    if (!title || title.textContent.trim() !== '選手修正') return;
    const actions = root.querySelector('.game-form-actions');
    if (!actions) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn danger';
    button.id = 'deletePlayerRegistration';
    button.textContent = '選手登録削除';
    button.addEventListener('click', async () => {
      if (!window.deletePlayer) return;
      await window.deletePlayer(playerId);
      const close = root.querySelector('#closeModal');
      if (close) close.click();
    });
    actions.appendChild(button);
  }

  function install() {
    if (typeof window.editPlayer !== 'function' || window.editPlayer.__playerEditFixInstalled) {
      if (typeof window.editPlayer !== 'function') setTimeout(install, 50);
      return;
    }
    const original = window.editPlayer;
    const wrapped = function(playerId) {
      const result = original.call(this, playerId);
      addDeleteButton(playerId);
      requestAnimationFrame(() => addDeleteButton(playerId));
      return result;
    };
    wrapped.__playerEditFixInstalled = true;
    window.editPlayer = wrapped;
  }

  install();
})();
