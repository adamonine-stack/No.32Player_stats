const CACHE_NAME = 'r32-shell-20260905-keyboard-v1';
const APP_SHELL = [
  './', './index.html', './manifest.json', './styles/quick-keyboard.css?v=20260905-v1', './js/ui/quick-keyboard.js?v=20260905-v1',
  './assets/r32-background.png', './assets/r32-bg-mobile.svg', './assets/r32-bg-pc.svg', './assets/r32-brand.png', './assets/r32-brand.svg',
  './assets/shot-court/shot-zone-reference.png', './icons/apple-touch-icon.png', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg',
  './styles/aggregation-filters.css', './styles/app.css', './styles/detail-stats-actions.css', './styles/foul-layout-safe.css', './styles/game-form-ios-focus.css', './styles/game-score-custom-keypad.css', './styles/game-score-input-no-zoom.css', './styles/min-display.css', './styles/mobile-list-title-unified.css', './styles/mobile-modal-viewport-fit.css', './styles/mobile-page-position.css', './styles/offline-status.css', './styles/opponent-teams.css', './styles/participation.css', './styles/pc-optimization.css', './styles/period-calendar.css', './styles/quick-input.css', './styles/registration-standardization.css', './styles/seasons.css', './styles/shot-registration.css', './styles/stats-opponent-mobile-fixes.css', './styles/team-conditions.css', './styles/team-game-periods.css'
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

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/js/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (requestUrl.hostname === 'www.gstatic.com') {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});
