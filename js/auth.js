/* js/auth.js — STEP 1b: sign up -> then sign in (data kept in localStorage) */
document.addEventListener("DOMContentLoaded", function () {

  function $(id) { return document.getElementById(id); }
  var isSignup = !!$("fullname");            // only the signup page has a Full Name field
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- tiny "database" ---------- */
  function getUsers() { return JSON.parse(localStorage.getItem("cp_users") || "[]"); }
  function saveUsers(list) { localStorage.setItem("cp_users", JSON.stringify(list)); }

  /* ---------- captcha (signin page): random code, click it for a new one ---------- */
  var capText = $("captcha-text");
  function newCaptcha() {
    if (!capText) return;
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    var code = "";
    for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    capText.textContent = code;
    if ($("captcha")) $("captcha").value = "";
  }
  newCaptcha();
  if (capText) {
    capText.style.cursor = "pointer";
    capText.title = "Click for a new code";
    capText.addEventListener("click", newCaptcha);
  }

  /* ---------- SIGN IN PAGE: show "account created" message + prefill ---------- */
  if (!isSignup) {
    var flash = sessionStorage.getItem("cp_flash");
    if (flash) {
      var note = document.createElement("div");
      note.className = "auth-notice";
      note.textContent = flash;
      var form = document.querySelector(".auth-form");
      form.parentNode.insertBefore(note, form);

      var prefillEmail = sessionStorage.getItem("cp_prefill_email");
      var prefillRole  = sessionStorage.getItem("cp_prefill_role");
      if (prefillEmail) $("email").value = prefillEmail;
      if (prefillRole === "organizer" && $("role-organizer")) $("role-organizer").checked = true;
      $("password").focus();

      sessionStorage.removeItem("cp_flash");
      sessionStorage.removeItem("cp_prefill_email");
      sessionStorage.removeItem("cp_prefill_role");
    }
  }

  /* ---------- after a successful SIGN IN: remember who is logged in ---------- */
  function startSession(user) {
    localStorage.setItem("cp_session", JSON.stringify({ email: user.email, role: user.role }));
    location.href = user.role === "organizer" ? "dashboard-organizer.html" : "dashboard-student.html";
  }

  /* ---------- SIGN UP: save the account, then go to Sign In ---------- */
  function signUp(role) {
    var name  = $("fullname").value.trim();
    var email = $("email").value.trim().toLowerCase();
    var club  = $("orgname") ? $("orgname").value.trim() : "";
    var pw    = $("password").value;
    var pw2   = $("confirm-password").value;

    if (name.length < 2)          return alert("Please enter your full name.");
    if (!EMAIL.test(email))       return alert("Please enter a valid email address.");
    if (role === "organizer" && club.length < 2)
                                  return alert("Please enter your club / department name.");
    if (pw.length < 8)            return alert("Password must be at least 8 characters.");
    if (pw !== pw2)               return alert("Passwords do not match.");
    if (!$("terms").checked)      return alert("Please accept the Terms & Conditions.");

    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) return alert("An account with this email already exists. Please sign in.");
    }

    users.push({ name: name, email: email, password: pw, role: role, club: role === "organizer" ? club : "" });
    saveUsers(users);

    sessionStorage.setItem("cp_flash", "Account created successfully! Please sign in to continue.");
    sessionStorage.setItem("cp_prefill_email", email);
    sessionStorage.setItem("cp_prefill_role", role);
    location.href = "signin.html";
  }

  /* ---------- SIGN IN ---------- */
  function signIn(role) {
    var email = $("email").value.trim().toLowerCase();
    var pw    = $("password").value;

    if (!EMAIL.test(email) || pw === "") return alert("Please enter your email and password.");

    if (capText && $("captcha").value.trim() !== capText.textContent) {
      newCaptcha();
      return alert("Captcha does not match. Here is a new code.");
    }

    var users = getUsers(), found = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].password === pw) found = users[i];
    }
    if (!found) { newCaptcha(); return alert("Incorrect email or password."); }
    if (found.role !== role) return alert("This is a " + found.role + " account. Please pick the matching card above.");

    startSession(found);
  }

  /* ---------- hook up the two pill buttons ---------- */
  var btnStudent   = $("continue-student");
  var btnOrganizer = $("continue-organizer");

  if (btnStudent) btnStudent.addEventListener("click", function (e) {
    e.preventDefault();
    if (isSignup) signUp("student"); else signIn("student");
  });
  if (btnOrganizer) btnOrganizer.addEventListener("click", function (e) {
    e.preventDefault();
    if (isSignup) signUp("organizer"); else signIn("organizer");
  });
});