// app.js — روتینگ SPA با پشتیبانی قطعی از تغییر query (?id=...)، چرخه‌عمر ایمن، و رندر تازه روی bfcache

const Router = (() => {
  const routes = {
    "/": "home",
    "/news": "news",
    "/news/live": "live",
    "/login/": "login",
    "/dash/admin/": "dash_admin",
    "/dash/student": "dash_student",
    "/news/item": "news_item"
  };

  const Session = {
    get: () => {
      try { return JSON.parse(localStorage.getItem("session")) || null; } catch { return null; }
    },
    set: (s) => localStorage.setItem("session", JSON.stringify(s)),
    clear: () => localStorage.removeItem("session")
  };

  // چرخه‌عمر نماها: هر رندر یک mountId یکتا می‌گیرد
  let currentMountId = 0;

  // نگه‌دارنده teardown برای پاکسازی رویدادها و تایمرها در هر رندر
  const teardownCallbacks = new Set();

  function registerTeardown(fn) { teardownCallbacks.add(fn); }
  function runTeardown() {
    try { teardownCallbacks.forEach(fn => { try { fn(); } catch {} }); } finally { teardownCallbacks.clear(); }
    if (typeof stopAllClocks === "function") stopAllClocks();
  }

  function push(href) {
    // همیشه pushState بزن حتی اگر فقط query تغییر کرده باشد
    history.pushState({}, "", href);
    render();
  }

  function linkHandler(e) {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (/^https?:\/\//.test(href)) return; // لینک خارجی
    e.preventDefault();
    // حتی اگر path ثابت باشد اما search/query فرق کند، باید push کنیم تا render دوباره اجرا شود
    push(href);
  }

  function normalizePath(p) {
    let np = p.trim();
    if (np.length > 1) np = np.replace(/\/+$/, "/");
    if (np === "") np = "/";
    if (np === "/dash/admin") np = "/dash/admin/";
    if (np === "/login") np = "/login/";
    return np;
  }

  function getQuerySection(defaultSection = "home") {
    const url = new URL(location.href);
    const section = url.searchParams.get("section");
    return section || defaultSection;
  }

  function getNewsId() {
    const url = new URL(location.href);
    const qid = url.searchParams.get("id");
    if (qid) return qid;
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "news" && parts[1] && /^\d+$/.test(parts[1])) return parts[1];
    return null;
  }

  async function render() {
    const app = document.getElementById("app");
    if (!app) return;

    // teardown نمای قبلی
    runTeardown();

    // توکن mount یکتا برای این رندر
    const mountId = ++currentMountId;

    // پاک‌سازی سریع DOM
    app.innerHTML = "";

    // نرمال‌سازی مسیر
    const path = normalizePath(location.pathname);
    if (path !== location.pathname) history.replaceState({}, "", path);

    const routeName = routes[path] || "home";
    const session = Session.get();

    // ابزار بررسی اعتبار mount
    const stillMounted = () => mountId === currentMountId;

    // ثبت رویداد با teardown و صحت mount
    function safeAddEvent(el, type, handler, opts) {
      el.addEventListener(type, handler, opts);
      registerTeardown(() => {
        try { el.removeEventListener(type, handler, opts); } catch {}
      });
    }

    // بازگرداندن صفحه به بالا
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      switch (routeName) {
        case "home": {
          const html = await UI.homePage();
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        case "news": {
          const html = await UI.newsPage();
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        case "live": {
          const html = await UI.livePage();
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        case "news_item": {
          // مهم: روی هر تغییر query (id جدید) این بخش اجرا می‌شود
          const id = getNewsId();
          const html = await UI.newsItemPage(id);
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        case "login": {
          if (session && session.role === "admin") { push("/dash/admin/"); return; }
          if (session && session.role === "student") { push("/dash/student"); return; }
          const html = UI.loginPage();
          if (!stillMounted()) return;
          app.innerHTML = html;

          const form = document.getElementById("login-form");
          const err = document.getElementById("login-error");
          if (form) {
            const onSubmit = async (e) => {
              e.preventDefault();
              if (!stillMounted()) return;
              err.textContent = "";
              const full_name = form.full_name.value.trim();
              const national_id = form.national_id.value.trim();
              const password = form.password.value;
              try {
                const dataset = await Data.getStudents({ fresh: true });
                if (!stillMounted()) return;
                const admin = (dataset.admins || []).find(u =>
                  cleanText(u.full_name) === cleanText(full_name) &&
                  cleanText(u.national_id) === cleanText(national_id) &&
                  String(u.password) === String(password)
                );
                if (admin) { Session.set({ role: "admin", user: admin }); push("/dash/admin/"); return; }
                const student = (dataset.students || []).find(u =>
                  cleanText(u.full_name) === cleanText(full_name) &&
                  cleanText(u.national_id) === cleanText(national_id) &&
                  String(u.password) === String(password)
                );
                if (student) { Session.set({ role: "student", user: student }); push("/dash/student"); return; }
                err.textContent = "ورود ناموفق. لطفاً اطلاعات را بررسی کنید.";
              } catch {
                if (!stillMounted()) return;
                err.textContent = "بارگذاری داده‌ها با خطا مواجه شد.";
              }
            };
            safeAddEvent(form, "submit", onSubmit);
          }
          break;
        }
        case "dash_admin": {
          if (!session || session.role !== "admin") { push("/login/"); return; }
          const section = getQuerySection("home");
          const html = await UI.adminDash(session.user, section);
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        case "dash_student": {
          if (!session || session.role !== "student") { push("/login/"); return; }
          const section = getQuerySection("home");
          const html = await UI.studentDash(session.user, section);
          if (!stillMounted()) return;
          app.innerHTML = html;
          break;
        }
        default: {
          const html = await UI.homePage();
          if (!stillMounted()) return;
          app.innerHTML = html;
        }
      }
    } catch (err) {
      if (!stillMounted()) return;
      app.innerHTML = `<section class="card"><h3>خطا</h3><p class="note">${err.message}</p></section>`;
    }
  }

  function cleanText(t) {
    return String(t || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function boot() {
    document.addEventListener("click", linkHandler, { capture: true });
    window.addEventListener("popstate", render);
    window.addEventListener("pageshow", () => {
      // در بازگشت bfcache، رندر تازه
      render();
    });
    render();
  }

  return { boot, push, Session, cleanText, registerTeardown };
})();

Router.boot();
