// sw.js — استراتژی network-first برای ناوبری، با fallback به کش و به‌روزرسانی
const CACHE_NAME = "gohartaj-spa-v3";
const INDEX_URL = "/index.html";

// نصب: فقط index.html را پیش‌کش
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([INDEX_URL]))
  );
  self.skipWaiting();
});

// فعال‌سازی: claim سریع
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch: فقط درخواست‌های ناوبری (document) را هندل کن
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // سایر درخواست‌ها عبور کنند

  event.respondWith((async () => {
    try {
      // تلاش شبکه (network-first)
      const networkResp = await fetch(INDEX_URL, { cache: "no-store" });
      // به‌روزرسانی کش با نسخه جدید
      const cache = await caches.open(CACHE_NAME);
      cache.put(INDEX_URL, networkResp.clone());
      return networkResp;
    } catch (e) {
      // اگر شبکه در دسترس نبود، fallback به کش
      const cached = await caches.match(INDEX_URL);
      return cached || new Response("<!doctype html><title>Offline</title>", { headers: { "Content-Type": "text/html" } });
    }
  })());
});
