// data.js — بارگذاری JSON از مسیر مطلق، حذف کش داخلی اختلال‌زا، و امکان اجبار تازه بودن

(function (global) {
  // تولید کلید bust یکتا هنگام درخواست (اختیاری برای اجبار تازه بودن)
  function bustKey() {
    return `${Date.now()}-${Math.round(performance.now())}`;
  }

  async function loadJSON(name, options = {}) {
    const fresh = !!options.fresh; // اگر true باشد، به‌اجبار از شبکه تازه می‌گیرد
    const v = fresh ? bustKey() : Math.floor(Date.now() / (5 * 60 * 1000)); // 5 دقیقه‌ای، یا یکتا
    const url = `/data/${name}?v=${v}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: fresh ? { "Cache-Control": "no-cache" } : {}
    });
    if (!res.ok) throw new Error("Failed to load " + url);
    return await res.json();
  }

  const Data = {
    getAnnouncements: (opts) => loadJSON("announcements.json", opts),
    getNews:          (opts) => loadJSON("news.json", opts),
    getLive:          (opts) => loadJSON("live.json", opts),
    getStudents:      (opts) => loadJSON("students.json", opts),
    getSchedules:     (opts) => loadJSON("schedules.json", opts),
    getReportcards:   (opts) => loadJSON("reportcards.json", opts)
  };

  global.Data = Data;
})(window);
