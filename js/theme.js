// CampusPulse — site-wide: theme, navbar state, mobile menu
(function () {
  const storageKey = "cp_theme";
  const PAGES = window.location.pathname.includes("/html/") ? "" : "html/";

  function setTheme(isDark) {
    document.body.classList.toggle("theme-dark", isDark);
    const toggle = document.getElementById("theme-switch");
    if (toggle) toggle.checked = isDark;
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* 1. THEME: every page gets a #theme-switch (hidden where there is no visible toggle),
          so the dark-mode CSS works site-wide */
    let toggle = document.getElementById("theme-switch");
    if (!toggle) {
      toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.id = "theme-switch";
      toggle.hidden = true;
      document.body.prepend(toggle);
    }
    setTheme(localStorage.getItem(storageKey) === "dark");
    toggle.addEventListener("change", function () {
      localStorage.setItem(storageKey, toggle.checked ? "dark" : "light");
      setTheme(toggle.checked);
    });

    /* 2. NAVBAR: logged-in visitors see My Dashboard + Log Out on every page */
    const role = localStorage.getItem("cp_role");
    const loggedIn = Boolean(role && localStorage.getItem("cp_user"));
    const dashboard = role === "organizer" ? "dashboard-organizer.html" : "dashboard-student.html";
    const actions = document.querySelector(".nav-actions");
    if (actions && loggedIn) {
      actions.innerHTML =
        '<a href="' + PAGES + dashboard + '" class="btn btn-ghost">My Dashboard</a>' +
        '<a href="' + PAGES + 'logout.html" class="btn btn-primary">Log Out</a>';
    }

    /* 3. MOBILE MENU */
    const nav = document.querySelector(".navbar");
    const burger = document.querySelector(".nav-toggle");
    if (nav && burger) {
      burger.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", nav.classList.toggle("nav-open"));
      });
    }
  });
})();
