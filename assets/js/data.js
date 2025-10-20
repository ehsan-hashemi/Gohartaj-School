// data.js - بارگذاری و کش ساده داده‌ها از فایل‌های JSON محلی یا GitHub Pages

const Data = (() => {
  const cache = {};

  // تشخیص Base URL
  // اگر روی GitHub Pages هستی (مثلاً username.github.io/repo-name/)،
  // repoName رو اینجا وارد کن:
  const REPO_NAME = "gohartaj-school"; // 👈 اسم ریپوی خودت رو جایگزین کن
  let BASE_URL = "https://gohartaj.ehsanpg.ir/";

  if (location.hostname.includes("github.io")) {
    // روی GitHub Pages
    BASE_URL = `/${REPO_NAME}`;
  }

  async function loadJSON(path) {
    const fullPath = `${BASE_URL}/${path}`;
    if (cache[fullPath]) return cache[fullPath];
    const res = await fetch(fullPath, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + fullPath);
    const json = await res.json();
    cache[fullPath] = json;
    return json;
  }

  // منابع داده
  const sources = {
    announcements: "data/announcements.json",
    news: "data/news.json",
    live: "data/live.json",
    students: "data/students.json",
    schedules: "data/schedules.json",
    reportcards: "data/reportcards.json"
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
