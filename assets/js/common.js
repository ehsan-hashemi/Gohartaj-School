// common.js — نسخه‌ی اصلاح‌شده و پایدار برای ابزارهای UI، با مدیریت ساعت‌ها و پاک‌سازی متن
// اهداف این نسخه:
// - جلوگیری از نمایش محتوای کهنه به‌واسطه‌ی مدیریت صحیح ساعت‌ها و رویدادهای برگشت (bfcache)
// - ارائه‌ی imageOrNone با گزینه‌ی bust برای جلوگیری از کش ناخواسته روی تصاویر (اختیاری)
// - پاک‌سازی متن‌ها (حذف \n و فاصله‌های اضافه) پیش از رندر برای رفع شکستن خطوط
// - ارائه‌ی توابع عمومی امن و بدون وابستگی به سایر فایل‌ها

(function (global) {
  // آیکن‌های پیش‌فرض (fallback SVG)
  const DefaultIcons = {
    profile:
      '<svg class="avatar-fallback" viewBox="0 0 24 24" width="56" height="56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#a0a7b3"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="#d2d7df"></path><circle cx="12" cy="8" r="4" fill="none" stroke="#6b7280" stroke-width="1.5"></circle><path d="M4 22c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#6b7280" stroke-width="1.5"></path></svg>',
    news:
      '<svg class="news-fallback" viewBox="0 0 24 24" width="100" height="60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" fill="#d2d7df"></rect><rect x="5" y="6" width="12" height="3" fill="#a0a7b3"></rect><rect x="5" y="10" width="14" height="2" fill="#a0a7b3"></rect><rect x="5" y="13" width="9" height="2" fill="#a0a7b3"></rect></svg>',
    logo:
      '<svg class="brand-logo-fallback" viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="8" fill="#0a3d62"></rect><path d="M14 30l10-12 10 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
  };

  // پاک‌سازی رشته‌ها برای رفع \n و فاصله‌های اضافه
  function cleanText(t) {
    return String(t || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // ساخت URL با پارامتر bust اختیاری (برای جلوگیری از کش ناخواسته CDN/Proxy روی تصاویر)
  function bustUrl(url, bust = false, ttlMinutes = 5) {
    try {
      if (!bust) return url;
      const u = new URL(url, location.origin);
      // هر ttlMinutes دقیقه، مقدار v تغییر می‌کند
      const v = Math.floor(Date.now() / (ttlMinutes * 60 * 1000));
      u.searchParams.set("v", v);
      return u.toString();
    } catch {
      // اگر URL نسبی نامعتبر بود، fallback ساده:
      const sep = url.includes("?") ? "&" : "?";
      const v = Math.floor(Date.now() / (ttlMinutes * 60 * 1000));
      return `${url}${sep}v=${v}`;
    }
  }

  // رندر تصویر با fallback؛ امکان bust کش تصاویر با options.bust
  function imageOrNone(url, fallbackSvg, cls, options = { bust: false, ttlMinutes: 5 }) {
    if (!url || !String(url).trim()) return "";
    const safeUrl = String(url).replace(/"/g, "&quot;");
    const finalUrl = bustUrl(safeUrl, !!options.bust, options.ttlMinutes || 5);
    // توجه: برای امنیت، فقط src را جایگزین می‌کنیم؛ fallback SVG در onerror تزریق می‌شود.
    return `<img src="${finalUrl}" alt="" class="${cls || ""}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  // تاریخ به فارسی
  function formatDateFA(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("fa-IR");
    } catch {
      return iso || "";
    }
  }

  // مدیریت ساعت زنده با رجیستری برای جلوگیری از باقی‌ماندن intervalها
  const ClockRegistry = new Map();

  function liveClock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    // اگر قبلاً برای این elId ساعتی فعال بوده، پاکش کن
    if (ClockRegistry.has(elId)) {
      clearInterval(ClockRegistry.get(elId));
      ClockRegistry.delete(elId);
    }
    // مقدار اولیه
    el.textContent = new Date().toLocaleString("fa-IR");
    // interval جدید
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

  // توقف تمام ساعت‌ها (برای تغییر صفحه یا برگشت از bfcache)
  function stopAllClocks() {
    ClockRegistry.forEach((intervalId) => clearInterval(intervalId));
    ClockRegistry.clear();
  }

  // رویداد pageshow برای bfcache: وقتی صفحه از حافظه برمی‌گردد، ساعت‌ها را ری‌ست کن
  // این کار مانع از نمایش وضعیت "منجمد" ساعت‌ها می‌شود و احساس محتوای قبلی را از بین می‌برد.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      // ساعت‌های قبلی را قطع کن؛ رندر صفحه جدید شما باید دوباره liveClock‌ها را صدا بزند.
      stopAllClocks();
    }
  });

  // ابزار امن برای استفاده در نیازهای عمومی
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

  // خروجی عمومی
  global.DefaultIcons = DefaultIcons;
  global.imageOrNone = imageOrNone;
  global.formatDateFA = formatDateFA;
  global.liveClock = liveClock;
  global.stopAllClocks = stopAllClocks;
  global.cleanText = cleanText;
  global.domReady = domReady;
  global.isExternalLink = isExternalLink;
})(window);
