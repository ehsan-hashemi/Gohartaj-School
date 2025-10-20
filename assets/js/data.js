// assets/js/data.js — محاسبه‌ی BASE دقیق برای همه‌ی صفحات و پوشه‌ها

(function (global) {
  const cache = {};

  // BASE برای رسیدن به /data از هر صفحه
  function getBaseToRoot() {
    // مثال‌ها:
    // /                → ""
    // /news            → "../"
    // /news/live/      → "../../"
    // /login/          → "../"
    // /dash/admin/     → "../../"
    // /dash/student    → "../../"
    // /news/123/       → "../../"
    const path = location.pathname;
    // حذف اسلش انتهایی برای شمارش دقیق، به جز ریشه
    const p = path === "/" ? "/" : path.replace(/\/+$/, "");
    const parts = p.split("/").filter(Boolean);
    // تعداد ../ برابر با تعداد بخش‌های پوشه
    const depth = parts.length;
    return depth === 0 ? "" : "../".repeat(depth);
  }

  const BASE = getBaseToRoot(); // مثل "../" یا "../../" و ...

  async function loadJSON(name) {
    const fullPath = `${BASE}data/${name}`;
    if (cache[fullPath]) return cache[fullPath];
    const res = await fetch(fullPath, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + fullPath);
    const json = await res.json();
    cache[fullPath] = json;
    return json;
  }

  const Data = {
    getAnnouncements: () => loadJSON("announcements.json"),
    getNews:         () => loadJSON("news.json"),
    getLive:         () => loadJSON("live.json"),
    getStudents:     () => loadJSON("students.json"),
    getSchedules:    () => loadJSON("schedules.json"),
    getReportcards:  () => loadJSON("reportcards.json")
  };

  global.Data = Data;
})(window);
