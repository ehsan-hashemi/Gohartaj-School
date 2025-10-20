// common.js - توابع مشترک UI و ساعت زنده

(function (global) {
  const DefaultIcons = {
    profile: '<svg class="avatar-fallback" viewBox="0 0 24 24" width="56" height="56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#a0a7b3"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="#d2d7df"></path><circle cx="12" cy="8" r="4" fill="none" stroke="#6b7280" stroke-width="1.5"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#6b7280" stroke-width="1.5"></path></svg>',
    news: '<svg class="news-fallback" viewBox="0 0 24 24" width="100" height="60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="#d2d7df"></rect><rect x="5" y="6" width="12" height="3" fill="#a0a7b3"></rect><rect x="5" y="10" width="14" height="2" fill="#a0a7b3"></rect><rect x="5" y="13" width="9" height="2" fill="#a0a7b3"></rect></svg>',
    logo: '<svg class="brand-logo-fallback" viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="8" fill="#0a3d62"></rect><path d="M14 30l10-12 10 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
  };

  function imageOrNone(url, fallbackSvg, cls) {
    if (!url || !url.trim()) return "";
    const safe = url.replace(/"/g, "&quot;");
    return `<img src="${safe}" alt="" class="${cls}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  function formatDateFA(iso) {
    try { return new Date(iso).toLocaleString("fa-IR"); } catch { return iso; }
  }

  // ساعت زنده فقط عنصر مشخص را آپدیت می‌کند
  function liveClock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = new Date().toLocaleString("fa-IR");
    const id = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(id); return; }
      el.textContent = new Date().toLocaleString("fa-IR");
    }, 1000);
  }

  global.DefaultIcons = DefaultIcons;
  global.imageOrNone = imageOrNone;
  global.formatDateFA = formatDateFA;
  global.liveClock = liveClock;
})(window);
