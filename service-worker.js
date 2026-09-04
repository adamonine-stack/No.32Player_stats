const CACHE_NAME = 'r32-shell-20260904-v2';
const APP_SHELL = [
  './', './index.html', './manifest.json',
  './assets/r32-background.png', './assets/r32-bg-mobile.svg', './assets/r32-bg-pc.svg', './assets/r32-brand.png', './assets/r32-brand.svg',
  './assets/shot-court/shot-zone-reference.png', './icons/apple-touch-icon.png', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg',
  './js/app.js',
  './js/calculations/analysis-calculations.js', './js/calculations/assist-play-calculations.js', './js/calculations/calendar-calculations.js', './js/calculations/game-calculations.js', './js/calculations/game-event-calculations.js', './js/calculations/game-filter-calculations.js', './js/calculations/history-order.js', './js/calculations/opponent-team-calculations.js', './js/calculations/opponent-team-merge-calculations.js', './js/calculations/optimistic-rollback.js', './js/calculations/participation-calculations.js', './js/calculations/player-quarter-calculations.js', './js/calculations/player-season-summary.js', './js/calculations/season-calculations.js', './js/calculations/shot-analysis-calculations.js', './js/calculations/shot-calculations.js', './js/calculations/stats-calculations.js', './js/calculations/team-calculations.js', './js/calculations/team-game-period-calculations.js', './js/calculations/team-name-matching.js',
  './js/config/firebase-config.js', './js/core/assist-play-store.js', './js/core/firebase.js', './js/core/firestore-persistence.js', './js/core/offline-operation-queue.js', './js/core/offline-sync.js', './js/core/quick-history-store.js', './js/core/state.js', './js/core/storage.js',
  './js/data/2025-cbg-hyogo-men.js', './js/data/2025-hyogo-jr-winter-men.js', './js/data/2025-osaka-jr-winter-cup-men.js', './js/data/2026-hyogo-u15-men.js', './js/data/2026-kyoto-u15-men.js', './js/data/2026-nara-u15-men.js', './js/data/2026-okayama-u15-men.js', './js/data/2026-osaka-u15-men.js', './js/data/2026-shiga-u15-men.js', './js/data/2026-wakayama-u15-men.js', './js/data/listener-registry.js', './js/diagnostics/data-integrity.js', './js/diagnostics/season-migration-plan.js',
  './js/ui/assist-history-selection.js', './js/ui/day-calendar-behavior.js', './js/ui/detail-stats-actions.js', './js/ui/dom.js', './js/ui/game-history-fixed-nav.js', './js/ui/game-history-view-mode.js', './js/ui/game-list-scroll-memory.js', './js/ui/game-score-custom-keypad.js', './js/ui/game-score-focus-stability.js', './js/ui/mobile-modal-viewport-fit.js', './js/ui/player-edit-fixes.js', './js/ui/quarter-score-difference.js', './js/ui/quick-input-touch-fix.js', './js/ui/quick-player-order.js', './js/ui/shot-analysis-close-fix.js', './js/ui/shot-interactions.js', './js/ui/shot-selected-area-highlight.js', './js/ui/stats-counter-controls.js', './js/ui/stats-counter-event-guard.js', './js/ui/stats-duplicate-guard.js', './js/ui/stats-entry-layout-tuning.js', './js/ui/stats-layout-adjustments-v2.js', './js/ui/stats-layout-adjustments.js', './js/ui/stats-shot-method-compact.js', './js/ui/team-detail-playing-time.js', './js/ui/team-shot-analysis.js', './js/ui/toast.js',
  './styles/aggregation-filters.css', './styles/app.css', './styles/detail-stats-actions.css', './styles/foul-layout-safe.css', './styles/game-form-ios-focus.css', './styles/game-score-custom-keypad.css', './styles/game-score-input-no-zoom.css', './styles/min-display.css', './styles/mobile-list-title-unified.css', './styles/mobile-modal-viewport-fit.css', './styles/mobile-page-position.css', './styles/offline-status.css', './styles/opponent-teams.css', './styles/participation.css', './styles/pc-optimization.css', './styles/period-calendar.css', './styles/quick-input.css', './styles/registration-standardization.css', './styles/seasons.css', './styles/shot-registration.css', './styles/stats-opponent-mobile-fixes.css', './styles/team-conditions.css', './styles/team-game-periods.css',
  'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js', 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js', 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('r32-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (requestUrl.origin === self.location.origin || requestUrl.hostname === 'www.gstatic.com') {
    event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok || response.type === 'opaque') caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});
