// app.js - روتینگ کلاینتی، مدیریت لاگین و نقش‌ها، هدایت صفحات

const Router = (() => {
  // مسیرهای مورد نیاز
  const routes = {
    "/": "home",
    "/news": "news",
    "/news/live": "live",
    "/login": "login",
    "/dash/admin": "dash_admin",
    "/dash/student": "dash_student"
  };

  // ذخیره‌ی ساده نشست (توکن و نقش) در localStorage
  const Session = {
    get: () => {
      try { return JSON.parse(localStorage.getItem("session")) || null; }
      catch { return null; }
    },
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
    const href = a.getAttribute("href");
    // GitHub Pages-friendly: از History API استفاده می‌کنیم
    e.preventDefault();
    push(href);
  }

  async function render() {
    const app = document.getElementById("app");
    const path = location.pathname;

    // هدایت اشتباهات تایپی رایج (مثلاً dashbord → dashboard)
    const normalized = normalizePath(path);
    if (normalized !== path) {
      history.replaceState({}, "", normalized);
    }

    const routeName = routes[normalized] || "home";
    const session = Session.get();

    try {
      switch (routeName) {
        case "home": {
          app.innerHTML = await UI.homePage();
          break;
        }
        case "news": {
          app.innerHTML = await UI.newsPage();
          break;
        }
        case "live": {
          app.innerHTML = await UI.livePage();
          break;
        }
        case "login": {
          app.innerHTML = UI.loginPage();
          attachLoginForm();
          break;
        }
        case "dash_admin": {
          if (!session || session.role !== "admin") {
            push("/login");
            return;
          }
          app.innerHTML = await UI.adminDash(session.user);
          break;
        }
        case "dash_student": {
          if (!session || session.role !== "student") {
            push("/login");
            return;
          }
          app.innerHTML = await UI.studentDash(session.user);
          break;
        }
        default: {
          app.innerHTML = await UI.homePage();
        }
      }
    } catch (err) {
      app.innerHTML = `<section class="card"><h3>خطا</h3><p>${err.message}</p></section>`;
    }
  }

  function normalizePath(p) {
    // تصحیح‌های ساده: فاصله‌ها، اسلش پایانی، حروف انگلیسی اضافی
    let np = p.trim().replace(/\/+$/, "");
    if (np === "") np = "/";
    // غلط‌های احتمالی:
    if (np === "/dashbord/admin") np = "/dash/admin";
    if (np === "/dashbord/student") np = "/dash/student";
    return np;
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
        // بررسی مدیر
        const admin = (dataset.admins || []).find(u => u.full_name === full_name && u.national_id === national_id && u.password === password);
        if (admin) {
          Session.set({ role: "admin", user: admin });
          push("/dash/admin");
          return;
        }
        // بررسی دانش‌آموز
        const student = (dataset.students || []).find(u => u.full_name === full_name && u.national_id === national_id && u.password === password);
        if (student) {
          Session.set({ role: "student", user: student });
          push("/dash/student");
          return;
        }
        // (معلم فعلاً نیازی به پنل ندارد، ولی می‌توانید مشابه اضافه کنید)
        const teacher = (dataset.teachers || []).find(u => u.full_name === full_name && u.national_id === national_id && u.password === password);
        if (teacher) {
          // برای آینده: /dash/teacher
          err.textContent = "ورود معلم فعلاً پشتیبانی نمی‌شود.";
          return;
        }

        err.textContent = "ورود ناموفق. اطلاعات را بررسی کنید.";
      } catch (ex) {
        err.textContent = "بارگذاری داده‌ها با خطا مواجه شد.";
      }
    });
  }

  function boot() {
    document.addEventListener("click", linkHandler);
    window.addEventListener("popstate", render);
    render();
  }

  return { boot, Session, push };
})();

Router.boot();