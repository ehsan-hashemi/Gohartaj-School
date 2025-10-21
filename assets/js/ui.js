// ui.js — ویوها با تازه‌سازی تضمینی و سازگار با چرخه‌عمر Router

const UI = (() => {
  function formatDate(dateStr) {
    try { return new Date(dateStr).toLocaleString("fa-IR"); } catch { return dateStr || ""; }
  }

  function cleanText(t) {
    return Router.cleanText ? Router.cleanText(t) : String(t || "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  function imageOrNothing(url, fallbackSvg, cssClass = "", hard = false) {
    if (!url || url.trim() === "") return "";
    const escaped = url.replace(/"/g, "&quot;");
    const busted = typeof bustUrl === "function"
      ? bustUrl(escaped, { mode: hard ? "hard" : "soft", ttlMinutes: 5 })
      : escaped;
    return `<img src="${busted}" alt="" class="${cssClass}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
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
          <h3 class="card-title">${cleanText(title)}</h3>
          ${body ? `<p class="card-body">${cleanText(body)}</p>` : ""}
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

  // خانه — تازه
  async function homePage() {
    const anns = await Data.getAnnouncements({ fresh: true });
    const news = await Data.getNews({ fresh: true });

    const annHtml = (anns || []).map(a =>
      card(a.title, a.body, `${formatDate(a.published_at)}${a.author ? " • " + cleanText(a.author) : ""}`, a.image_url || "")
    ).join("");

    const newsHtml = (news || []).map(n => {
      const meta = `${formatDate(n.published_at)}${n.author ? " • " + cleanText(n.author) : ""}`;
      const body = cleanText(n.body || "");
      const summary = body.length > 180 ? body.slice(0, 180) + "…" : body;
      const img = n.image_url || "";
      return `
        <article class="card">
          ${img ? `<div class="card-media">${imageOrNothing(img, DefaultIcons.news, "news-image")}</div>` : ""}
          <div class="card-content">
            <h3 class="card-title"><a href="/news/item/?id=${n.id}" data-link class="link-btn">${cleanText(n.title || "خبر")}</a></h3>
            <p class="card-body">${summary}</p>
            <div class="card-meta">${meta}</div>
          </div>
        </article>
      `;
    }).join("");

    return `
      ${headerSection("اطلاعیه‌ها")}
      <div class="list">${annHtml || "<p class='note'>اطلاعیه‌ای موجود نیست.</p>"}</div>

      ${headerSection("اخبار", `<a href="/news" data-link class="btn">مشاهده همه اخبار</a> <a href="/news/live" data-link class="btn btn-secondary">خبر زنده</a>`)}
      <div class="list">${newsHtml || "<p class='note'>خبری موجود نیست.</p>"}</div>
    `;
  }

  // اخبار — تازه
  async function newsPage() {
    const PAGE_SIZE = 6;
    let items = await Data.getNews({ fresh: true });
    items = (items || []).map(n => ({
      ...n,
      _date: n.published_at ? new Date(n.published_at).getTime() : 0,
      _title: cleanText(n.title || "خبر"),
      _body: cleanText(n.body || "")
    })).sort((a, b) => b._date - a._date);

    const html = `
      ${headerSection("اخبار")}
      <section class="card">
        <div class="panel-head">
          <div class="info-line">
            <span class="label">مرتب‌سازی:</span>
            <div class="btn-group">
              <button class="btn btn-soft" id="sort-newest">جدیدترین</button>
              <button class="btn btn-soft" id="sort-oldest">قدیمی‌ترین</button>
            </div>
          </div>
        </div>

        <div class="search-box mt-12">
          <input id="news-search" type="text" placeholder="جست‌وجو در عنوان و متن خبر">
          <button class="btn btn-outline" id="news-search-btn">جست‌وجو</button>
        </div>

        <div id="news-list" class="news-grid mt-12"></div>
        <div class="pagination mt-12" id="pager"></div>
      </section>
    `;

    // رویدادها + teardown مرکزی
    requestAnimationFrame(() => {
      const listEl = document.getElementById("news-list");
      const pagerEl = document.getElementById("pager");
      const qEl = document.getElementById("news-search");
      const qBtn = document.getElementById("news-search-btn");
      const sortNewest = document.getElementById("sort-newest");
      const sortOldest = document.getElementById("sort-oldest");

      let filtered = items.slice();
      let currentPage = 1;

      function renderPage(page = 1) {
        currentPage = page;
        const start = (page - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(start, start + PAGE_SIZE);

        listEl.innerHTML = pageItems.map(n => {
          const summary = n._body.length > 180 ? n._body.slice(0, 180) + "…" : n._body;
          const imgHtml = n.image_url
            ? `<div class="card-media">${imageOrNothing(n.image_url, DefaultIcons.news, "news-image")}</div>`
            : "";
          const meta = `${formatDate(n.published_at || "")}${n.author ? " • " + cleanText(n.author) : ""}`;
          return `
            <article class="card hover-soft">
              ${imgHtml}
              <div class="card-content">
                <h4 class="card-title">
                  <a href="/news/item/?id=${n.id}" data-link class="link-btn">${n._title}</a>
                </h4>
                <p class="card-body">${summary}</p>
                <div class="card-meta">${meta}</div>
              </div>
            </article>
          `;
        }).join("") || "<p class='note'>خبری یافت نشد.</p>";

        const pages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
        pagerEl.innerHTML = Array.from({length: pages}, (_, i) => i + 1).map(p => `
          <a href="#" class="page-link ${p === currentPage ? 'text-strong border-strong' : ''}" data-page="${p}">${p}</a>
        `).join("");

        pagerEl.querySelectorAll(".page-link").forEach(a => {
          const onClick = (e) => { e.preventDefault(); const p = parseInt(a.getAttribute("data-page"), 10); renderPage(p); };
          a.addEventListener("click", onClick);
          Router.registerTeardown(() => a.removeEventListener("click", onClick));
        });
      }

      function applySearch() {
        const q = cleanText(qEl.value || "");
        if (!q) { filtered = items.slice(); renderPage(1); return; }
        const qa = q.toLowerCase();
        filtered = items.filter(n =>
          String(n._title).toLowerCase().includes(qa) ||
          String(n._body).toLowerCase().includes(qa)
        );
        renderPage(1);
      }

      const onSearchBtn = () => applySearch();
      const onSearchEnter = (e) => { if (e.key === "Enter") applySearch(); };
      const onNewest = () => { items.sort((a,b) => b._date - a._date); applySearch(); };
      const onOldest = () => { items.sort((a,b) => a._date - b._date); applySearch(); };

      qBtn.addEventListener("click", onSearchBtn);
      qEl.addEventListener("keydown", onSearchEnter);
      sortNewest.addEventListener("click", onNewest);
      sortOldest.addEventListener("click", onOldest);

      Router.registerTeardown(() => {
        qBtn.removeEventListener("click", onSearchBtn);
        qEl.removeEventListener("keydown", onSearchEnter);
        sortNewest.removeEventListener("click", onNewest);
        sortOldest.removeEventListener("click", onOldest);
      });

      renderPage(1);
    });

    return html;
  }

  // خبر زنده — تازه
  async function livePage() {
    const live = await Data.getLive({ fresh: true });
    const embed = live && live.live_embed_code ? live.live_embed_code : "<p class='note'>پخش زنده در دسترس نیست.</p>";
    return `
      ${headerSection("خبر زنده")}
      <div class="live-wrapper">
        ${embed}
      </div>
      <div class="live-meta">
        <h3>${cleanText(live.title || "")}</h3>
        <p>${cleanText(live.body || "")}</p>
        <small>${formatDate(live.published_at || "")}</small>
      </div>
    `;
  }

  // جزئیات خبر — داده‌های تازه و bust سخت برای رسانه‌ها
  async function newsItemPage(id) {
    const all = await Data.getNews({ fresh: true });
    const item = (all || []).find(n => String(n.id) === String(id));

    if (!item) {
      return `
        ${headerSection("جزئیات خبر")}
        <section class="card">
          <h3>خبر یافت نشد</h3>
          <p class="note">شناسه خبر معتبر نیست یا خبر حذف شده است.</p>
        </section>
      `;
    }

    const title = cleanText(item.title || "خبر");
    const body = cleanText(item.body || "");
    const meta = `${formatDate(item.published_at || "")}${item.author ? " • " + cleanText(item.author) : ""}`;

    const hasImage = item.image_url && item.image_url.trim();
    const hasVideo = item.video_url && item.video_url.trim();
    let mediaHtml = "";
    if (hasImage) {
      // برای صفحه آیتم خبر، bust سخت روی تصویر اعمال می‌کنیم
      mediaHtml += `<div class="mb-12">${imageOrNothing(item.image_url, DefaultIcons.news, "news-image", true)}</div>`;
    }
    if (hasVideo) {
      if (/\.(mp4|webm|ogg)$/i.test(item.video_url)) {
        const type = item.video_url.split(".").pop().toLowerCase();
        mediaHtml += `
          <video class="news-image" controls preload="metadata">
            <source src="${item.video_url}" type="video/${type}">
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        `;
      } else {
        mediaHtml += `<div class="mb-12">${item.video_url}</div>`;
      }
    }

    const related = (all || [])
      .filter(n => String(n.id) !== String(id))
      .map(n => ({ ...n, _date: n.published_at ? new Date(n.published_at).getTime() : 0 }))
      .sort((a, b) => b._date - a._date)
      .slice(0, 6);

    const relatedHtml = related.map(n => `
      <article class="card card-slim lift">
        ${n.image_url ? `<div class="card-media">${imageOrNothing(n.image_url, DefaultIcons.news, "news-image")}</div>` : ""}
        <div class="card-content">
          <h4 class="card-title"><a class="link-btn" href="/news/item/?id=${n.id}" data-link>${cleanText(n.title || "خبر")}</a></h4>
          <p class="card-body">${cleanText(n.body || "").slice(0, 130)}${(n.body || "").length > 130 ? "…" : ""}</p>
          <div class="card-meta">${formatDate(n.published_at || "")}${n.author ? " • " + cleanText(n.author) : ""}</div>
        </div>
      </article>
    `).join("");

    return `
      <nav class="breadcrumbs">
        <a href="/news" data-link class="link-btn">اخبار</a>
        <span class="pipe"></span>
        <span class="muted">جزئیات خبر</span>
      </nav>

      <section class="card">
        <h3 class="heading-line">${title}</h3>
        <div class="card-media">${mediaHtml}</div>
        <div class="card-body"><p>${body}</p></div>
        <div class="card-meta">${meta}</div>
      </section>

      <section class="card">
        <h4 class="heading-line">خبرهای مرتبط</h4>
        <div class="grid-auto-fit mt-12">${relatedHtml || "<p class='note'>خبر مرتبطی یافت نشد.</p>"}</div>
      </section>
    `;
  }

  function loginPage() {
    return `
      <section class="login-section">
        <form id="login-form" class="card form-card">
          <h2>ورود به داشبورد</h2>
          <label>نام و نام خانوادگی
            <input type="text" name="full_name" required placeholder="مثلاً علی رضایی" autocomplete="name">
          </label>
          <label>کد ملی
            <input type="text" name="national_id" required placeholder="مثلاً 1111111111" inputmode="numeric" autocomplete="off">
          </label>
          <label>رمز عبور
            <input type="password" name="password" required placeholder="رمز عبور" autocomplete="current-password">
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
    const data = await Data.getStudents({ fresh: true });
    const students = data.students || [];
    const schedules = await Data.getSchedules({ fresh: true });

    const nav = leftNav([
      { href: "/dash/admin/", text: "خانه", active: section === "home" },
      { href: "/dash/admin/?section=students", text: "دانش‌آموزان", active: section === "students" },
      { href: "/dash/admin/?section=schedules", text: "برنامه کلاس", active: section === "schedules" }
    ]);

    let content = "";
    if (section === "home") {
      content = `
        <section class="card">
          <div class="panel-head">
            <h3>خانه</h3>
            <div class="info-line">
              <span class="label">مدیر:</span><strong>${cleanText(user.full_name)}</strong>
            </div>
          </div>
          <div class="grid-2">
            <div class="soft-card">
              <div class="heading-line"><strong>راهنما</strong></div>
              <p class="mt-8">از منوی سمت چپ برای مشاهده دانش‌آموزان و برنامه کلاس‌ها استفاده کنید.</p>
              <ul class="icon-list mt-12">
                <li><span></span><span>جست‌وجو بر اساس نام یا کد ملی</span></li>
                <li><span></span><span>فیلتر کلاس‌ها (مثلاً هفتم ۲)</span></li>
                <li><span></span><span>مشاهده برنامه هفتگی هر کلاس</span></li>
              </ul>
            </div>
            <div class="clock-box">
              <div class="label">زمان جاری:</div>
              <div id="admin-clock" class="clock"></div>
            </div>
          </div>
        </section>
      `;
      requestAnimationFrame(() => liveClock("admin-clock"));
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

        function renderList(items) {
          results.innerHTML = items.map(s => `
            <div class="student-item">
              ${imageOrNothing(s.profile_image, DefaultIcons.profile, "avatar")}
              <div class="student-meta">
                <div class="strong">${cleanText(s.full_name)}</div>
                <div>کد ملی: ${cleanText(s.national_id)}</div>
                <div>کلاس: ${cleanText(s.class_name || "-")}</div>
                <div>پایه: ${cleanText(s.grade_level || "-")}</div>
              </div>
            </div>
          `).join("") || "<p class='note'>نتیجه‌ای یافت نشد.</p>";
        }

        function search() {
          const qv = cleanText(q.value || "");
          const cv = cleanText(cq.value || "");
          const filtered = students.filter(s => {
            const full = cleanText(s.full_name);
            const nid = cleanText(s.national_id);
            const cls = cleanText(s.class_name || "");
            const matchQ = qv ? (full.includes(qv) || nid.includes(qv)) : true;
            const matchC = cv ? (cls === cv) : true;
            return matchQ && matchC;
          });
          renderList(filtered);
        }

        const searchBtn = document.getElementById("search_btn");
        searchBtn.addEventListener("click", search);
        Router.registerTeardown(() => searchBtn.removeEventListener("click", search));

        renderList(students);
      });
    } else if (section === "schedules") {
      const classes = Object.keys(schedules || {});
      content = `
        <section class="card">
          <h3>برنامه کلاس</h3>
          <div class="filters">
            <select id="class_select">
              ${classes.map(c => `<option value="${c}">${cleanText(c)}</option>`).join("")}
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
                  <div class="day-name">${cleanText(day)}</div>
                  <ul class="lesson-list">
                    ${lessons.map(l => `<li class="lesson-item">${cleanText(l)}</li>`).join("")}
                  </ul>
                </div>
              `).join("")}
            </div>
          `;
        }

        const onClick = () => renderSchedule(select.value);
        btn.addEventListener("click", onClick);
        Router.registerTeardown(() => btn.removeEventListener("click", onClick));

        renderSchedule(select.value);
      });
    }

    return layoutWithNav(nav, content);
  }

  async function studentDash(user, section = "home") {
    const schedules = await Data.getSchedules({ fresh: true });
    const reportcards = await Data.getReportcards({ fresh: true });
    const myReports = (reportcards || []).filter(r => cleanText(r.student_national_id) === cleanText(user.national_id));

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
          <div class="panel-head">
            <h3>خانه</h3>
            <div class="info-line">
              <span class="label">دانش‌آموز:</span><strong>${cleanText(user.full_name)}</strong>
            </div>
          </div>
          <div class="grid-2">
            <div class="student-status">
              ${imageOrNothing(user.profile_image, DefaultIcons.profile, "avatar xl")}
              <div>
                <div><span class="label">نام:</span> ${cleanText(user.full_name)}</div>
                <div><span class="label">کلاس:</span> ${cleanText(user.class_name || "-")}</div>
                <div><span class="label">پایه:</span> ${cleanText(user.grade_level || "-")}</div>
                <div><span class="label">زمان:</span> <span id="student-clock" class="clock"></span></div>
                <div><span class="label">کارنامه:</span> ${myReports.length ? myReports.map(r => `ترم ${cleanText(r.term)}`).join("، ") : "ناموجود"}</div>
              </div>
            </div>
            <div class="soft-card">
              <div class="heading-line"><strong>نکته‌ها</strong></div>
              <p class="mt-8">برنامه‌ی کلاسی و کارنامه‌هایت را از منوی سمت چپ مشاهده کن.</p>
            </div>
          </div>
        </section>
      `;
      requestAnimationFrame(() => liveClock("student-clock"));
    } else if (section === "profile") {
      content = `
        <section class="card">
          <h3>پروفایل</h3>
          <div class="profile-view">
            ${imageOrNothing(user.profile_image, DefaultIcons.profile, "avatar xl")}
            <div class="profile-grid">
              <div><span class="label">نام و نام خانوادگی:</span> ${cleanText(user.full_name)}</div>
              <div><span class="label">کد ملی:</span> ${cleanText(user.national_id)}</div>
              <div><span class="label">نقش:</span> دانش‌آموز</div>
              <div><span class="label">پایه:</span> ${cleanText(user.grade_level || "-")}</div>
              <div><span class="label">کلاس:</span> ${cleanText(user.class_name || "-")}</div>
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
                  <div class="day-name">${cleanText(day)}</div>
                  <ul class="lesson-list">
                    ${lessons.map(l => `<li class="lesson-item">${cleanText(l)}</li>`).join("")}
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
                  <span>ترم ${cleanText(r.term)}</span>
                  <a class="btn btn-secondary" href="${r.file_url}" target="_blank" rel="noopener">مشاهده</a>
                </li>
              `).join("")}
            </ul>
          ` : `<p class='note'>کارنامه‌ای موجود نیست.</p>`}
        </section>
      `;
    }

    return layoutWithNav(nav, content);
  }

  return {
    homePage,
    newsPage,
    livePage,
    newsItemPage,
    loginPage,
    adminDash,
    studentDash
  };
})();
