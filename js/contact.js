// js/contact.js — contact form + newsletter talk to a pretend server using Promises
document.addEventListener("DOMContentLoaded", function () {

  /* ---------- the pretend server: every function RETURNS A PROMISE ---------- */

  // resolves with a receipt, or rejects with an Error
  function sendMessage(data) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {                       // fake network delay
        if (data.message.length < 10) {
          reject(new Error("Message is too short. Please write at least 10 characters."));
          return;
        }
        const saved = JSON.parse(localStorage.getItem("cp_messages") || "[]");
        const receipt = { id: "MSG-" + Date.now(), name: data.name, email: data.email, subject: data.subject, message: data.message };
        saved.push(receipt);
        localStorage.setItem("cp_messages", JSON.stringify(saved));
        resolve(receipt);
      }, 1200);
    });
  }

  function subscribe(email) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        const list = JSON.parse(localStorage.getItem("cp_subscribers") || "[]");
        if (list.includes(email.toLowerCase())) {
          reject(new Error("This email is already subscribed."));
          return;
        }
        list.push(email.toLowerCase());
        localStorage.setItem("cp_subscribers", JSON.stringify(list));
        resolve(email);
      }, 800);
    });
  }

  /* ---------- CONTACT FORM: async / await style ---------- */
  const form = document.querySelector(".contact-page-form");
  if (form) {
    const button = form.querySelector("button[type='submit']");
    const status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    form.append(status);

    const show = function (text, type) {
      status.textContent = text;
      status.className = "form-status " + type;
    };

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.message = (data.message || "").trim();

      button.disabled = true;
      show("Sending your message…", "info");

      try {
        const receipt = await sendMessage(data);      // waits here until the Promise settles
        show("Message sent! Your reference is " + receipt.id + ".", "success");
        form.reset();
      } catch (error) {                               // a rejected Promise lands here
        show(error.message, "error");
      } finally {                                     // runs either way
        button.disabled = false;
      }
    });
  }

  /* ---------- NEWSLETTER: .then / .catch / .finally style ---------- */
  document.querySelectorAll(".newsletter-form").forEach(function (f) {
    f.addEventListener("submit", function (event) {
      event.preventDefault();
      const btn = f.querySelector("button");
      btn.disabled = true;

      subscribe(f.elements["newsletter-email"].value.trim())
        .then(function (email) {
          alert("Subscribed: " + email);
          f.reset();
        })
        .catch(function (error) {
          alert(error.message);
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
  });
});