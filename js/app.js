// CampusPulse — browser-only events, registrations, saved events, organizer tools and profile.
(function () {
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; } catch (e) { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const setText = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  const PAGES = window.location.pathname.includes("/html/") ? "" : "html/";
  const COLORS = { navy: "#4A5B6E", coral: "#C2604F", olive: "#5C6B3F", plum: "#7A4A5E" };
  const TONES = ["pink", "blue", "green"];

  const seed = [
    { id: "hackout", title: "TechFest 2026: Hackout", date: "2026-08-14", venue: "Main Auditorium", owner: "system" },
    { id: "design", title: "Design Bootcamp", date: "2026-08-29", venue: "Seminar Hall 2", owner: "system" },
    { id: "openmic", title: "Open Mic Night", date: "2026-08-18", venue: "Amphitheatre", owner: "system" },
    { id: "football", title: "Inter-College Football Meet", date: "2026-08-22", venue: "Sports Ground", owner: "system" }
  ];
  const events = () => { const all = read("cp_events", []); if (all.length) return all; write("cp_events", seed); return seed; };
  const user = () => read("cp_user", null);
  const profiles = () => read("cp_profiles", {});
  const profileFor = (u) => profiles()[u.email] || {};

  // any event card can be registered for, even when it is not in the seed list
  const itemFor = (title) => events().find((e) => e.title === title) || { id: slug(title), title, owner: "system" };

  function dateParts(iso) {
    if (!iso) return { day: "", month: "" };
    const d = new Date(iso + "T00:00:00");
    return { day: String(d.getDate()).padStart(2, "0"), month: d.toLocaleString("en", { month: "short" }).toUpperCase() };
  }

  // what we remember about a registration (so the dashboard can redraw it later)
  function describe(item, card) {
    const parts = dateParts(item.date);
    const text = (sel) => (card && card.querySelector(sel) ? card.querySelector(sel).textContent.trim() : "");
    return { title: item.title, day: text(".event-day") || parts.day, month: text(".event-month") || parts.month, meta: text(".event-meta") || item.venue || "" };
  }

  /* ---------- identity + profile page ---------- */
  function hydrateIdentity() {
    const current = user();
    if (!current) return;
    const profile = profileFor(current);
    const isOrg = current.role === "organizer";
    const displayName = isOrg ? (profile.clubname || current.orgName || current.name) : (profile.fullname || current.name);

    setText(".dash-welcome h1", "Welcome back, " + displayName + ".");
    document.querySelectorAll(".dash-avatar, #avatar-preview").forEach((n) => { n.textContent = initials(displayName); });
    if (COLORS[profile.avatar]) document.querySelectorAll(".dash-avatar").forEach((n) => { n.style.background = COLORS[profile.avatar]; n.style.color = "#fff"; });

    const saveButton = document.querySelector(".profile-save");
    if (!saveButton) return;                                      // not a profile page

    const fields = document.querySelectorAll(".profile-form input, .profile-form textarea, .profile-form select");
    fields.forEach((f) => {
      if (!f.id) return;
      if (profile[f.id] !== undefined) f.value = profile[f.id];
      else if (f.tagName !== "SELECT") f.value = "";              // clear the demo text typed into the HTML
    });
    const nameField = document.getElementById(isOrg ? "clubname" : "fullname");
    if (nameField) {
      nameField.value = displayName;
      nameField.addEventListener("input", () => { document.getElementById("avatar-preview").textContent = initials(nameField.value || displayName); });
    }
    const emailField = document.getElementById("contact-email");
    if (emailField && !profile["contact-email"]) emailField.value = current.email;

    if (profile.avatar) { const r = document.getElementById("avatar-" + profile.avatar); if (r) r.checked = true; }
    if (profile.interests) document.querySelectorAll(".interest-checkbox").forEach((c) => { c.checked = profile.interests.includes(c.id); });
    if (profile.notifs) document.querySelectorAll(".switch-checkbox").forEach((c, i) => { c.checked = Boolean(profile.notifs[i]); });

    saveButton.addEventListener("click", () => {
      const forms = Array.from(document.querySelectorAll(".profile-form"));
      if (!forms.every((f) => f.reportValidity())) return;
      const values = {};
      fields.forEach((f) => { if (f.id) values[f.id] = f.value.trim(); });
      const nameKey = isOrg ? "clubname" : "fullname";
      if (!values[nameKey] || values[nameKey].length < 2) return alert("Please enter a valid name.");

      const picked = document.querySelector(".avatar-radio:checked");
      const all = profiles();
      all[current.email] = Object.assign({}, profileFor(current), values, {
        avatar: picked ? picked.id.replace("avatar-", "") : "",
        interests: Array.from(document.querySelectorAll(".interest-checkbox:checked")).map((c) => c.id),
        notifs: Array.from(document.querySelectorAll(".switch-checkbox")).map((c) => c.checked)
      });
      write("cp_profiles", all);
      document.getElementById("avatar-preview").textContent = initials(values[nameKey]);
      alert("Profile saved.");
    });
  }

  /* ---------- student actions ---------- */
  function student() {
    const current = user();
    if (!current) { alert("Please sign in as a student first."); window.location.href = PAGES + "signin.html"; return null; }
    if (current.role !== "student") { alert("Only students can register or save events."); return null; }
    return current;
  }
  function register(item, card) {
    const current = student(); if (!current) return;
    const all = read("cp_registrations", []);
    if (all.some((r) => r.eventId === item.id && r.email === current.email)) return alert("You are already registered for this event.");
    all.push(Object.assign({ eventId: item.id, email: current.email, name: current.name, at: Date.now() }, describe(item, card)));
    write("cp_registrations", all);
    alert("Registered for " + item.title + ". You can see it on your dashboard.");
  }
  function save(item) {
    const current = student(); if (!current) return;
    const all = read("cp_saved_events", []);
    const index = all.findIndex((r) => r.eventId === item.id && r.email === current.email);
    if (index >= 0) { all.splice(index, 1); alert("Event removed from saved events."); }
    else { all.push({ eventId: item.id, email: current.email }); alert("Event saved."); }
    write("cp_saved_events", all);
  }
  function button(label, callback) {
    const node = document.createElement("button");
    node.type = "button"; node.className = "btn-mini"; node.textContent = label;
    node.addEventListener("click", callback);
    return node;
  }

  function wireEvents() {
    if (document.querySelector(".dash-welcome")) return;          // dashboards draw their own cards
    document.querySelectorAll(".event-card").forEach((card) => {
      if (card.dataset.js) return;
      const heading = card.querySelector("h3");
      const info = card.querySelector(".event-info");
      if (!heading || !info) return;
      card.dataset.js = "true";
      const item = itemFor(heading.textContent.trim());
      const main = info.querySelector(".btn-mini");
      if (main && /register/i.test(main.textContent)) main.addEventListener("click", (e) => { e.preventDefault(); register(item, card); });
      info.append(button("Save Event", () => save(item)));
    });
    const detail = document.querySelector(".detail-register-btn");
    const title = document.querySelector(".detail-banner h1");
    if (detail && title && /register/i.test(detail.textContent)) {            // event page only ("Enroll Now" on club pages is skipped)
      detail.addEventListener("click", (e) => { e.preventDefault(); register(itemFor(title.textContent.trim()), null); });
    }
  }

  /* ---------- events created by organizers show on the Events page ---------- */
  function createdCard(item, i) {
    const d = dateParts(item.date);
    return '<div class="event-card"><div class="event-date event-date-' + TONES[i % 3] + '"><span class="event-day">' + d.day + '</span><span class="event-month">' + d.month + '</span></div>' +
      '<div class="event-info"><h3>' + esc(item.title) + '</h3><p class="event-meta">' + esc(item.venue) + '</p><p class="event-desc">' + esc(item.category || "") + '</p><a href="#" class="btn-mini">Register</a></div></div>';
  }
  function renderCreatedEvents() {
    const firstSection = document.getElementById("tech");        // only the Events page has this section
    const created = events().filter((e) => e.owner !== "system");
    if (!firstSection || !created.length) return;
    const section = document.createElement("section");
    section.className = "event-category tint-b";
    section.id = "new-events";
    section.innerHTML = '<div class="category-heading"><span class="category-tag category-tag-pink">New</span><h2>Newly Added Events</h2></div><div class="category-grid">' + created.map(createdCard).join("") + "</div>";
    firstSection.before(section);
  }

  /* ---------- student dashboard: real registrations ---------- */
  function renderStudentDashboard() {
    const current = user();
    const grid = document.querySelector(".dash-section:not(.dash-section-tinted) .category-grid");
    if (!current || current.role !== "student" || !grid || !document.querySelector(".dash-stats")) return;
    const draw = () => {
      const mine = read("cp_registrations", []).filter((r) => r.email === current.email);
      const numbers = document.querySelectorAll(".dash-stat-number");
      if (numbers[0]) numbers[0].textContent = mine.length;
      grid.innerHTML = mine.length ? mine.map((r, i) =>
        '<div class="event-card"><div class="event-date event-date-' + TONES[i % 3] + '"><span class="event-day">' + esc(r.day) + '</span><span class="event-month">' + esc(r.month) + '</span></div>' +
        '<div class="event-info"><h3>' + esc(r.title) + '</h3><p class="event-meta">' + esc(r.meta) + '</p><p class="event-desc">You are registered.</p>' +
        '<button type="button" class="btn-mini" data-cancel="' + esc(r.eventId) + '">Cancel</button></div></div>').join("")
        : '<p class="empty-state">You have not registered for any events yet. <a class="inline-link" href="events.html">Browse events &rarr;</a></p>';
    };
    grid.addEventListener("click", (e) => {
      const id = e.target.dataset.cancel;
      if (!id || !confirm("Cancel this registration?")) return;
      write("cp_registrations", read("cp_registrations", []).filter((r) => !(r.eventId === id && r.email === current.email)));
      draw();
    });
    draw();
  }

  /* ---------- organizer dashboard: create / edit / delete events ---------- */
  function manager() {
    const actions = document.querySelector(".dash-actions-grid");
    const current = user();
    if (!actions || !current || current.role !== "organizer") return;
    const section = document.createElement("section");
    section.className = "dash-section";
    section.innerHTML = '<div class="dash-section-heading"><h2>Manage Local Events</h2></div><form class="profile-form"><div class="form-row"><div class="form-group"><label>Event title<input name="title" required></label></div><div class="form-group"><label>Date<input name="date" type="date" required></label></div></div><div class="form-row"><div class="form-group"><label>Venue<input name="venue" required></label></div><div class="form-group"><label>Category<input name="category" required></label></div></div><button class="btn-mini">Create Event</button></form><div class="local-events"></div>';
    actions.after(section);
    const list = section.querySelector(".local-events");
    const mine = () => events().filter((e) => e.owner === current.email);

    const render = () => {
      list.innerHTML = mine().map((e) => "<p><strong>" + esc(e.title) + "</strong> — " + esc(e.date) + " · " + esc(e.venue) +
        ' <button class="btn-mini" data-edit="' + esc(e.id) + '">Edit</button> <button class="btn-mini" data-delete="' + esc(e.id) + '">Delete</button></p>').join("") || "<p>No local events created yet.</p>";
    };

    section.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = new FormData(e.currentTarget);
      const all = events();
      all.push({ id: "event-" + Date.now(), title: v.get("title").trim(), date: v.get("date"), venue: v.get("venue").trim(), category: v.get("category").trim(), owner: current.email });
      write("cp_events", all);
      e.currentTarget.reset();
      render();
      alert("Event created. It now appears on the Events page.");
    });

    list.addEventListener("click", (e) => {
      const id = e.target.dataset.edit || e.target.dataset.delete;
      if (!id) return;
      const all = events();
      const index = all.findIndex((x) => x.id === id);
      if (index < 0) return;
      if (e.target.dataset.delete) {
        if (!confirm("Delete this event?")) return;
        all.splice(index, 1);
        write("cp_events", all);
        write("cp_registrations", read("cp_registrations", []).filter((r) => r.eventId !== id));
        alert("Event deleted.");
      } else {
        const title = prompt("Event title", all[index].title);
        if (!title || !title.trim()) return;
        all[index].title = title.trim();
        write("cp_events", all);
        alert("Event updated.");
      }
      render();
    });

    actions.querySelectorAll("a").forEach((action) => action.addEventListener("click", (e) => {
      e.preventDefault();
      const label = action.querySelector(".dash-action-title") ? action.querySelector(".dash-action-title").textContent.trim() : "";
      if (label === "Create New Event") section.scrollIntoView({ behavior: "smooth" });
      else if (label === "Edit Club Profile") window.location.href = "profile-organizer.html";
      else if (label === "View Registrations") {
        const ids = mine().map((x) => x.id);
        alert(read("cp_registrations", []).filter((r) => ids.includes(r.eventId)).length + " registration(s) for your events.");
      } else alert("Member management arrives together with club enrolment.");
    }));
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    events();
    hydrateIdentity();
    renderCreatedEvents();
    wireEvents();
    renderStudentDashboard();
    manager();
    document.querySelectorAll(".newsletter-form").forEach((form) => form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.reportValidity()) { alert("You are subscribed to portal updates."); form.reset(); }
    }));
  });
})();

var navToggle = document.querySelector(".nav-toggle");
var navbar = document.querySelector(".navbar");

if (navToggle && navbar) {
  navToggle.addEventListener("click", function () {
    navbar.classList.toggle("nav-open");
  });
}
