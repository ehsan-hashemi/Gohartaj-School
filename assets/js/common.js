// common.js — ابزارهای UI پایدار: پاک‌سازی متن، مدیریت ساعت‌ها، و bust اختیاری تصاویر

(function (global) {
  const DefaultIcons = {
    profile:
      '<svg class="avatar-fallback" viewBox="0 0 24 24" width="56" height="56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#a0a7b3"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="#d2d7df"></path><circle cx="12" cy="8" r="4" fill="none" stroke="#6b7280" stroke-width="1.5"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#6b7280" stroke-width="1.5"></path></svg>',
    news:
      '<svg class="news-fallback" viewBox="0 0 24 24" width="100" height="60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="#d2d7df"></rect><rect x="5" y="6" width="12" height="3" fill="#a0a7b3"></rect><rect x="5" y="10" width="14" height="2" fill="#a0a7b3"></rect><rect x="5" y="13" width="9" height="2" fill="#a0a7b3"></rect></svg>',
    logo:
      '<svg class="brand-logo-fallback" viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="8" fill="#0a3d62"></rect><path d="M14 30l10-12 10 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
  };

  function cleanText(t) {
    return String(t || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function bustUrl(url, bust = false, ttlMinutes = 5) {
    try {
      if (!bust) return url;
      const u = new URL(url, location.origin);
      const v = Math.floor(Date.now() / (ttlMinutes * 60 * 1000));
      u.searchParams.set("v", v);
      return u.toString();
    } catch {
      const sep = url.includes("?") ? "&" : "?";
      const v = Math.floor(Date.now() / (ttlMinutes * 60 * 1000));
      return `${url}${sep}v=${v}`;
    }
  }

  function imageOrNone(url, fallbackSvg, cls, options = { bust: false, ttlMinutes: 5 }) {
    if (!url || !String(url).trim()) return "";
    const safeUrl = String(url).replace(/"/g, "&quot;");
    const finalUrl = bustUrl(safeUrl, !!options.bust, options.ttlMinutes || 5);
    return `<img src="${finalUrl}" alt="" class="${cls || ""}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  function formatDateFA(iso) {
    try { return new Date(iso).toLocaleString("fa-IR"); } catch { return iso || ""; }
  }

  const ClockRegistry = new Map();

  function liveClock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (ClockRegistry.has(elId)) {
      clearInterval(ClockRegistry.get(elId));
      ClockRegistry.delete(elId);
    }
    el.textContent = new Date().toLocaleString("fa-IR");
    const id = setInterval(() => {
      if (!document.body.contains(el)) {
        clearInterval(id);
        ClockRegistry.delete(elId);
        return;
      }
      el.textContent = new Date().toLocaleString("fa-IR");
    }, 1000);
    ClockRegistry.set(elId, id);
  }

  function stopAllClocks() {
    ClockRegistry.forEach((intervalId) => clearInterval(intervalId));
    ClockRegistry.clear();
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      stopAllClocks();
    }
  });

  function domReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function isExternalLink(href) {
    try {
      const u = new URL(href, location.origin);
      return u.origin !== location.origin;
    } catch {
      return /^https?:\/\//.test(href);
    }
  }

  global.DefaultIcons = DefaultIcons;
  global.imageOrNone = imageOrNone;
  global.formatDateFA = formatDateFA;
  global.liveClock = liveClock;
  global.stopAllClocks = stopAllClocks;
  global.cleanText = cleanText;
  global.domReady = domReady;
  global.isExternalLink = isExternalLink;
})(window);
