// data.js - مسیرهای امن برای صفحات مختلف (ریشه و زیرپوشه‌ها)
(function (global) {
  const cache = {};

  // BASE برای هر صفحه: اگر در ریشه هستیم ""، اگر در زیرپوشه‌ای هستیم "../" یا "../../"
  function getBase() {
    const path = location.pathname;
    // نمونه‌ها:
    // "/": base ""
    // "/news": base "../" برای دسترسی به /data از /news/
    // "/news/live/": base "../../"
    // "/login/": base "../"
    // "/dash/admin/": base "../../"
    // "/dash/student": base "../../"
    // قاعده: تعداد سطح‌های پوشه را بشماریم و "../" به همان تعداد اضافه کنیم تا به ریشه برسیم.
    const parts = path.split("/").filter(Boolean);
    const depth = parts.length; // "news" → 1، "news/live" → 2، "dash/admin" → 2
    return depth === 0 ? "" : "../".repeat(depth);
  }

  const BASE = getBase();

  async function loadJSON(relPath) {
    const fullPath = BASE + "data/" + relPath;
    if (cache[fullPath]) return cache[fullPath];
    const res = await fetch(fullPath, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + fullPath);
    const json = await res.json();
    cache[fullPath] = json;
    return json;
  }

  const Data = {
    getAnnouncements: () => loadJSON("announcements.json"),
    getNews: () => loadJSON("news.json"),
    getLive: () => loadJSON("live.json"),
    getStudents: () => loadJSON("students.json"),
    getSchedules: () => loadJSON("schedules.json"),
    getReportcards: () => loadJSON("reportcards.json")
  };

  global.Data = Data;
})(window);
