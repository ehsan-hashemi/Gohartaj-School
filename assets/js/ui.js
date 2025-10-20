// ui.js - کامپوننت‌ها و رندر بخش‌ها

const UI = (() => {
  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("fa-IR");
    } catch {
      return dateStr;
    }
  }

  function card(title, body, meta) {
    return `
      <article class="card">
        <h3 class="card-title">${title}</h3>
        ${body ? `<p class="card-body">${body}</p>` : ""}
        ${meta ? `<div class="card-meta">${meta}</div>` : ""}
      </article>
    `;
  }

  function headerSection(title, actionsHtml = "") {
    return `
      <section class="section-header">
        <h2 class="section-title">${title}</h2>
        <div class="section-actions">${actionsHtml}</div>
      </section>
    `;
  }

  function list(itemsHtml) {
    return `<div class="list">${itemsHtml}</div>`;
  }

  function leftNav(items) {
    return `
      <aside class="left-nav">
        <nav class="side-nav">
          ${items.map(i => `
            <a href="${i.href}" data-link class="side-link ${i.active ? 'active' : ''}">
              <span class="side-icon">${i.icon || '•'}</span>
              <span class="side-text">${i.text}</span>
            </a>
          `).join("")}
        </nav>
      </aside>
    `;
  }

  function containerWithNav(navHtml, contentHtml) {
    return `
      <div class="dash-layout">
        ${navHtml}
        <section class="dash-content">
          ${contentHtml}
        </section>
      </div>
    `;
  }

  // صفحات

  async function homePage() {
    const anns = await Data.getAnnouncements();
    const news = await Data.getNews();

    const annHtml = anns.map(a =>
      card(a.title, a.body, `${formatDate(a.published_at)} • ${a.author || ""}`)
    ).join("");

    const newsHtml = news.map(n =>
      card(n.title, n.body, formatDate(n.published_at))
    ).join("");

    return `
      ${headerSection("اطلاعیه‌ها")}
      ${list(annHtml)}
      ${headerSection("اخبار", `<a href="/news" data-link class="btn">مشاهده همه اخبار</a> <a href="/news/live" data-link class="btn btn-secondary">خبر زنده</a>`)}
      ${list(newsHtml)}
    `;
  }

  async function newsPage() {
    const news = await Data.getNews();
    const newsHtml = news.map(n =>
      card(n.title, n.body, formatDate(n.published_at))
    ).join("");

    return `
      ${headerSection("اخبار")}
      ${list(newsHtml)}
    `;
  }

  async function livePage() {
    const live = await Data.getLive();
    const embed = live && live.live_embed_code ? live.live_embed_code : "<p>پخش زنده در دسترس نیست.</p>";

    return `
      ${headerSection("خبر زنده")}
      <div class="live-wrapper">
        ${embed}
      </div>
      <div class="live-meta">
        <h3>${live.title || ""}</h3>
        <p>${live.body || ""}</p>
        <small>${formatDate(live.published_at || "")}</small>
      </div>
    `;
  }

  function loginPage() {
    return `
      <section class="login-section">
        <form id="login-form" class="card form-card">
          <h2>ورود به داشبورد</h2>
          <label>نام و نام خانوادگی
            <input type="text" name="full_name" required placeholder="مثلاً علی رضایی">
          </label>
          <label>کد ملی
            <input type="text" name="national_id" required placeholder="مثلاً 1111111111">
          </label>
          <label>رمز عبور
            <input type="password" name="password" required placeholder="رمز عبور">
          </label>
          <button type="submit" class="btn">ورود</button>
          <p id="login-error" class="error"></p>
        </form>
      </section>
    `;
  }

  async function adminDash(user) {
    const data = await Data.getStudents();
    const students = data.students || [];

    const nav = leftNav([
      { href: "/dash/admin", text: "نمای کلی", icon: "🏠", active: true },
      { href: "/news", text: "اخبار", icon: "📰" },
      { href: "/news/live", text: "خبر زنده", icon: "📺" }
    ]);

    const panel = `
      <section class="card">
        <h3>جست‌وجوی دانش‌آموزان</h3>
        <div class="filters">
          <input type="text" id="q" placeholder="نام یا کد ملی">
          <input type="text" id="class_q" placeholder="مثلاً هفتم ۲">
          <button class="btn" id="search_btn">جست‌وجو</button>
        </div>
        <div id="results" class="student-list"></div>
      </section>
    `;

    const html = containerWithNav(nav, panel);

    // پس از رندر، اسکریپت جست‌وجو را وصل می‌کنیم
    requestAnimationFrame(() => {
      const results = document.getElementById("results");
      const q = document.getElementById("q");
      const cq = document.getElementById("class_q");
      const btn = document.getElementById("search_btn");

      function renderList(items) {
        results.innerHTML = items.map(s => `
          <div class="student-item">
            <img src="${s.profile_image}" alt="${s.full_name}" class="avatar">
            <div class="student-meta">
              <strong>${s.full_name}</strong>
              <div>کد ملی: ${s.national_id}</div>
              <div>کلاس: ${s.class_name || "-"}</div>
              <div>پایه: ${s.grade_level || "-"}</div>
            </div>
          </div>
        `).join("") || "<p>نتیجه‌ای یافت نشد.</p>";
      }

      function search() {
        const qv = q.value.trim();
        const cv = cq.value.trim();
        const filtered = students.filter(s => {
          const matchQ = qv ? (s.full_name.includes(qv) || s.national_id.includes(qv)) : true;
          const matchC = cv ? (s.class_name === cv) : true;
          return matchQ && matchC;
        });
        renderList(filtered);
      }

      btn.addEventListener("click", search);
      renderList(students); // بار اول همه را نشان بده
    });

    return html;
  }

  async function studentDash(user) {
    const schedules = await Data.getSchedules();
    const reportcards = await Data.getReportcards();
    const myReports = reportcards.filter(r => r.student_national_id === user.national_id);

    const nav = leftNav([
      { href: "/dash/student", text: "خانه", icon: "🏠", active: true },
      { href: "/dash/student#profile", text: "پروفایل", icon: "👤" },
      { href: "/dash/student#schedule", text: "برنامه کلاسی", icon: "📚" },
      { href: "/dash/student#reportcards", text: "کارنامه", icon: "📝" }
    ]);

    const home = `
      <section class="card">
        <h3>وضعیت کلاس</h3>
        <div class="student-status">
          <img src="${user.profile_image}" alt="${user.full_name}" class="avatar xl">
          <div>
            <div><strong>نام:</strong> ${user.full_name}</div>
            <div><strong>کلاس:</strong> ${user.class_name || "-"}</div>
            <div><strong>پایه:</strong> ${user.grade_level || "-"}</div>
            <div><strong>تاریخ و زمان:</strong> <span id="dt"></span></div>
            <div><strong>وضعیت کارنامه:</strong> ${myReports.length ? myReports.map(r => `ترم ${r.term}`).join("، ") : "ناموجود"}</div>
          </div>
        </div>
      </section>
    `;

    const profile = `
      <section class="card">
        <h3>پروفایل</h3>
        <div class="profile-view">
          <img src="${user.profile_image}" alt="${user.full_name}" class="avatar xl">
          <div class="profile-grid">
            <div><span class="label">نام و نام خانوادگی:</span> ${user.full_name}</div>
            <div><span class="label">کد ملی:</span> ${user.national_id}</div>
            <div><span class="label">نقش:</span> دانش‌آموز</div>
            <div><span class="label">پایه:</span> ${user.grade_level || "-"}</div>
            <div><span class="label">کلاس:</span> ${user.class_name || "-"}</div>
          </div>
        </div>
      </section>
    `;

    const scheduleData = user.class_name && schedules[user.class_name] ? schedules[user.class_name] : null;
    const schedule = `
      <section class="card">
        <h3>برنامه کلاسی</h3>
        ${scheduleData ? `
          <div class="schedule-grid">
            ${Object.entries(scheduleData).map(([day, lessons]) => `
              <div class="schedule-day">
                <div class="day-name">${day}</div>
                <ul class="lesson-list">
                  ${lessons.map(l => `<li class="lesson-item">${l}</li>`).join("")}
                </ul>
              </div>
            `).join("")}
          </div>
        ` : `<p>برای کلاس شما برنامه‌ای ثبت نشده است.</p>`}
      </section>
    `;

    const reports = `
      <section class="card">
        <h3>کارنامه</h3>
        ${myReports.length ? `
          <ul class="report-list">
            ${myReports.map(r => `
              <li class="report-item">
                <span>ترم ${r.term}</span>
                <a class="btn btn-secondary" href="${r.file_url}" target="_blank" rel="noopener">مشاهده / چاپ</a>
              </li>
            `).join("")}
          </ul>
        ` : `<p>کارنامه‌ای موجود نیست.</p>`}
      </section>
    `;

    const content = `
      ${home}
      ${profile}
      ${schedule}
      ${reports}
    `;

    const html = containerWithNav(nav, content);

    requestAnimationFrame(() => {
      const dt = document.getElementById("dt");
      if (dt) dt.textContent = new Date().toLocaleString("fa-IR");
    });

    return html;
  }

  return {
    homePage,
    newsPage,
    livePage,
    loginPage,
    adminDash,
    studentDash
  };
})();