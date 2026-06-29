const CACHE_NAME = 'r32-stats-v2.1.0';
const ASSETS = [
  './','./index.html','./manifest.json','./css/style.css','./js/app.js','./js/firebase-service.js','./js/utils.js','./icons/icon-192.png','./icons/icon-512.png','./assets/r32-hero.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(res => res || caches.match('./index.html'))));
});
