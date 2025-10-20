// sw.js — نسخه خنثی؛ هیچ دخالتی در fetch ندارد تا مرورگر همیشه از شبکه صفحه را بگیرد

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// توجه: هیچ fetch لیسینری وجود ندارد.
// اگر قبلاً fetch را هندل می‌کردی، آن کد باعث بازگشت index.html یا bundle قدیمی می‌شد.
