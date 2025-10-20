// data.js - بارگذاری و کش ساده داده‌ها از فایل‌های JSON محلی (مسیرهای نسبی)

const Data = (() => {
  const cache = {};

  async function loadJSON(path) {
    if (cache[path]) return cache[path];
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + path);
    const json = await res.json();
    cache[path] = json;
    return json;
  }

  const sources = {
    announcements: "/data/announcements.json",
    news: "/data/news.json",
    live: "/data/live.json",
    students: "/data/students.json",
    schedules: "/data/schedules.json",
    reportcards: "/data/reportcards.json"
  };

  return {
    getAnnouncements: () => loadJSON(sources.announcements),
    getNews: () => loadJSON(sources.news),
    getLive: () => loadJSON(sources.live),
    getStudents: () => loadJSON(sources.students),
    getSchedules: () => loadJSON(sources.schedules),
    getReportcards: () => loadJSON(sources.reportcards)
  };
})();
