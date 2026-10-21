/* js/guard.js — blocks dashboards and profile pages for logged-out visitors */
(function () {
  var need = document.documentElement.getAttribute("data-role");
  var s = null;
  try { s = JSON.parse(localStorage.getItem("cp_session")); } catch (e) {}

  function bounce(url) {
    document.documentElement.style.visibility = "hidden";
    location.replace(url);
  }

  if (!s) { bounce("signin.html"); return; }
  if (need && s.role !== need) {
    bounce(s.role === "organizer" ? "dashboard-organizer.html" : "dashboard-student.html");
  }
})();