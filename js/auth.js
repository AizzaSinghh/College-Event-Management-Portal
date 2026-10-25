// CampusPulse — local-only account, validation, captcha, and demo Google sign-in.
(function () {
  const accountsKey = "cp_accounts";
  const accounts = () => JSON.parse(localStorage.getItem(accountsKey) || "[]");
  const saveAccounts = (value) => localStorage.setItem(accountsKey, JSON.stringify(value));
  const role = () => document.querySelector("#role-organizer:checked") ? "organizer" : "student";
  const destination = (value) => value === "organizer" ? "dashboard-organizer.html" : "dashboard-student.html";
  const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const session = (account) => { localStorage.setItem("cp_role", account.role); localStorage.setItem("cp_user", JSON.stringify({ name: account.name, email: account.email, role: account.role, orgName: account.orgName || "" })); };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".auth-form");
    if (!form) return;
    const isSignup = Boolean(document.getElementById("fullname"));
    const captcha = document.getElementById("captcha-text");
    if (captcha) captcha.textContent = code();
    const google = document.createElement("div");
    google.className = "google-signin";
    const initializeGoogle = () => {
      if (!window.CAMPUSPULSE_GOOGLE_CLIENT_ID || !window.google?.accounts?.id || google.dataset.initialized) return Boolean(google.dataset.initialized);
      window.google.accounts.id.initialize({
        client_id: window.CAMPUSPULSE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            const selected = role(); const all = accounts();
            let account = all.find((item) => item.email === payload.email && item.role === selected);
            if (!account) {
              account = { name: payload.name || payload.email, email: payload.email, password: null, role: selected, googleSub: payload.sub, providers: ["google"] };
              all.push(account);
            } else {
              account.googleSub = payload.sub;
              account.providers = Array.from(new Set([...(account.providers || [account.password ? "password" : "google"]), "google"]));
            }
            saveAccounts(all);
            session(account); alert("Google demo sign-in complete. This browser-only session is not production authentication."); window.location.href = destination(selected);
          } catch (error) { alert("Google sign-in could not be completed. Please try again."); }
        }
      });
      window.google.accounts.id.renderButton(google, {
        type: "standard",
        theme: localStorage.getItem("cp_theme") === "dark" ? "filled_black" : "outline",
        size: "large",
        text: isSignup ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 300
      });
      google.dataset.initialized = "true";
      return true;
    };
    form.after(google);
    const googleWait = setInterval(() => { if (initializeGoogle()) clearInterval(googleWait); }, 200);

    document.querySelectorAll(".continue-buttons a").forEach((button) => button.addEventListener("click", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (captcha && document.getElementById("captcha").value.trim().toUpperCase() !== captcha.textContent) { alert("Captcha does not match. Try again."); captcha.textContent = code(); document.getElementById("captcha").value = ""; return; }
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const selected = role(); let account;
      if (isSignup) {
        if (password !== document.getElementById("confirm-password").value) return alert("Passwords do not match.");
        const orgName = document.getElementById("orgname").value.trim();
        if (selected === "organizer" && !orgName) return alert("Enter your club or department name.");
        if (accounts().some((item) => item.email === email)) return alert("An account already exists for this email. Please sign in.");
        account = { name: document.getElementById("fullname").value.trim(), email, password, role: selected, orgName, providers: ["password"] };
        const all = accounts(); all.push(account); saveAccounts(all); alert("Account created.");
      } else {
        account = accounts().find((item) => item.email === email && item.password === password && item.role === selected);
        if (!account) return alert("No matching local account. Check your role, email and password, or sign up.");
        alert("Signed in successfully.");
      }
      session(account); window.location.href = destination(selected);
    }));
  });
})();
