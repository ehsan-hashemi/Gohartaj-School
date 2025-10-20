// sw.js - بازنویسی درخواست‌های ناوبری به index.html برای SPA
const CACHE_NAME = "gohartaj-spa-v1";
const INDEX_URL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([INDEX_URL])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // فقط درخواست‌های ناوبری (document) را هندل کن
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(INDEX_URL).then(resp => resp || fetch(INDEX_URL))
    );
    return;
  }

  // درخواست‌های دیگر را عبور بده یا از کش ساده استفاده کن (اختیاری)
});
