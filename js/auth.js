// CampusPulse — validation + lightweight session simulation
document.addEventListener("DOMContentLoaded", function () {

  function runChecks(e, role) {
    const captchaText = document.getElementById("captcha-text");
    const captchaInput = document.getElementById("captcha");
    if (captchaText && captchaInput) {
      if (captchaInput.value.trim() !== captchaText.textContent.trim()) {
        e.preventDefault();
        alert("Captcha does not match. Please try again.");
        captchaInput.value = "";
        return;
      }
    }

    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");
    if (password && confirmPassword) {
      if (password.value !== confirmPassword.value) {
        e.preventDefault();
        alert("Passwords do not match. Please re-check.");
        return;
      }
    }

    localStorage.setItem("cp_role", role);
  }

  const continueStudent = document.getElementById("continue-student");
  const continueOrganizer = document.getElementById("continue-organizer");

  if (continueStudent) {
    continueStudent.addEventListener("click", function (e) {
      runChecks(e, "student");
    });
  }
  if (continueOrganizer) {
    continueOrganizer.addEventListener("click", function (e) {
      runChecks(e, "organizer");
    });
  }

});