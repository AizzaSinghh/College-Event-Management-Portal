// CampusPulse — persisted, site-wide colour theme
(function () {
  const storageKey = "cp_theme";

  function setTheme(isDark) {
    document.body.classList.toggle("theme-dark", isDark);

    const toggle = document.getElementById("theme-switch");
    if (toggle) {
      toggle.checked = isDark;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTheme(localStorage.getItem(storageKey) === "dark");

    document.querySelectorAll(".logo").forEach(function (logo) {
      logo.addEventListener("click", function (event) {
        const role = localStorage.getItem("cp_role");
        if (!role) return;
        event.preventDefault();
        const isRootPage = !window.location.pathname.includes("/html/");
        const prefix = isRootPage ? "html/" : "";
        window.location.href = prefix + (role === "organizer" ? "dashboard-organizer.html" : "dashboard-student.html");
      });
    });

    const toggle = document.getElementById("theme-switch");
    if (toggle) {
      toggle.addEventListener("change", function () {
        const isDark = toggle.checked;
        localStorage.setItem(storageKey, isDark ? "dark" : "light");
        setTheme(isDark);
      });
    }
  });
})();
