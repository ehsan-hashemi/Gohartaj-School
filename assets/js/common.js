// common.js — ابزارهای پایدار UI با پاک‌سازی متن، ساعت زنده، bust مطمئن برای تصاویر، و سازگاری با bfcache

(function (global) {
  // آیکن‌های پیش‌فرض سبک و ایمن
  const DefaultIcons = {
    profile:
      '<svg class="avatar-fallback" viewBox="0 0 24 24" width="56" height="56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#a0a7b3"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="#d2d7df"></path><circle cx="12" cy="8" r="4" fill="none" stroke="#6b7280" stroke-width="1.5"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#6b7280" stroke-width="1.5"></path></svg>',
    news:
      '<svg class="news-fallback" viewBox="0 0 24 24" width="100" height="60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="#d2d7df"></rect><rect x="5" y="6" width="12" height="3" fill="#a0a7b3"></rect><rect x="5" y="10" width="14" height="2" fill="#a0a7b3"></rect><rect x="5" y="13" width="9" height="2" fill="#a0a7b3"></rect></svg>',
    logo:
      '<svg class="brand-logo-fallback" viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="8" fill="#0a3d62"></rect><path d="M14 30l10-12 10 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
  };

  // پاک‌سازی متن برای جلوگیری از فاصله‌ها و خطوط زائد
  function cleanText(t) {
    return String(t || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // تولید کلید bust یکتا (برای دور زدن هر کش بین‌راهی)
  function hardBustKey() {
    return `${Date.now()}-${Math.round(performance.now())}`;
  }

  // تولید کلید bust نرم (پنجره زمانی 5 دقیقه‌ای)
  function softBustKey(ttlMinutes) {
    const ttl = (typeof ttlMinutes === "number" && ttlMinutes > 0) ? ttlMinutes : 5;
    return Math.floor(Date.now() / (ttl * 60 * 1000));
  }

  // افزودن پارامتر bust به URL ایمن
  function bustUrl(url, { mode = "soft", ttlMinutes = 5 } = {}) {
    const v = mode === "hard" ? hardBustKey() : softBustKey(ttlMinutes);
    try {
      const u = new URL(url, location.origin);
      u.searchParams.set("v", v);
      return u.toString();
    } catch {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}v=${v}`;
    }
  }

  // رندر تصویر با bust اختیاری و fallback ایمن
  function imageOrNone(url, fallbackSvg, cls, options = { bust: false, hard: false, ttlMinutes: 5 }) {
    if (!url || !String(url).trim()) return "";
    const safeUrl = String(url).replace(/"/g, "&quot;");
    const finalUrl = options.bust ? bustUrl(safeUrl, { mode: options.hard ? "hard" : "soft", ttlMinutes: options.ttlMinutes || 5 }) : safeUrl;
    // توجه: onerror با جایگزینی outerHTML به SVG fallback
    return `<img src="${finalUrl}" alt="" class="${cls || ""}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  // فرمت تاریخ فارسی
  function formatDateFA(iso) {
    try { return new Date(iso).toLocaleString("fa-IR"); } catch { return iso || ""; }
  }

  // ساعت زنده با مدیریت قطع/وصل بر اساس حضور در DOM
  const ClockRegistry = new Map();

  function liveClock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    // اگر قبلاً برای همین ID تایمر داریم، پاک‌سازی
    if (ClockRegistry.has(elId)) {
      clearInterval(ClockRegistry.get(elId));
      ClockRegistry.delete(elId);
    }
    // مقدار اولیه
    el.textContent = new Date().toLocaleString("fa-IR");
    const id = setInterval(() => {
      // اگر عنصر از DOM حذف شد، تایمر را متوقف کن
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

  // سازگاری با bfcache: هنگام pageshow، تایمرهای قدیمی را قطع کن تا دوباره راه‌اندازی شوند
  window.addEventListener("pageshow", () => {
    stopAllClocks();
  });

  // آماده‌سازی DOM با once برای جلوگیری از چندبار اجرا
  function domReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // تشخیص لینک خارجی
  function isExternalLink(href) {
    try {
      const u = new URL(href, location.origin);
      return u.origin !== location.origin;
    } catch {
      return /^https?:\/\//.test(href);
    }
  }

  // خروج عمومی: پاک کردن نشست و هدایت
  function logoutAndRedirect() {
    try {
      localStorage.removeItem("session");
    } catch {}
    location.replace("/login/");
  }

  // به‌روزرسانی دکمه ناوبری بالای سایت (ورود ← پنل)
  function updateTopNavButton() {
    try {
      const btn = document.getElementById("nav-login-btn");
      if (!btn) return;
      const raw = localStorage.getItem("session");
      const session = raw ? JSON.parse(raw) : null;
      if (session && session.role) {
        btn.textContent = "پنل";
        btn.classList.add("nav-btn");
        btn.setAttribute("href", session.role === "admin" ? "/dash/admin/" : "/dash/student");
        btn.setAttribute("data-link", "");
      } else {
        btn.textContent = "ورود";
        btn.setAttribute("href", "/login/");
        btn.setAttribute("data-link", "");
      }
    } catch {}
  }

  // اجرای به‌روزرسانی دکمه ناوبری هنگام بارگذاری و برگشت bfcache
  document.addEventListener("DOMContentLoaded", updateTopNavButton, { once: true });
  window.addEventListener("pageshow", updateTopNavButton);

  // صادرات ابزارها
  global.DefaultIcons = DefaultIcons;
  global.imageOrNone = imageOrNone;
  global.formatDateFA = formatDateFA;
  global.liveClock = liveClock;
  global.stopAllClocks = stopAllClocks;
  global.cleanText = cleanText;
  global.domReady = domReady;
  global.isExternalLink = isExternalLink;
  global.logoutAndRedirect = logoutAndRedirect;
  global.hardBustKey = hardBustKey;
  global.bustUrl = bustUrl;
})(window);
