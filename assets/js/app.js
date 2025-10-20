// app.js - روتینگ کلاینتی با مسیرهای دقیق، نشست محلی، و کنترل بخش‌های اختصاصی

const Router = (() => {
  const routes = {
    "/": "home",
    "/news": "news",
    "/news/live": "live",
    "/login/": "login",
    "/dash/admin/": "dash_admin",
    "/dash/student": "dash_student" // بدون اسلش پایانی به‌صورت هم‌خانواده پذیرفته می‌شود
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
    e.preventDefault();
    const href = a.getAttribute("href");
    push(href);
  }

  function normalizePath(p) {
    let np = p.trim();
    // حذف اسلش‌های اضافه انتها برای هماهنگی
    if (np.length > 1) np = np.replace(/\/+$/, "/");
    if (np === "") np = "/";
    // تصحیح غلط‌های رایج:
    if (np === "/dash/admin") np = "/dash/admin/";
    if (np === "/login") np = "/login/";
    return np;
  }

  function getQuerySection(defaultSection = "home") {
    const url = new URL(location.href);
    const section = url.searchParams.get("section");
    return section || defaultSection;
  }

  async function render() {
    const app = document.getElementById("app");
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
        case "login":
          app.innerHTML = UI.loginPage();
          attachLoginForm();
          break;
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
      app.innerHTML = `<section class="card"><h3>خطا</h3><p>${err.message}</p></section>`;
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
        const admin = (dataset.admins || []).find(u => u.full_name === full_name && u.national_id === national_id && u.password === password);
        if (admin) { Session.set({ role: "admin", user: admin }); push("/dash/admin/"); return; }
        const student = (dataset.students || []).find(u => u.full_name === full_name && u.national_id === national_id && u.password === password);
        if (student) { Session.set({ role: "student", user: student }); push("/dash/student"); return; }
        err.textContent = "ورود ناموفق. لطفاً اطلاعات را بررسی کنید.";
      } catch {
        err.textContent = "بارگذاری داده‌ها با خطا مواجه شد.";
      }
    });
  }

  function boot() {
    document.addEventListener("click", linkHandler);
    window.addEventListener("popstate", render);
    render();
  }

  return { boot, push, Session };
})();

Router.boot();
