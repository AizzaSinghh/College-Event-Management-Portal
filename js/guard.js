// CampusPulse — access gate for protected pages
(function () {
  const requiredRole = document.documentElement.getAttribute("data-role");
  const currentRole = localStorage.getItem("cp_role");

  if (!currentRole) {
    window.location.href = "signin.html";
    return;
  }

  if (requiredRole && currentRole !== requiredRole) {
    window.location.href = currentRole === "organizer"
      ? "dashboard-organizer.html"
      : "dashboard-student.html";
  }
})();