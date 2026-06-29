const CACHE='r32-v3-complete';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','css/styles.css','js/app.js','assets/r32-wallpaper.png','icons/icon-192.png'])))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
