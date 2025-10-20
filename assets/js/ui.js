// ui.js - کامپوننت‌ها و ویوها، بدون ایموجی، رسمی، بخش‌بندی واضح

const UI = (() => {
  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("fa-IR");
    } catch {
      return dateStr;
    }
  }

  function imageOrNothing(url, fallbackSvg, cssClass = "") {
    if (!url || url.trim() === "") return "";
    const escaped = url.replace(/"/g, "&quot;");
    return `<img src="${escaped}" alt="" class="${cssClass}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  function headerSection(title, actionsHtml = "") {
    return `
      <section class="section-header">
        <h2 class="section-title">${title}</h2>
        <div class="section-actions">${actionsHtml}</div>
      </section>
    `;
  }

  function card(title, body, meta, imgUrl = "") {
    const imgHtml = imgUrl ? `<div class="card-media">${imageOrNothing(imgUrl, DefaultIcons.news, "news-image")}</div>` : "";
    return `
      <article class="card">
        ${imgHtml}
        <div class="card-content">
          <h3 class="card-title">${title}</h3>
          ${body ? `<p class="card-body">${body}</p>` : ""}
          ${meta ? `<div class="card-meta">${meta}</div>` : ""}
        </div>
      </article>
    `;
  }

  function leftNav(items) {
    return `
      <aside class="left-nav">
        <nav class="side-nav">
          ${items.map(i => `
            <a href="${i.href}" data-link class="side-link ${i.active ? 'active' : ''}">
              <span class="side-text">${i.text}</span>
            </a>
          `).join("")}
        </nav>
      </aside>
    `;
  }

  function layoutWithNav(navHtml, contentHtml) {
    return `
      <div class="dash-layout">
        ${navHtml}
        <section class="dash-content">
          ${contentHtml}
        </section>
      </div>
    `;
  }

  // Pages
  async function homePage() {
    const anns = await Data.getAnnouncements();
    const news = await Data.getNews();

    const annHtml = anns.map(a =>
      card(a.title, a.body, `${formatDate(a.published_at)}${a.author ? " • " + a.author : ""}`, a.image_url || "")
    ).join("");

    const newsHtml = news.map(n =>
      card(n.title, n.body, formatDate(n.published_at), n.image_url || "")
    ).join("");

    return `
      ${headerSection("اطلاعیه‌ها")}
      <div class="list">${annHtml}</div>
      ${headerSection("اخبار", `<a href="/news" data-link class="btn">مشاهده همه اخبار</a> <a href="/news/live" data-link class="btn btn-secondary">خبر زنده</a>`)}
      <div class="list">${newsHtml}</div>
    `;
  }

  async function newsPage() {
    const news = await Data.getNews();
    const newsHtml = news.map(n =>
      card(n.title, n.body, formatDate(n.published_at), n.image_url || "")
    ).join("");
    return `
      ${headerSection("اخبار")}
      <div class="list">${newsHtml}</div>
    `;
  }

  async function livePage() {
    const live = await Data.getLive();
    const embed = live && live.live_embed_code ? live.live_embed_code : "<p class='note'>پخش زنده در دسترس نیست.</p>";
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
          <div class="form-actions">
            <button type="submit" class="btn">ورود</button>
          </div>
          <p id="login-error" class="error"></p>
        </form>
      </section>
    `;
  }

  async function adminDash(user, section = "home") {
    const data = await Data.getStudents();
    const students = data.students || [];
    const schedules = await Data.getSchedules();

    const nav = leftNav([
      { href: "/dash/admin/", text: "خانه", active: section === "home" },
      { href: "/dash/admin/?section=students", text: "دانش‌آموزان", active: section === "students" },
      { href: "/dash/admin/?section=schedules", text: "برنامه کلاس", active: section === "schedules" }
    ]);

    let content = "";
    if (section === "home") {
      content = `
        <section class="card">
          <h3>خانه</h3>
          <div class="grid-2">
            <div>
              <p>به پنل مدیریت خوش آمدید.</p>
              <p>شما می‌توانید دانش‌آموزان را جست‌وجو کنید و برنامه‌های کلاس‌ها را مشاهده کنید.</p>
            </div>
            <div class="clock-box">
              <div class="label">زمان جاری:</div>
              <div id="admin-clock" class="clock"></div>
            </div>
          </div>
        </section>
      `;
    } else if (section === "students") {
      content = `
        <section class="card">
          <h3>دانش‌آموزان</h3>
          <div class="filters">
            <input type="text" id="q" placeholder="نام یا کد ملی">
            <input type="text" id="class_q" placeholder="مثلاً هفتم ۲">
            <button class="btn" id="search_btn">جست‌وجو</button>
          </div>
          <div id="results" class="student-list"></div>
        </section>
      `;
      requestAnimationFrame(() => {
        const results = document.getElementById("results");
        const q = document.getElementById("q");
        const cq = document.getElementById("class_q");
        const btn = document.getElementById("search_btn");

        function renderList(items) {
          results.innerHTML = items.map(s => `
            <div class="student-item">
              ${imageOrNothing(s.profile_image, DefaultIcons.profile, "avatar")}
              <div class="student-meta">
                <div class="strong">${s.full_name}</div>
                <div>کد ملی: ${s.national_id}</div>
                <div>کلاس: ${s.class_name || "-"}</div>
                <div>پایه: ${s.grade_level || "-"}</div>
              </div>
            </div>
          `).join("") || "<p class='note'>نتیجه‌ای یافت نشد.</p>";
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
        renderList(students);
      });
    } else if (section === "schedules") {
      const classes = Object.keys(schedules);
      content = `
        <section class="card">
          <h3>برنامه کلاس</h3>
          <div class="filters">
            <select id="class_select">
              ${classes.map(c => `<option value="${c}">${c}</option>`).join("")}
            </select>
            <button class="btn" id="show_schedule_btn">نمایش برنامه</button>
          </div>
          <div id="schedule_container"></div>
        </section>
      `;
      requestAnimationFrame(() => {
        const select = document.getElementById("class_select");
        const btn = document.getElementById("show_schedule_btn");
        const container = document.getElementById("schedule_container");

        function renderSchedule(cls) {
          const data = schedules[cls];
          if (!data) { container.innerHTML = "<p class='note'>برنامه‌ای یافت نشد.</p>"; return; }
          container.innerHTML = `
            <div class="schedule-grid">
              ${Object.entries(data).map(([day, lessons]) => `
                <div class="schedule-day">
                  <div class="day-name">${day}</div>
                  <ul class="lesson-list">
                    ${lessons.map(l => `<li class="lesson-item">${l}</li>`).join("")}
                  </ul>
                </div>
              `).join("")}
            </div>
          `;
        }

        btn.addEventListener("click", () => renderSchedule(select.value));
        renderSchedule(select.value);
      });
    }

    const html = layoutWithNav(nav, content);
    requestAnimationFrame(() => attachAdminClock());
    return html;
  }

  async function studentDash(user, section = "home") {
    const schedules = await Data.getSchedules();
    const reportcards = await Data.getReportcards();
    const myReports = reportcards.filter(r => r.student_national_id === user.national_id);

    const nav = leftNav([
      { href: "/dash/student", text: "خانه", active: section === "home" },
      { href: "/dash/student?section=profile", text: "پروفایل", active: section === "profile" },
      { href: "/dash/student?section=schedule", text: "برنامه کلاسی", active: section === "schedule" },
      { href: "/dash/student?section=reportcards", text: "کارنامه", active: section === "reportcards" }
    ]);

    let content = "";
    if (section === "home") {
      content = `
        <section class="card">
          <h3>خانه</h3>
          <div class="grid-2">
            <div class="student-status">
              ${imageOrNothing(user.profile_image, DefaultIcons.profile, "avatar xl")}
              <div>
                <div><span class="label">نام:</span> ${user.full_name}</div>
                <div><span class="label">کلاس:</span> ${user.class_name || "-"}</div>
                <div><span class="label">پایه:</span> ${user.grade_level || "-"}</div>
                <div><span class="label">زمان:</span> <span id="student-clock" class="clock"></span></div>
                <div><span class="label">کارنامه:</span> ${myReports.length ? myReports.map(r => `ترم ${r.term}`).join("، ") : "ناموجود"}</div>
              </div>
            </div>
          </div>
        </section>
      `;
    } else if (section === "profile") {
      content = `
        <section class="card">
          <h3>پروفایل</h3>
          <div class="profile-view">
            ${imageOrNothing(user.profile_image, DefaultIcons.profile, "avatar xl")}
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
    } else if (section === "schedule") {
      const scheduleData = user.class_name && schedules[user.class_name] ? schedules[user.class_name] : null;
      content = `
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
          ` : `<p class='note'>برای کلاس شما برنامه‌ای ثبت نشده است.</p>`}
        </section>
      `;
    } else if (section === "reportcards") {
      content = `
        <section class="card">
          <h3>کارنامه</h3>
          ${myReports.length ? `
            <ul class="report-list">
              ${myReports.map(r => `
                <li class="report-item">
                  <span>ترم ${r.term}</span>
                  <a class="btn btn-secondary" href="${r.file_url}" target="_blank" rel="noopener">مشاهده</a>
                </li>
              `).join("")}
            </ul>
          ` : `<p class='note'>کارنامه‌ای موجود نیست.</p>`}
        </section>
      `;
    }

    const html = layoutWithNav(nav, content);
    requestAnimationFrame(() => attachStudentClock());
    return html;
  }

  // clocks
  function attachAdminClock() {
    const el = document.getElementById("admin-clock");
    if (!el) return;
    el.textContent = new Date().toLocaleString("fa-IR");
    const id = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(id); return; }
      el.textContent = new Date().toLocaleString("fa-IR");
    }, 1000);
  }
  function attachStudentClock() {
    const el = document.getElementById("student-clock");
    if (!el) return;
    el.textContent = new Date().toLocaleString("fa-IR");
    const id = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(id); return; }
      el.textContent = new Date().toLocaleString("fa-IR");
    }, 1000);
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
