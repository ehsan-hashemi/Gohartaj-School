// ui.js - ویوها و کامپوننت‌ها: خانه، اخبار، خبر زنده، جزئیات خبر، ورود، پنل‌ها
// شامل: مدیریت درست رسانه‌ها، پاک‌سازی متن‌ها، و نمایش ساعت زنده بدون رفرش کل صفحه

const UI = (() => {
  // تاریخ به فارسی
  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("fa-IR");
    } catch {
      return dateStr || "";
    }
  }

  // پاک‌سازی رشته‌ها
  function cleanText(t) {
    return Router.cleanText ? Router.cleanText(t) : String(t || "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  // رندر تصویر یا هیچ‌چیز؛ با fallback SVG در onerror
  function imageOrNothing(url, fallbackSvg, cssClass = "") {
    if (!url || url.trim() === "") return "";
    const escaped = url.replace(/"/g, "&quot;");
    return `<img src="${escaped}" alt="" class="${cssClass}" onerror="this.outerHTML='${fallbackSvg.replace(/'/g, "\\'")}'">`;
  }

  // هدر بخش‌ها
  function headerSection(title, actionsHtml = "") {
    return `
      <section class="section-header">
        <h2 class="section-title">${title}</h2>
        <div class="section-actions">${actionsHtml}</div>
      </section>
    `;
  }

  // کارت عمومی
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

  // ناوبری سمت چپ پنل‌ها
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

  // چیدمان پنل با ناوبری
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

  // صفحه خانه: اطلاعیه‌ها + خلاصه اخبار
  async function homePage() {
    const anns = await Data.getAnnouncements();
    const news = await Data.getNews();

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

  // صفحه همه اخبار با لینک به جزئیات
  async function newsPage() {
    const news = await Data.getNews();
    const items = (news || []).map(n => {
      const meta = `${formatDate(n.published_at)}${n.author ? " • " + cleanText(n.author) : ""}`;
      const body = cleanText(n.body || "");
      const summary = body.length > 220 ? body.slice(0, 220) + "…" : body;
      const img = n.image_url || "";
      return `
        <article class="card hover-soft">
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
      ${headerSection("اخبار")}
      <div class="list">${items || "<p class='note'>خبری یافت نشد.</p>"}</div>
    `;
  }

  // صفحه خبر زنده
  async function livePage() {
    const live = await Data.getLive();
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

  // صفحه جزئیات خبر
  async function newsItemPage(id) {
    const all = await Data.getNews();
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

    // رسانه: تصویر + ویدیو
    const hasImage = item.image_url && item.image_url.trim();
    const hasVideo = item.video_url && item.video_url.trim();
    let mediaHtml = "";
    if (hasImage) {
      mediaHtml += `<div class="mb-12">${imageOrNothing(item.image_url, DefaultIcons.news, "news-image")}</div>`;
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

    // خبرهای مرتبط ساده: جدیدترین‌ها بغیر از همین
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

  // صفحه ورود
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

  // پنل مدیر
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
      // ساعت زنده
      requestAnimationFrame(() => attachClock("admin-clock"));
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
      // رندر نتایج با پاک‌سازی متن و جلوگیری از شکست‌های ناخواسته
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

        document.getElementById("search_btn").addEventListener("click", search);
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

        btn.addEventListener("click", () => renderSchedule(select.value));
        renderSchedule(select.value);
      });
    }

    const html = layoutWithNav(nav, content);
    return html;
  }

  // پنل دانش‌آموز
  async function studentDash(user, section = "home") {
    const schedules = await Data.getSchedules();
    const reportcards = await Data.getReportcards();
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
      requestAnimationFrame(() => attachClock("student-clock"));
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

    const html = layoutWithNav(nav, content);
    return html;
  }

  // ساعت زنده: فقط عنصر مشخص را هر ۱ ثانیه آپدیت می‌کند
  function attachClock(elId) {
    const el = document.getElementById(elId);
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
    newsItemPage,
    loginPage,
    adminDash,
    studentDash
  };
})();
