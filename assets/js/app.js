// app.js — روتینگ کلاینتی پایدار با رندر تمیز، هندل bfcache، و نشست ماندگار

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
    get: () => { try { return JSON.parse(localStorage.getItem("session")) || null; } catch { return null; } },
    set: (s) => localStorage.setItem("session", JSON.stringify(s)),
    clear: () => localStorage.removeItem("session")
  };

  function push(path) {
    history.pushState({}, "", path);
    render();
  }

  function linkHandler(e) {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (/^https?:\/\//.test(href)) return; // لینک خارجی
    e.preventDefault();
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
    if (app) app.innerHTML = ""; // پاک‌سازی فوری

    const path = normalizePath(location.pathname);
    if (path !== location.pathname) history.replaceState({}, "", path);
    const routeName = routes[path] || "home";
    const session = Session.get();

    try {
      switch (routeName) {
        case "home":
          app.innerHTML = await UI.homePage();
          break;
        case "news":
          app.innerHTML = await UI.newsPage();
          break;
        case "live":
          app.innerHTML = await UI.livePage();
          break;
        case "news_item": {
          const id = getNewsId();
          app.innerHTML = await UI.newsItemPage(id);
          break;
        }
        case "login": {
          if (session && session.role === "admin") { push("/dash/admin/"); return; }
          if (session && session.role === "student") { push("/dash/student"); return; }
          app.innerHTML = UI.loginPage();
          attachLoginForm();
          break;
        }
        case "dash_admin": {
          if (!session || session.role !== "admin") { push("/login/"); return; }
          const section = getQuerySection("home");
          app.innerHTML = await UI.adminDash(session.user, section);
          break;
        }
        case "dash_student": {
          if (!session || session.role !== "student") { push("/login/"); return; }
          const section = getQuerySection("home");
          app.innerHTML = await UI.studentDash(session.user, section);
          break;
        }
        default:
          app.innerHTML = await UI.homePage();
      }
    } catch (err) {
      app.innerHTML = `<section class="card"><h3>خطا</h3><p class="note">${err.message}</p></section>`;
    }
  }

  function attachLoginForm() {
    const form = document.getElementById("login-form");
    const err = document.getElementById("login-error");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const full_name = form.full_name.value.trim();
      const national_id = form.national_id.value.trim();
      const password = form.password.value;

      try {
        const dataset = await Data.getStudents();
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
        err.textContent = "بارگذاری داده‌ها با خطا مواجه شد.";
      }
    });
  }

  function cleanText(t) {
    return String(t || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function boot() {
    document.addEventListener("click", linkHandler);
    window.addEventListener("popstate", render);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) render(); // هندل bfcache
    });
    render();
  }

  return { boot, push, Session, cleanText };
})();

Router.boot();
