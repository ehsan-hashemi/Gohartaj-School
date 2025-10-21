// data.js — بارگذاری JSON از مسیر مطلق ریشه، حذف BASE نسبی، و bust سبک زمان‌دار

(function (global) {
  const cache = {};

  // هر 5 دقیقه یک کلید bust جدید (برای دور زدن کش‌های بین‌راهی)
  function bustKey() {
    return Math.floor(Date.now() / (5 * 60 * 1000));
  }

  async function loadJSON(name) {
    // مسیر مطلق: همیشه /data/... تا مستقل از مسیر فعلی صفحه کار کند
    const url = `/data/${name}?v=${bustKey()}`;

    // کش داخلی فقط 60 ثانیه معتبر است
    const c = cache[url];
    if (c && (Date.now() - c.ts) < 60 * 1000) return c.data;

    // اجبار به دریافت تازه از شبکه
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
