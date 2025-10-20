// data.js — بارگذاری JSON با BASE دقیق، جلوگیری از کش ناخواسته، و bust سبک زمان‌دار

(function (global) {
  // کش داخلی زمان‌دار (اختیاری)
  const cache = {};

  function getBaseToRoot() {
    const path = location.pathname;
    const p = path === "/" ? "/" : path.replace(/\/+$/, "");
    const parts = p.split("/").filter(Boolean);
    const depth = parts.length;
    return depth === 0 ? "" : "../".repeat(depth);
  }

  const BASE = getBaseToRoot();
  // هر 5 دقیقه یک کلید bust جدید
  const BUST = Math.floor(Date.now() / (5 * 60 * 1000));

  async function loadJSON(name) {
    const url = `${BASE}data/${name}?v=${BUST}`;
    // کش داخلی فقط 60 ثانیه معتبر است
    const c = cache[url];
    if (c && (Date.now() - c.ts) < 60 * 1000) return c.data;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + url);
    const json = await res.json();
    cache[url] = { data: json, ts: Date.now() };
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
