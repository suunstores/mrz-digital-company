(() => {
  "use strict";

  const API_ENDPOINT = "/api/mrz";
  const STORAGE_KEY = "mrz_academy_session_v1";

  const state = {
    token: "",
    user: null,
    settings: {
      APP_NAME: "MRZ Digital Academy",
      BRAND_NAME: "MRZ Digital",
      TAGLINE: "Mempermudah Pekerjaanmu",
      PRIMARY_COLOR: "#6E1423",
      ACCENT_COLOR: "#C9A227",
      TELEGRAM_URL: "",
      MENTOR_WHATSAPP: "",
      SUPPORT_EMAIL: ""
    },
    modules: [],
    notes: [],
    schedule: [],
    announcements: [],
    tools: [],
    currentToolDetail: null,
    currentToolLoading: false,
    toolTab: "summary",
    authMode: "login",
    progress: { completed: 0, total: 0, percent: 0 },
    currentView: "home",
    selectedZone: "all",
    selectedNoteModule: "",
    moduleSearch: "",
    sidebarOpen: false,
    busyModules: new Set(),
    adminTab: "orders",
    adminLoading: false,
    adminData: {
      summary: {},
      orders: [],
      accesses: [],
      tools: []
    }
  };

  const app = document.getElementById("app");

  const icons = {
    home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>`,
    checklist: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`,
    note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>`,
    play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>`,
    lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 4 4L19 6"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>`,
    logout: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>`,
    menu: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
    bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>`,
    telegram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>`,
    chat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>`,
    arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    worksheet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>`,
    save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>`,
    eye: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 18 18M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 4.2A10 10 0 0 1 12 4c6 0 10 8 10 8a17 17 0 0 1-2 3M6.6 6.6C3.8 8.5 2 12 2 12s4 8 10 8a9.8 9.8 0 0 0 4.1-.9"/></svg>`,
    tools: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>`,
    headphones: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1zM6 19H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1z"/></svg>`,
    cart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.6 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7"/></svg>`
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initials(name) {
    return String(name || "MRZ").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  }

  function formatDate(value, withTime = true) {
    if (!value) return "Belum ditentukan";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(date);
  }

  function formatExpiry(value) {
    if (!value) return "Tanpa batas";
    return formatDate(value, false);
  }

  function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty("--primary", state.settings.PRIMARY_COLOR || "#6E1423");
    root.style.setProperty("--accent", state.settings.ACCENT_COLOR || "#C9A227");
    document.title = state.settings.APP_NAME || "MRZ Digital Academy";
  }

  async function api(payload) {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error("Respons server tidak dapat dibaca."); }
    if (!response.ok || !data.ok) {
      const message = data?.error || `Server merespons ${response.status}.`;
      if (/sesi|token|login ulang/i.test(message)) logout(false);
      throw new Error(message);
    }
    return data;
  }

  function toast(message, type = "success") {
    const root = document.getElementById("toast-root");
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.innerHTML = `<span>${type === "success" ? icons.check : "!"}</span><div>${escapeHtml(message)}</div>`;
    root.appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  function saveSession() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
  }

  function loadSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.token) {
        state.token = saved.token;
        state.user = saved.user || null;
        return true;
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
    return false;
  }

  function logout(showMessage = true) {
    localStorage.removeItem(STORAGE_KEY);
    state.token = "";
    state.user = null;
    state.authMode = "login";
    state.modules = [];
    state.notes = [];
    state.schedule = [];
    state.announcements = [];
    state.tools = [];
    state.currentToolDetail = null;
    renderLogin();
    if (showMessage) toast("Kamu sudah keluar dari member area.");
  }

  async function bootstrap(showLoader = true) {
    if (showLoader) renderLoading();
    try {
      const data = await api({ action: "bootstrap", token: state.token });
      state.user = data.user;
      state.settings = { ...state.settings, ...(data.settings || {}) };
      state.modules = Array.isArray(data.modules) ? data.modules : [];
      state.notes = Array.isArray(data.notes) ? data.notes : [];
      state.schedule = Array.isArray(data.schedule) ? data.schedule : [];
      state.announcements = Array.isArray(data.announcements) ? data.announcements : [];
      state.tools = Array.isArray(data.tools) ? data.tools : [];
      state.progress = data.progress || { completed: 0, total: 0, percent: 0 };
      if (!state.selectedNoteModule && state.modules[0]) state.selectedNoteModule = state.modules[0].module_id;
      saveSession();
      applyTheme();
      renderApp();
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      state.token = "";
      renderLogin(error.message);
    }
  }

  function renderLoading() {
    app.innerHTML = `<div class="loading-screen"><div><div class="loader"></div><p class="muted small" style="margin-top:16px">Menyiapkan member area...</p></div></div>`;
  }

  function renderLogin(errorMessage = "") {
    applyTheme();
    const isRegister = state.authMode === "register";
    app.innerHTML = `
      <main class="login-shell">
        <section class="login-brand">
          <div class="brand-lockup">
            <div class="logo-box">MRZ</div>
            <div class="login-kicker">✦ Member Area & Digital Tools</div>
            <h1>Belajar, lihat hasilnya, lalu buka tools yang kamu butuhkan.</h1>
            <p>Daftar gratis untuk melihat katalog produk MRZ, contoh hasil, modul pengenalan, dan penawaran akses tools.</p>
          </div>
          <div class="login-benefits">
            <div class="login-benefit"><span>✓</span><strong>Daftar gratis mandiri</strong></div>
            <div class="login-benefit"><span>↗</span><strong>Lihat contoh hasil tools</strong></div>
            <div class="login-benefit"><span>✎</span><strong>Modul belajar terstruktur</strong></div>
          </div>
        </section>
        <section class="login-panel">
          <div class="login-card">
            <div class="logo-box compact" style="margin-bottom:20px">MRZ</div>
            <div class="auth-tabs">
              <button type="button" class="auth-tab ${!isRegister ? "active" : ""}" data-auth-mode="login">Masuk</button>
              <button type="button" class="auth-tab ${isRegister ? "active" : ""}" data-auth-mode="register">Daftar Gratis</button>
            </div>
            <h2>${isRegister ? "Buat akun gratis" : "Selamat datang"}</h2>
            <p>${isRegister ? "Daftar tanpa menghubungi admin. Akunmu otomatis aktif sebagai FREE." : "Masukkan email dan password akunmu."}</p>
            <div id="login-error" class="form-error ${errorMessage ? "show" : ""}">${escapeHtml(errorMessage)}</div>
            ${isRegister ? `
              <form id="register-form" autocomplete="on">
                <div class="form-group"><label for="reg-name">Nama</label><div class="input-wrap"><span class="input-icon">●</span><input id="reg-name" name="name" required minlength="2" placeholder="Nama lengkap" /></div></div>
                <div class="form-group"><label for="reg-email">Email</label><div class="input-wrap"><span class="input-icon">@</span><input id="reg-email" name="email" type="email" required placeholder="nama@email.com" autocomplete="email" /></div></div>
                <div class="form-group"><label for="reg-phone">Nomor WhatsApp</label><div class="input-wrap"><span class="input-icon">+</span><input id="reg-phone" name="phone" inputmode="tel" required placeholder="08xxxxxxxxxx" autocomplete="tel" /></div></div>
                <div class="form-group"><label for="reg-password">Password</label><div class="input-wrap"><span class="input-icon">●</span><input id="reg-password" name="password" type="password" minlength="8" required placeholder="Minimal 8 karakter" autocomplete="new-password" style="padding-right:52px"/><button type="button" class="password-toggle" data-toggle-password="reg-password" aria-label="Tampilkan password">${icons.eye}</button></div></div>
                <button id="register-button" type="submit" class="btn btn-primary btn-block">Daftar dan Masuk ${icons.arrow}</button>
              </form>` : `
              <form id="login-form" autocomplete="on">
                <div class="form-group"><label for="email">Email</label><div class="input-wrap"><span class="input-icon">@</span><input id="email" name="email" type="email" placeholder="nama@email.com" required autocomplete="username" /></div></div>
                <div class="form-group"><label for="password">Password</label><div class="input-wrap"><span class="input-icon">●</span><input id="password" name="password" type="password" placeholder="Minimal 8 karakter" required autocomplete="current-password" style="padding-right:52px" /><button type="button" class="password-toggle" data-toggle-password="password" aria-label="Tampilkan password">${icons.eye}</button></div></div>
                <button id="login-button" type="submit" class="btn btn-primary btn-block">Masuk ke Member Area ${icons.arrow}</button>
              </form>`}
            <p class="login-help">Akun FREE dapat melihat semua produk dan contoh hasil.<br/>Tools premium tetap terkunci sampai akses dibeli.</p>
          </div>
        </section>
      </main>`;

    document.querySelectorAll("[data-auth-mode]").forEach(button => button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      renderLogin();
    }));
    document.querySelectorAll("[data-toggle-password]").forEach(button => button.addEventListener("click", event => {
      const input = document.getElementById(event.currentTarget.dataset.togglePassword);
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      event.currentTarget.innerHTML = visible ? icons.eye : icons.eyeOff;
    }));

    document.getElementById("login-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = document.getElementById("login-button");
      const errorBox = document.getElementById("login-error");
      errorBox.classList.remove("show");
      button.disabled = true;
      button.textContent = "Memeriksa akun...";
      try {
        const data = await api({ action: "login", email: form.email.value.trim(), password: form.password.value });
        state.token = data.token;
        state.user = data.user;
        saveSession();
        await bootstrap(true);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add("show");
        button.disabled = false;
        button.innerHTML = `Masuk ke Member Area ${icons.arrow}`;
      }
    });

    document.getElementById("register-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = document.getElementById("register-button");
      const errorBox = document.getElementById("login-error");
      errorBox.classList.remove("show");
      button.disabled = true;
      button.textContent = "Membuat akun...";
      try {
        const data = await api({
          action: "register",
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          password: form.password.value
        });
        state.token = data.token;
        state.user = data.user;
        saveSession();
        toast("Akun FREE berhasil dibuat.");
        await bootstrap(true);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add("show");
        button.disabled = false;
        button.innerHTML = `Daftar dan Masuk ${icons.arrow}`;
      }
    });
  }

  function uniqueZones() {
    const map = new Map();
    state.modules.forEach(module => {
      const key = String(module.zone_no || 0);
      if (!map.has(key)) map.set(key, { zone_no: module.zone_no || 0, zone_name: module.zone_name || `Zona ${key}` });
    });
    return [...map.values()].sort((a, b) => a.zone_no - b.zone_no);
  }

  function navItem(view, label, icon, count = "") {
    return `<button class="nav-item ${state.currentView === view ? "active" : ""}" data-view="${view}"><span class="nav-icon">${icon}</span><span>${escapeHtml(label)}</span>${count !== "" ? `<span class="nav-count">${count}</span>` : ""}</button>`;
  }

  function renderApp() {
    const zones = uniqueZones();
    const zoneNav = zones.map(zone => navItem(`zone:${zone.zone_no}`, `Zona ${zone.zone_no} · ${zone.zone_name}`, icons.book, state.modules.filter(m => Number(m.zone_no) === Number(zone.zone_no)).length)).join("");
    const firstName = String(state.user?.name || "Member").split(" ")[0];
    app.innerHTML = `
      <div class="app-shell">
        <div class="sidebar-overlay ${state.sidebarOpen ? "show" : ""}" id="sidebar-overlay"></div>
        <aside class="sidebar ${state.sidebarOpen ? "open" : ""}" id="sidebar">
          <div class="sidebar-header">
            <div class="logo-box compact">MRZ</div>
            <div class="sidebar-brand"><strong>${escapeHtml(state.settings.BRAND_NAME)}</strong><span>Digital Academy</span></div>
          </div>
          <div class="sidebar-search">
            <div class="input-wrap"><span class="input-icon">${icons.search}</span><input id="module-search" type="search" value="${escapeHtml(state.moduleSearch)}" placeholder="Cari modul..." /></div>
          </div>
          <nav>
            <div class="nav-group">
              <div class="nav-label">Menu Utama</div>
              ${navItem("home", "Beranda", icons.home)}
              ${navItem("tools", "Produk & Tools", icons.tools, state.tools.length)}
              ${navItem("checklist", "Checklist Onboarding", icons.checklist, `${state.progress.completed}/${state.progress.total}`)}
              ${navItem("schedule", "Jadwal Konsultasi", icons.calendar)}
              ${navItem("notes", "Catatan Saya", icons.note)}
            </div>
            <div class="nav-group">
              <div class="nav-label">Materi Belajar</div>
              ${zoneNav || `<div class="small muted" style="padding:10px">Belum ada modul.</div>`}
            </div>
            ${state.user?.role === "ADMIN" ? `<div class="nav-group"><div class="nav-label">Administrator</div>${navItem("admin", "Pesanan & Akses", icons.users)}</div>` : ""}
            <div class="nav-group">
              <div class="nav-label">Komunitas & Bantuan</div>
              <button class="nav-item" data-external="telegram"><span class="nav-icon">${icons.telegram}</span><span>Grup Telegram</span></button>
              <button class="nav-item" data-external="mentor"><span class="nav-icon">${icons.chat}</span><span>Chat Mentor</span></button>
            </div>
          </nav>
          <div class="sidebar-footer">
            <div class="profile-mini">
              <div class="avatar">${initials(state.user?.name)}</div>
              <div style="min-width:0;flex:1"><strong>${escapeHtml(state.user?.name)}</strong><span>${escapeHtml(state.user?.package || "MEMBER")}</span></div>
              <button class="icon-button" id="logout-button" title="Keluar">${icons.logout}</button>
            </div>
          </div>
        </aside>
        <div class="main-shell">
          <header class="topbar">
            <div style="display:flex;align-items:center;gap:12px">
              <button class="icon-button mobile-menu" id="mobile-menu">${icons.menu}</button>
              <div class="breadcrumb">Member Area &nbsp;/&nbsp; <strong>${escapeHtml(viewTitle())}</strong></div>
            </div>
            <div class="topbar-right">
              <span class="package-badge">${escapeHtml(state.user?.package || "MEMBER")}</span>
              <div class="avatar" style="width:38px;height:38px;border-radius:12px">${initials(firstName)}</div>
            </div>
          </header>
          <main class="content" id="view-root">${renderCurrentView()}</main>
        </div>
      </div>`;
    bindAppEvents();
  }

  function viewTitle() {
    if (state.currentView.startsWith("zone:")) {
      const zoneNo = Number(state.currentView.split(":")[1]);
      const zone = uniqueZones().find(z => Number(z.zone_no) === zoneNo);
      return zone ? `Zona ${zone.zone_no} · ${zone.zone_name}` : "Materi";
    }
    if (state.currentView.startsWith("tool:")) return state.currentToolDetail?.tool?.tool_name || "Detail Tools";
    return ({ home: "Beranda", tools: "Produk & Tools", checklist: "Checklist Onboarding", schedule: "Jadwal Konsultasi", notes: "Catatan Saya", admin: "Pesanan & Akses" })[state.currentView] || "Beranda";
  }

  function renderCurrentView() {
    if (state.currentView === "home") return renderHome();
    if (state.currentView === "tools") return renderTools();
    if (state.currentView.startsWith("tool:")) return renderToolDetail();
    if (state.currentView === "checklist") return renderChecklist();
    if (state.currentView === "schedule") return renderSchedule();
    if (state.currentView === "notes") return renderNotes();
    if (state.currentView === "admin") return renderAdmin();
    if (state.currentView.startsWith("zone:")) {
      state.selectedZone = state.currentView.split(":")[1];
      return renderChecklist(true);
    }
    return renderHome();
  }

  function renderHome() {
    const firstName = String(state.user?.name || "Member").split(" ")[0];
    const next = state.modules.find(m => !m.is_completed && !m.is_locked) || null;
    const completedMinutes = state.modules.filter(m => m.is_completed).reduce((sum, m) => sum + Number(m.duration_minutes || 0), 0);
    return `
      <div class="page-head"><div><h1>Halo, ${escapeHtml(firstName)} 👋</h1><p>Lanjutkan perjalanan belajarmu dan selesaikan modul secara berurutan.</p></div></div>
      <section class="card hero-card">
        <div style="position:relative;z-index:1">
          <div class="hero-kicker">${escapeHtml(state.settings.TAGLINE)}</div>
          <h2>Progres kecil hari ini membentuk hasil besar nanti.</h2>
          <p>Kamu sudah menyelesaikan ${state.progress.completed} dari ${state.progress.total} modul. Materi berikutnya sudah menunggu untuk dipraktikkan.</p>
          <div class="hero-actions"><button class="btn btn-accent" data-view="checklist">Lanjut Belajar ${icons.arrow}</button><button class="btn btn-outline" data-view="notes">Buka Catatan</button></div>
        </div>
        <div class="progress-orbit" style="--progress:${Number(state.progress.percent || 0)}"><div class="progress-orbit-content"><strong>${Number(state.progress.percent || 0)}%</strong><span>Progress keseluruhan</span></div></div>
      </section>
      <section class="grid grid-4" style="margin-top:18px">
        ${statCard(icons.book, "Total Modul", state.progress.total)}
        ${statCard(icons.checklist, "Modul Selesai", state.progress.completed)}
        ${statCard(icons.clock, "Menit Belajar", completedMinutes)}
        ${statCard(icons.calendar, "Jadwal Aktif", state.schedule.filter(s => String(s.status || "").toUpperCase() === "SCHEDULED").length)}
      </section>
      <div class="section-head"><div><h2>Lanjutkan Belajar</h2><p>Modul pertama yang sudah terbuka dan belum selesai.</p></div></div>
      ${next ? `<section class="card next-module">
        <div class="next-module-media">${next.thumbnail_url ? `<img src="${escapeHtml(next.thumbnail_url)}" alt="" onerror="this.remove()">` : icons.play}</div>
        <div class="next-module-copy"><span>Zona ${next.zone_no} · ${escapeHtml(next.zone_name)}</span><h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.description)}</p></div>
        <button class="btn btn-primary" data-open-module="${escapeHtml(next.module_id)}">Mulai Modul ${icons.arrow}</button>
      </section>` : emptyState("Semua modul selesai", "Hebat! Kamu sudah menyelesaikan seluruh materi yang tersedia.")}
      <div class="section-head"><div><h2>Produk & Tools MRZ</h2><p>Lihat contoh hasil dan pilih tools yang sesuai kebutuhanmu.</p></div><button class="btn btn-outline" data-view="tools">Lihat Semua</button></div>
      <section class="tool-grid tool-grid-home">
        ${state.tools.length ? state.tools.slice(0,3).map(renderToolCard).join("") : emptyState("Belum ada tools", "Jalankan setupProject() versi terbaru untuk menambahkan produk.")}
      </section>
      <div class="section-head"><div><h2>Pengumuman</h2><p>Informasi terbaru dari admin.</p></div></div>
      <section class="grid grid-2">
        ${state.announcements.length ? state.announcements.slice(0,4).map(a => `<article class="card announcement"><div class="announcement-icon">${icons.bell}</div><div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body)}</p></div></article>`).join("") : emptyState("Belum ada pengumuman", "Pengumuman baru akan muncul di bagian ini.")}
      </section>`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function renderTools() {
    return `
      <div class="page-head"><div><h1>Produk & Tools MRZ</h1><p>Akun FREE tetap dapat melihat landing page, contoh hasil, harga, dan modul pengenalan.</p></div></div>
      <section class="catalog-hero card">
        <div><span class="hero-kicker">MRZ DIGITAL ECOSYSTEM</span><h2>Satu dashboard untuk belajar dan mengakses tools AI pilihanmu.</h2><p>Lihat kualitas hasilnya terlebih dahulu. Beli hanya tools yang benar-benar kamu butuhkan.</p></div>
        <div class="catalog-stat"><strong>${state.tools.length}</strong><span>Tools tersedia</span></div>
      </section>
      <section class="tool-grid">
        ${state.tools.length ? state.tools.map(renderToolCard).join("") : emptyState("Belum ada tools", "Jalankan setupProject() terbaru pada Apps Script.")}
      </section>`;
  }

  function renderToolCard(tool) {
    return `<article class="card tool-card">
      <div class="tool-card-media">${tool.thumbnail_url ? `<img src="${escapeHtml(tool.thumbnail_url)}" alt="${escapeHtml(tool.tool_name)}" onerror="this.remove()">` : icons.tools}<span class="access-badge ${tool.has_access ? "open" : "locked"}">${tool.has_access ? "AKSES AKTIF" : "FREE PREVIEW"}</span></div>
      <div class="tool-card-body"><div class="tool-type">DIGITAL TOOL</div><h3>${escapeHtml(tool.tool_name)}</h3><p>${escapeHtml(tool.short_description)}</p>
      <div class="price-row"><div><del>${formatCurrency(tool.original_price)}</del><strong>${formatCurrency(tool.sale_price)}</strong></div><button class="btn btn-primary" data-open-tool="${escapeHtml(tool.tool_id)}">Lihat Detail ${icons.arrow}</button></div></div>
    </article>`;
  }

  function renderToolDetail() {
    if (state.currentToolLoading) return `<div class="loading-panel card"><div class="loader"></div><p>Menyiapkan landing page tools...</p></div>`;
    const data = state.currentToolDetail;
    if (!data?.tool) return emptyState("Tools belum dimuat", "Kembali ke katalog lalu pilih salah satu tools.");
    const tool = data.tool;
    const tab = state.toolTab;
    return `
      <div class="tool-page-head"><button class="back-link" data-view="tools">← Kembali ke Produk & Tools</button><span class="access-badge ${tool.has_access ? "open" : "locked"}">${tool.has_access ? "AKSES AKTIF" : "AKUN FREE"}</span></div>
      <section class="tool-hero card">
        <div class="tool-hero-copy"><div class="hero-kicker">MRZ DIGITAL TOOL</div><h1>${escapeHtml(tool.headline || tool.tool_name)}</h1><p>${escapeHtml(tool.subheadline || tool.short_description)}</p>
          <div class="tool-hero-actions">${tool.has_access ? `<button class="btn btn-accent" data-launch-tool="${escapeHtml(tool.tool_id)}">Buka Tools Sekarang ${icons.arrow}</button>` : `<button class="btn btn-accent" data-buy-tool="${escapeHtml(tool.tool_id)}">${escapeHtml(tool.purchase_label || "Beli Akses")}</button>`}<button class="btn btn-outline" data-tool-tab="modules">Lihat Modul</button></div>
          <div class="price-stack"><del>${formatCurrency(tool.original_price)}</del><strong>${formatCurrency(tool.sale_price)}</strong><span>Sekali bayar</span></div>
        </div>
        <div class="tool-hero-media">${tool.thumbnail_url ? `<img src="${escapeHtml(tool.thumbnail_url)}" alt="${escapeHtml(tool.tool_name)}">` : icons.headphones}</div>
      </section>
      <nav class="tool-tabs">
        <button class="tool-tab ${tab === "summary" ? "active" : ""}" data-tool-tab="summary">Ringkasan</button>
        <button class="tool-tab ${tab === "modules" ? "active" : ""}" data-tool-tab="modules">Modul Belajar</button>
        <button class="tool-tab ${tab === "launch" ? "active" : ""}" data-tool-tab="launch">Buka Tools</button>
      </nav>
      ${tab === "summary" ? renderToolSummary(data) : tab === "modules" ? renderToolModules(data) : renderToolLaunch(data)}`;
  }

  function renderToolSummary(data) {
    const tool = data.tool;
    return `<section class="tool-detail-stack">
      <div class="section-head"><div><h2>Dengarkan Contoh Hasil</h2><p>Bukti hasil ditempatkan di awal sebagai hook utama.</p></div></div>
      <div class="sample-grid">${data.samples?.length ? data.samples.map((sample, sampleIndex) => `<article class="card sample-card">
        <div class="sample-card-head">
          <div class="sample-icon">${icons.headphones}</div>
          <div class="sample-copy">
            <span class="sample-label">CONTOH HASIL ${String(sampleIndex + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(sample.title)}</h3>
            <p>${escapeHtml(sample.description)}</p>
          </div>
        </div>
        ${sample.media_url ? sample.media_type === "VIDEO" ? `
          <a class="sample-video-button" href="${escapeHtml(sample.media_url)}" target="_blank" rel="noopener">
            <span class="sample-video-icon">${icons.play}</span>
            <span><strong>Tonton Contoh</strong><small>Buka video di YouTube</small></span>
            ${icons.arrow}
          </a>` : `
          <div class="premium-audio-player" data-audio-player>
            <audio preload="metadata" src="${escapeHtml(sample.media_url)}"></audio>
            <button type="button" class="audio-play-button" data-audio-play aria-label="Putar audio">▶</button>
            <div class="audio-player-main">
              <div class="audio-player-topline">
                <span class="audio-status" data-audio-status>Siap diputar</span>
                <span class="audio-duration"><span data-audio-current>0:00</span> / <span data-audio-total>0:00</span></span>
              </div>
              <input class="audio-progress" data-audio-progress type="range" min="0" max="100" value="0" step="0.1" aria-label="Posisi audio" />
              <div class="audio-wave" aria-hidden="true">${Array.from({length: 18}, (_, i) => `<i style="--bar:${(i % 6) + 1}"></i>`).join("")}</div>
            </div>
          </div>` : `<span class="sample-placeholder">Link contoh belum diisi di TOOL_SAMPLES</span>`}
      </article>`).join("") : emptyState("Contoh hasil belum tersedia", "Tambahkan link audio/video pada sheet TOOL_SAMPLES.")}</div>
      <div class="info-split"><section class="card card-pad"><h2>Manfaat Utama</h2><div class="benefit-list">${(tool.benefits || []).map(item => `<div><span>✓</span><p>${escapeHtml(item)}</p></div>`).join("")}</div></section><section class="card card-pad"><h2>Cocok Untuk Siapa?</h2><div class="benefit-list audience">${(tool.audience || []).map(item => `<div><span>•</span><p>${escapeHtml(item)}</p></div>`).join("")}</div></section></div>
      <section class="card purchase-banner"><div><span class="hero-kicker">PROMO TERBATAS</span><h2>Dapatkan MDapatkan ${escapeHtml(tool.tool_name)} sekarang.RZ Voice Over Pro sekarang.</h2><p>Harga normal <del>${formatCurrency(tool.original_price)}</del>, sekarang hanya <strong>${formatCurrency(tool.sale_price)}</strong>.</p></div>${tool.has_access ? `<button class="btn btn-accent" data-launch-tool="${escapeHtml(tool.tool_id)}">Buka Tools ${icons.arrow}</button>` : `<button class="btn btn-accent" data-buy-tool="${escapeHtml(tool.tool_id)}">Buat Pesanan ${icons.cart}</button>`}</section>
    </section>`;
  }

  function renderToolModules(data) {
    const p = data.progress || { completed: 0, total: 0, percent: 0 };
    return `<section class="tool-detail-stack"><section class="card progress-header"><div class="progress-row"><div class="progress-title"><h2>Progress Modul Tools</h2><p>${p.completed} dari ${p.total} modul selesai.</p></div><div class="progress-number"><strong>${p.percent}%</strong><span>TERSELESAIKAN</span></div></div><div class="progress-track"><div style="width:${Math.min(100, Number(p.percent || 0))}%"></div></div></section>
      <div class="tool-module-list">${data.modules?.length ? data.modules.map((module, index) => `<article class="card tool-module ${module.is_locked ? "locked" : ""}"><div class="tool-module-number">${String(index+1).padStart(2,"0")}</div><div class="tool-module-copy"><div class="tool-module-meta"><span>${module.access_level === "FREE" ? "MODUL GRATIS" : "MODUL PREMIUM"}</span><span>${icons.clock} ${module.duration_minutes} menit</span></div><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description)}</p></div><div class="tool-module-actions">${module.is_locked ? `<button class="btn btn-outline" disabled>${icons.lock} Terkunci</button>` : `<button class="btn btn-primary" data-open-tool-module="${escapeHtml(module.tool_module_id)}">${icons.play} Buka Modul</button><button class="btn ${module.is_completed ? "complete-button completed" : "btn-outline"}" data-complete-tool-module="${escapeHtml(module.tool_module_id)}">${module.is_completed ? `${icons.check} Selesai` : `${icons.check} Tandai`}</button>`}</div></article>`).join("") : emptyState("Belum ada modul", "Isi sheet TOOL_MODULES.")}</div></section>`;
  }

  function renderToolLaunch(data) {
    const tool = data.tool;
    return `<section class="card launch-panel"><div class="launch-icon">${tool.has_access ? icons.headphones : icons.lock}</div><span class="hero-kicker">STATUS AKSES</span><h2>${tool.has_access ? "Tools siap digunakan" : "MRZ Voice Over `${tool.tool_name} masih terkunci`Pro masih terkunci"}</h2><p>${tool.has_access ? "Klik tombol di bawah untuk membuka tools asli di tab baru." : "Akun FREE tetap dapat melihat ringkasan, contoh hasil, dan modul pengenalan. Beli akses untuk membuka semua modul dan generator."}</p>${tool.has_access ? `<button class="btn btn-accent" data-launch-tool="${escapeHtml(tool.tool_id)}">Buka MRZ Voice OveBuka ${escapeHtml(tool.tool_name)} ${icons.arrow}r Pro ${icons.arrow}</button>` : `<div class="launch-price"><del>${formatCurrency(tool.original_price)}</del><strong>${formatCurrency(tool.sale_price)}</strong></div><button class="btn btn-accent" data-buy-tool="${escapeHtml(tool.tool_id)}">Buat Pesanan Sekarang ${icons.cart}</button>`}</section>`;
  }

  function statCard(icon, label, value) {
    return `<article class="card stat-card"><div class="stat-icon">${icon}</div><div class="stat-copy"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div></article>`;
  }

  function filteredModules() {
    let modules = [...state.modules];
    if (state.selectedZone !== "all") modules = modules.filter(m => String(m.zone_no) === String(state.selectedZone));
    const q = state.moduleSearch.trim().toLowerCase();
    if (q) modules = modules.filter(m => `${m.title} ${m.description} ${m.zone_name}`.toLowerCase().includes(q));
    return modules;
  }

  function renderChecklist(fromZoneNav = false) {
    const zones = uniqueZones();
    if (!fromZoneNav && !zones.some(z => String(z.zone_no) === String(state.selectedZone))) state.selectedZone = "all";
    const modules = filteredModules();
    const grouped = new Map();
    modules.forEach(m => {
      const key = String(m.zone_no);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(m);
    });
    return `
      <div class="page-head"><div><h1>Checklist Onboarding</h1><p>Ikuti urutan modul agar setiap tahap terbuka secara otomatis.</p></div></div>
      <section class="card progress-header">
        <div class="progress-row"><div class="progress-title"><h2>Progress Keseluruhan</h2><p>${state.progress.completed} dari ${state.progress.total} modul selesai.</p></div><div class="progress-number"><strong>${state.progress.percent}%</strong><span>TERSELESAIKAN</span></div></div>
        <div class="progress-track"><div style="width:${Math.min(100, Number(state.progress.percent || 0))}%"></div></div>
      </section>
      <div class="zone-chips"><button class="zone-chip ${state.selectedZone === "all" ? "active" : ""}" data-zone="all">Semua Zona</button>${zones.map(z => `<button class="zone-chip ${String(state.selectedZone) === String(z.zone_no) ? "active" : ""}" data-zone="${z.zone_no}">Zona ${z.zone_no} · ${escapeHtml(z.zone_name)}</button>`).join("")}</div>
      ${modules.length ? [...grouped.entries()].map(([zoneNo, items]) => {
        const zone = zones.find(z => String(z.zone_no) === zoneNo);
        const done = items.filter(x => x.is_completed).length;
        return `<section class="zone-section"><div class="card zone-title-card"><div class="zone-number">${zoneNo}</div><div><h2>${escapeHtml(zone?.zone_name || `Zona ${zoneNo}`)}</h2><p>${done}/${items.length} modul selesai</p></div></div><div class="module-grid">${items.map(renderModuleCard).join("")}</div></section>`;
      }).join("") : emptyState("Modul tidak ditemukan", state.moduleSearch ? "Coba gunakan kata kunci lain." : "Belum ada modul pada zona ini.")}`;
  }

  function renderModuleCard(module) {
    const busy = state.busyModules.has(module.module_id);
    return `<article class="card module-card ${module.is_locked ? "locked" : ""}">
      <div class="module-media">
        ${module.thumbnail_url ? `<img src="${escapeHtml(module.thumbnail_url)}" alt="Thumbnail ${escapeHtml(module.title)}" onerror="this.remove()">` : ""}
        <span class="module-index">${String(module.sort_order || "").padStart(2,"0")}</span>
        ${module.is_locked ? `<span class="module-lock">${icons.lock}</span>` : `<span class="play-circle">${icons.play}</span>`}
      </div>
      <div class="module-body">
        <div class="module-meta"><span class="module-status">${module.is_completed ? "✓ Selesai" : module.is_locked ? "Terkunci" : "Siap dipelajari"}</span><span class="duration">${icons.clock} ${Number(module.duration_minutes || 0)} mnt</span></div>
        <h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description)}</p>
        <div class="module-actions">
          <button class="btn ${module.is_locked ? "btn-outline" : "btn-primary"}" data-open-module="${escapeHtml(module.module_id)}" ${module.is_locked ? "disabled" : ""}>${module.is_locked ? `${icons.lock} Terkunci` : `${icons.play} Tonton Video`}</button>
          <button class="btn ${module.is_completed ? "complete-button completed" : "btn-outline"}" data-complete-module="${escapeHtml(module.module_id)}" ${module.is_locked || busy ? "disabled" : ""}>${busy ? "..." : module.is_completed ? `${icons.check} Selesai` : `${icons.check} Tandai`}</button>
        </div>
      </div>
    </article>`;
  }

  function renderNotes() {
    const selected = state.modules.find(m => m.module_id === state.selectedNoteModule) || state.modules[0];
    const note = selected ? state.notes.find(n => n.module_id === selected.module_id) : null;
    return `
      <div class="page-head"><div><h1>Catatan Saya</h1><p>Simpan ide, rangkuman, dan langkah praktik untuk setiap modul.</p></div></div>
      ${state.modules.length ? `<div class="two-column">
        <section class="card module-list">${state.modules.map(m => `<button class="module-list-item ${selected?.module_id === m.module_id ? "active" : ""}" data-note-module="${escapeHtml(m.module_id)}"><span>${m.sort_order}</span><div><strong>${escapeHtml(m.title)}</strong><small>Zona ${m.zone_no} · ${escapeHtml(m.zone_name)}</small></div></button>`).join("")}</section>
        <section class="card editor-card"><h2>${escapeHtml(selected?.title || "Pilih modul")}</h2><p>Catatan ini hanya tersimpan untuk akunmu.</p><textarea id="note-text" placeholder="Tulis catatan di sini...">${escapeHtml(note?.note_text || "")}</textarea><div class="editor-footer"><button class="btn btn-primary" id="save-note">${icons.save} Simpan Catatan</button></div></section>
      </div>` : emptyState("Belum ada modul", "Tambahkan modul pada sheet MODULES terlebih dahulu.")}`;
  }

  function renderSchedule() {
    const rows = [...state.schedule].sort((a,b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));
    return `
      <div class="page-head"><div><h1>Jadwal Konsultasi</h1><p>Lihat jadwal Zoom atau sesi pendampingan yang diberikan admin.</p></div></div>
      <section class="grid grid-3">
        ${rows.length ? rows.map(item => `<article class="card schedule-card"><div class="schedule-date">${icons.calendar} ${formatDate(item.start_at)}</div><h3>${escapeHtml(item.title || "Sesi Konsultasi")}</h3><p>Berakhir: ${formatDate(item.end_at)}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="status-pill">${escapeHtml(item.status || "SCHEDULED")}</span>${item.meeting_url ? `<a class="btn btn-primary" href="${escapeHtml(item.meeting_url)}" target="_blank" rel="noopener">Masuk Zoom ${icons.arrow}</a>` : `<span class="small muted">Link belum tersedia</span>`}</div></article>`).join("") : emptyState("Belum ada jadwal", "Jadwal konsultasi akan tampil setelah ditambahkan oleh admin.")}
      </section>`;
  }

  function renderAdmin() {
    if (state.user?.role !== "ADMIN") return emptyState("Akses ditolak", "Halaman ini khusus administrator.");

    const summary = state.adminData.summary || {};
    const tab = state.adminTab;

    return `
      <div class="page-head admin-page-head">
        <div>
          <h1>Pesanan & Akses</h1>
          <p>Konfirmasi pembayaran, kelola akses tools, dan reset perangkat member.</p>
        </div>
        <button class="btn btn-outline" id="refresh-admin">${state.adminLoading ? "Memuat..." : "Muat Ulang"}</button>
      </div>

      <section class="grid grid-4 admin-summary-grid" style="margin-bottom:18px">
        ${statCard(icons.cart, "Pesanan Pending", summary.pending_orders || 0)}
        ${statCard(icons.check, "Pesanan Dibayar", summary.paid_orders || 0)}
        ${statCard(icons.lock, "Akses Aktif", summary.active_access || 0)}
        ${statCard(icons.users, "Perangkat Terikat", summary.bound_devices || 0)}
      </section>

      <nav class="admin-tabs card">
        <button class="admin-tab ${tab === "orders" ? "active" : ""}" data-admin-tab="orders">Pesanan</button>
        <button class="admin-tab ${tab === "access" ? "active" : ""}" data-admin-tab="access">Akses Tools</button>
        <button class="admin-tab ${tab === "members" ? "active" : ""}" data-admin-tab="members">Buat Member</button>
      </nav>

      ${tab === "orders" ? renderAdminOrders() : tab === "access" ? renderAdminAccess() : renderAdminMembers()}`;
  }

  function adminStatusBadge(status) {
    const value = String(status || "").toUpperCase();
    const className = value === "PAID" || value === "ACTIVE"
      ? "success"
      : value === "PENDING"
        ? "warning"
        : "danger";
    return `<span class="admin-status ${className}">${escapeHtml(value || "-")}</span>`;
  }

  function renderAdminOrders() {
    const rows = Array.isArray(state.adminData.orders) ? state.adminData.orders : [];

    if (state.adminLoading && !rows.length) {
      return `<section class="card admin-loading"><div class="loader"></div><p>Memuat pesanan...</p></section>`;
    }

    if (!rows.length) return emptyState("Belum ada pesanan", "Pesanan member akan tampil di bagian ini.");

    return `<section class="card admin-table-card">
      <div class="admin-table-head">
        <div><h2>Daftar Pesanan</h2><p>Konfirmasi hanya setelah pembayaran benar-benar diterima.</p></div>
        <span>${rows.length} data terbaru</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Invoice</th><th>Member</th><th>Tools</th><th>Total</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
          <tbody>${rows.map(order => `
            <tr>
              <td><strong>${escapeHtml(order.invoice_number)}</strong><small>${escapeHtml(order.order_id)}</small></td>
              <td><strong>${escapeHtml(order.customer_name)}</strong><small>${escapeHtml(order.email)}</small></td>
              <td>${escapeHtml(order.tool_name || order.tool_id)}</td>
              <td><strong>${formatCurrency(order.amount_paid)}</strong></td>
              <td>${adminStatusBadge(order.status)}</td>
              <td>${formatDate(order.created_at)}</td>
              <td>${String(order.status).toUpperCase() === "PENDING"
                ? `<button class="btn btn-primary admin-action" data-confirm-order="${escapeHtml(order.order_id)}" data-invoice="${escapeHtml(order.invoice_number)}">Konfirmasi Bayar</button>`
                : `<span class="small muted">${order.paid_at ? `Dibayar ${formatDate(order.paid_at)}` : "Selesai"}</span>`}
              </td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>`;
  }

  function renderAdminAccess() {
    const rows = Array.isArray(state.adminData.accesses) ? state.adminData.accesses : [];

    if (state.adminLoading && !rows.length) {
      return `<section class="card admin-loading"><div class="loader"></div><p>Memuat akses tools...</p></section>`;
    }

    if (!rows.length) return emptyState("Belum ada akses tools", "Akses akan muncul setelah pesanan dikonfirmasi PAID.");

    return `<section class="card admin-table-card">
      <div class="admin-table-head">
        <div><h2>Akses Tools Member</h2><p>Aktifkan, nonaktifkan, atau reset perangkat dari dashboard.</p></div>
        <span>${rows.length} akses</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Member</th><th>Tools</th><th>Paket</th><th>Status</th><th>Perangkat</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
          <tbody>${rows.map(access => {
            const active = String(access.status).toUpperCase() === "ACTIVE";
            return `
              <tr>
                <td><strong>${escapeHtml(access.name)}</strong><small>${escapeHtml(access.email)}</small></td>
                <td>${escapeHtml(access.tool_name || access.tool_id)}</td>
                <td>${escapeHtml(access.plan || "LIFETIME")}</td>
                <td>${adminStatusBadge(access.status)}</td>
                <td><strong>${Number(access.device_count || 0)}/${Number(access.max_devices || 1)}</strong></td>
                <td>${access.last_login_at ? formatDate(access.last_login_at) : "Belum login"}</td>
                <td><div class="admin-action-group">
                  <button class="btn ${active ? "btn-danger" : "btn-primary"} admin-action" data-access-status="${escapeHtml(access.access_id)}" data-next-status="${active ? "REVOKED" : "ACTIVE"}">${active ? "Nonaktifkan" : "Aktifkan"}</button>
                  <button class="btn btn-outline admin-action" data-reset-device="${escapeHtml(access.access_id)}" ${Number(access.device_count || 0) < 1 ? "disabled" : ""}>Reset Device</button>
                </div></td>
              </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>`;
  }

  function renderAdminMembers() {
    return `<section class="card card-pad">
      <div class="section-head" style="margin-top:0"><div><h2>Buat Akun Baru</h2><p>Password sementara minimal 8 karakter.</p></div></div>
      <form id="admin-create-form" class="admin-form">
        <div><label>Nama Member</label><input name="name" required placeholder="Nama lengkap" /></div>
        <div><label>Email</label><input name="email" required type="email" placeholder="member@email.com" /></div>
        <div><label>Password Sementara</label><input name="temporary_password" required type="password" minlength="8" placeholder="Minimal 8 karakter" /></div>
        <div><label>Paket</label><select name="package"><option>FREE</option><option>STANDARD</option><option>REGULER</option><option>VIP</option><option>OWNER</option></select></div>
        <div><label>Role</label><select name="role"><option>MEMBER</option><option>ADMIN</option></select></div>
        <div><label>Masa Aktif Sampai</label><input name="expires_at" type="date" /></div>
        <div class="full" style="display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">${icons.users} Buat Akun</button></div>
      </form>
    </section>`;
  }

  function emptyState(title, text) {
    return `<div class="card empty-state" style="grid-column:1/-1"><div class="empty-icon">${icons.book}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
  }

  function openExternal(type) {
    let url = "";
    if (type === "telegram") url = state.settings.TELEGRAM_URL;
    if (type === "mentor" && state.settings.MENTOR_WHATSAPP) {
      const phone = String(state.settings.MENTOR_WHATSAPP).replace(/\D/g, "");
      url = `https://wa.me/${phone}?text=${encodeURIComponent("Halo Mentor MRZ Digital Academy, saya ingin bertanya.")}`;
    }
    if (!url) return toast("Link belum diisi pada sheet SETTINGS.", "error");
    window.open(url, "_blank", "noopener");
  }

  function openModule(moduleId) {
    const module = state.modules.find(m => m.module_id === moduleId);
    if (!module || module.is_locked) return;
    const embed = youtubeEmbedUrl(module.video_url);
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "module-modal";
    modal.innerHTML = `<section class="modal"><header class="modal-head"><div><span class="small muted">Zona ${module.zone_no} · ${escapeHtml(module.zone_name)}</span><h2>${escapeHtml(module.title)}</h2></div><button class="icon-button" data-close-modal>${icons.close}</button></header><div class="modal-body">
      ${embed ? `<iframe class="video-frame" src="${escapeHtml(embed)}" title="${escapeHtml(module.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : module.video_url ? `<div class="video-empty"><div><strong>Video eksternal</strong><p>Buka video melalui tombol di bawah.</p></div></div>` : `<div class="video-empty"><div>${icons.play}<strong style="display:block;margin-top:12px">Video belum dimasukkan</strong><p>Isi kolom video_url pada sheet MODULES.</p></div></div>`}
      <div class="modal-copy"><p>${escapeHtml(module.description)}</p><div class="modal-actions">${module.video_url && !embed ? `<a class="btn btn-primary" href="${escapeHtml(module.video_url)}" target="_blank" rel="noopener">Buka Video ${icons.arrow}</a>` : ""}${module.worksheet_url ? `<a class="btn btn-outline" href="${escapeHtml(module.worksheet_url)}" target="_blank" rel="noopener">${icons.worksheet} Buka Worksheet</a>` : ""}<button class="btn ${module.is_completed ? "complete-button completed" : "btn-accent"}" data-modal-complete="${escapeHtml(module.module_id)}">${module.is_completed ? `${icons.check} Sudah Selesai` : `${icons.check} Tandai Selesai`}</button></div></div>
    </div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-close-modal]")) modal.remove();
      const complete = event.target.closest("[data-modal-complete]");
      if (complete) toggleComplete(complete.dataset.modalComplete, true).then(() => modal.remove());
    });
  }

  function youtubeEmbedUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    try {
      const u = new URL(value);
      let id = "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1).split("/")[0];
      else if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1].split("/")[0];
        else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/shorts/")[1].split("/")[0];
        else id = u.searchParams.get("v") || "";
      }
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0` : "";
    } catch { return ""; }
  }

  async function loadToolDetail(toolId, preserveTab = false) {
    state.currentToolLoading = true;
    if (!preserveTab) state.toolTab = "summary";
    renderApp();
    try {
      const data = await api({ action: "toolDetail", token: state.token, tool_id: toolId });
      state.currentToolDetail = data;
      state.currentToolLoading = false;
      const index = state.tools.findIndex(item => item.tool_id === data.tool.tool_id);
      if (index >= 0) state.tools[index] = { ...state.tools[index], ...data.tool };
      renderApp();
    } catch (error) {
      state.currentToolLoading = false;
      state.currentToolDetail = null;
      toast(error.message, "error");
      state.currentView = "tools";
      renderApp();
    }
  }

  function openToolModule(moduleId) {
    const module = state.currentToolDetail?.modules?.find(item => item.tool_module_id === moduleId);
    if (!module || module.is_locked) return;
    const embed = youtubeEmbedUrl(module.video_url);
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "tool-module-modal";
    modal.innerHTML = `<section class="modal"><header class="modal-head"><div><span class="small muted">${escapeHtml(module.access_level)} · ${module.duration_minutes} menit</span><h2>${escapeHtml(module.title)}</h2></div><button class="icon-button" data-close-modal>${icons.close}</button></header><div class="modal-body">
      ${embed ? `<iframe class="video-frame" src="${escapeHtml(embed)}" title="${escapeHtml(module.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : module.video_url ? `<div class="video-empty"><div><strong>Video eksternal</strong><p>Buka materi melalui tombol di bawah.</p></div></div>` : `<div class="video-empty"><div>${icons.play}<strong style="display:block;margin-top:12px">Video modul belum diisi</strong><p>Isi video_url di sheet TOOL_MODULES.</p></div></div>`}
      <div class="modal-copy"><p>${escapeHtml(module.description)}</p><div class="modal-actions">${module.video_url && !embed ? `<a class="btn btn-primary" href="${escapeHtml(module.video_url)}" target="_blank" rel="noopener">Buka Video ${icons.arrow}</a>` : ""}${module.worksheet_url ? `<a class="btn btn-outline" href="${escapeHtml(module.worksheet_url)}" target="_blank" rel="noopener">${icons.worksheet} Worksheet</a>` : ""}<button class="btn ${module.is_completed ? "complete-button completed" : "btn-accent"}" data-modal-tool-complete="${escapeHtml(module.tool_module_id)}">${module.is_completed ? `${icons.check} Sudah Selesai` : `${icons.check} Tandai Selesai`}</button></div></div>
    </div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-close-modal]")) modal.remove();
      const complete = event.target.closest("[data-modal-tool-complete]");
      if (complete) completeToolModule(complete.dataset.modalToolComplete, true).then(() => modal.remove());
    });
  }

  async function completeToolModule(moduleId, forceComplete = null) {
    const module = state.currentToolDetail?.modules?.find(item => item.tool_module_id === moduleId);
    if (!module || module.is_locked) return;
    const completed = forceComplete === null ? !module.is_completed : forceComplete;
    try {
      await api({ action: "completeToolModule", token: state.token, tool_module_id: moduleId, completed });
      toast(completed ? "Modul tools berhasil diselesaikan." : "Status modul dibuka kembali.");
      await loadToolDetail(state.currentToolDetail.tool.tool_id, true);
    } catch (error) { toast(error.message, "error"); }
  }

  async function launchTool(toolId) {
    const popup = window.open("about:blank", "_blank");
    try {
      const data = await api({ action: "launchTool", token: state.token, tool_id: toolId });
      if (popup) popup.location.href = data.url;
      else window.open(data.url, "_blank", "noopener");
    } catch (error) {
      if (popup) popup.close();
      toast(error.message, "error");
    }
  }

  function startPurchase(toolId) {
    const tool = state.currentToolDetail?.tool || state.tools.find(item => item.tool_id === toolId);
    if (!tool) return;
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "purchase-modal";
    modal.innerHTML = `<section class="modal purchase-modal"><header class="modal-head"><div><span class="small muted">CHECKOUT MRZ DIGITAL</span><h2>${escapeHtml(tool.tool_name)}</h2></div><button class="icon-button" data-close-modal>${icons.close}</button></header><div class="modal-body purchase-body"><div class="checkout-summary"><img src="${escapeHtml(tool.thumbnail_url || "/assets/mrz-voice-over-pro.png")}" alt=""><div><del>${formatCurrency(tool.original_price)}</del><strong>${formatCurrency(tool.sale_price)}</strong><p>Sekali bayar · akses modul premium dan tools</p></div></div><form id="purchase-form"><div class="form-group"><label>Nomor WhatsApp</label><div class="input-wrap"><span class="input-icon">+</span><input name="phone" inputmode="tel" required value="${escapeHtml(state.user?.phone || "")}" placeholder="08xxxxxxxxxx"></div></div><div class="checkout-note">Pesanan otomatis masuk ke sheet <strong>ORDERS</strong>. Pembayaran otomatis akan aktif setelah payment gateway disambungkan.</div><button class="btn btn-accent btn-block" type="submit">Buat Pesanan ${icons.cart}</button></form><div id="order-result"></div></div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => { if (event.target === modal || event.target.closest("[data-close-modal]")) modal.remove(); });
    modal.querySelector("#purchase-form").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector("button");
      button.disabled = true;
      button.textContent = "Membuat pesanan...";
      try {
        const data = await api({ action: "createOrder", token: state.token, tool_id: toolId, phone: form.phone.value });
        modal.querySelector("#order-result").innerHTML = `<div class="order-success"><span>✓</span><h3>Pesanan berhasil dibuat</h3><p>Invoice: <strong>${escapeHtml(data.order.invoice_number)}</strong></p><p>Total: <strong>${formatCurrency(data.order.amount)}</strong></p><small>Status ${escapeHtml(data.order.status)}. Data sudah masuk ke Spreadsheet.</small></div>`;
        form.style.display = "none";
        toast(data.message || "Pesanan berhasil dibuat.");
      } catch (error) {
        toast(error.message, "error");
        button.disabled = false;
        button.innerHTML = `Buat Pesanan ${icons.cart}`;
      }
    });
  }

  async function toggleComplete(moduleId, forceComplete = null) {
    const module = state.modules.find(m => m.module_id === moduleId);
    if (!module || module.is_locked || state.busyModules.has(moduleId)) return;
    const completed = forceComplete === null ? !module.is_completed : forceComplete;
    state.busyModules.add(moduleId);
    renderApp();
    try {
      await api({ action: "completeModule", token: state.token, module_id: moduleId, completed });
      toast(completed ? "Modul berhasil ditandai selesai." : "Status modul dibuka kembali.");
      await bootstrap(false);
    } catch (error) {
      toast(error.message, "error");
      renderApp();
    } finally {
      state.busyModules.delete(moduleId);
    }
  }

  async function saveNote() {
    const moduleId = state.selectedNoteModule;
    const text = document.getElementById("note-text")?.value || "";
    const button = document.getElementById("save-note");
    if (!moduleId) return;
    button.disabled = true;
    button.textContent = "Menyimpan...";
    try {
      await api({ action: "saveNote", token: state.token, module_id: moduleId, note_text: text });
      toast("Catatan berhasil disimpan.");
      await bootstrap(false);
    } catch (error) {
      toast(error.message, "error");
      button.disabled = false;
      button.innerHTML = `${icons.save} Simpan Catatan`;
    }
  }

  async function loadAdminOperations(showLoader = true) {
    if (state.user?.role !== "ADMIN") return;
    if (showLoader) state.adminLoading = true;
    if (showLoader) renderApp();

    try {
      const data = await api({ action: "adminOperationsData", token: state.token });
      state.adminData = {
        summary: data.summary || {},
        orders: Array.isArray(data.orders) ? data.orders : [],
        accesses: Array.isArray(data.accesses) ? data.accesses : [],
        tools: Array.isArray(data.tools) ? data.tools : []
      };
    } catch (error) {
      toast(error.message, "error");
    } finally {
      state.adminLoading = false;
      if (state.currentView === "admin") renderApp();
    }
  }

  async function confirmAdminOrder(orderId, invoiceNumber) {
    const accepted = window.confirm(`Konfirmasi pembayaran invoice ${invoiceNumber}?\n\nPastikan uang sudah benar-benar diterima.`);
    if (!accepted) return;

    try {
      await api({
        action: "adminMarkOrderPaid",
        token: state.token,
        order_id: orderId,
        payment_method: "TRANSFER",
        payment_reference: `ADMIN-${Date.now()}`
      });
      toast(`Invoice ${invoiceNumber} berhasil dikonfirmasi. Akses tools sudah aktif.`);
      await loadAdminOperations(false);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function changeAdminAccessStatus(accessId, status) {
    const label = status === "ACTIVE" ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Yakin ingin ${label} akses tools ini?`)) return;

    try {
      await api({
        action: "adminSetAccessStatus",
        token: state.token,
        access_id: accessId,
        status
      });
      toast(status === "ACTIVE" ? "Akses berhasil diaktifkan." : "Akses berhasil dinonaktifkan.");
      await loadAdminOperations(false);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function resetAdminToolDevice(accessId) {
    if (!window.confirm("Reset perangkat user ini? User harus login ulang dari perangkatnya.")) return;

    try {
      await api({
        action: "adminResetToolDevice",
        token: state.token,
        access_id: accessId
      });
      toast("Perangkat berhasil di-reset.");
      await loadAdminOperations(false);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function createAdminUser(form) {
    const button = form.querySelector("button[type=submit]");
    const data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    button.textContent = "Membuat akun...";
    try {
      await api({ action: "adminCreateUser", token: state.token, ...data });
      toast(`Akun ${data.email} berhasil dibuat.`);
      form.reset();
      await loadAdminOperations(false);
    } catch (error) { toast(error.message, "error"); }
    finally { button.disabled = false; button.innerHTML = `${icons.users} Buat Akun`; }
  }

  function changeView(view) {
    state.currentView = view;
    if (view.startsWith("zone:")) state.selectedZone = view.split(":")[1];
    state.sidebarOpen = false;
    if (view.startsWith("tool:")) {
      const toolId = view.split(":").slice(1).join(":");
      state.currentToolDetail = null;
      state.currentToolLoading = true;
      state.toolTab = "summary";
      renderApp();
      loadToolDetail(toolId);
    } else {
      renderApp();
      if (view === "admin") loadAdminOperations(true);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatAudioTime(seconds) {
    const value = Number(seconds || 0);
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const remaining = Math.floor(value % 60);
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function bindSampleAudioPlayers() {
    const players = [...document.querySelectorAll("[data-audio-player]")];

    players.forEach(player => {
      const audio = player.querySelector("audio");
      const playButton = player.querySelector("[data-audio-play]");
      const progress = player.querySelector("[data-audio-progress]");
      const current = player.querySelector("[data-audio-current]");
      const total = player.querySelector("[data-audio-total]");
      const status = player.querySelector("[data-audio-status]");

      if (!audio || !playButton || !progress) return;

      const updateDuration = () => {
        total.textContent = formatAudioTime(audio.duration);
      };

      const updateProgress = () => {
        const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        progress.value = String(percent);
        progress.style.setProperty("--audio-progress", `${percent}%`);
        current.textContent = formatAudioTime(audio.currentTime);
      };

      const setPlayingState = playing => {
        player.classList.toggle("is-playing", playing);
        playButton.textContent = playing ? "❚❚" : "▶";
        playButton.setAttribute("aria-label", playing ? "Jeda audio" : "Putar audio");
        status.textContent = playing ? "Sedang diputar" : audio.currentTime > 0 ? "Dijeda" : "Siap diputar";
      };

      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("durationchange", updateDuration);
      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("ended", () => {
        audio.currentTime = 0;
        updateProgress();
        setPlayingState(false);
        status.textContent = "Selesai diputar";
      });
      audio.addEventListener("error", () => {
        status.textContent = "Audio gagal dimuat";
        player.classList.add("has-error");
      });

      playButton.addEventListener("click", async () => {
        if (audio.paused) {
          players.forEach(otherPlayer => {
            if (otherPlayer === player) return;
            const otherAudio = otherPlayer.querySelector("audio");
            if (otherAudio && !otherAudio.paused) {
              otherAudio.pause();
              otherPlayer.classList.remove("is-playing");
              const otherButton = otherPlayer.querySelector("[data-audio-play]");
              const otherStatus = otherPlayer.querySelector("[data-audio-status]");
              if (otherButton) otherButton.textContent = "▶";
              if (otherStatus) otherStatus.textContent = "Dijeda";
            }
          });

          try {
            await audio.play();
            setPlayingState(true);
          } catch {
            status.textContent = "Klik lagi untuk memutar";
          }
        } else {
          audio.pause();
          setPlayingState(false);
        }
      });

      progress.addEventListener("input", () => {
        if (!audio.duration) return;
        const percent = Number(progress.value || 0);
        audio.currentTime = (percent / 100) * audio.duration;
        updateProgress();
      });

      updateDuration();
      updateProgress();
    });
  }

  function bindAppEvents() {
    bindSampleAudioPlayers();
    document.querySelectorAll("[data-view]").forEach(node => node.addEventListener("click", () => changeView(node.dataset.view)));
    document.querySelectorAll("[data-open-tool]").forEach(node => node.addEventListener("click", () => changeView(`tool:${node.dataset.openTool}`)));
    document.querySelectorAll("[data-tool-tab]").forEach(node => node.addEventListener("click", () => { state.toolTab = node.dataset.toolTab; renderApp(); }));
    document.querySelectorAll("[data-buy-tool]").forEach(node => node.addEventListener("click", () => startPurchase(node.dataset.buyTool)));
    document.querySelectorAll("[data-launch-tool]").forEach(node => node.addEventListener("click", () => launchTool(node.dataset.launchTool)));
    document.querySelectorAll("[data-open-tool-module]").forEach(node => node.addEventListener("click", () => openToolModule(node.dataset.openToolModule)));
    document.querySelectorAll("[data-complete-tool-module]").forEach(node => node.addEventListener("click", () => completeToolModule(node.dataset.completeToolModule)));
    document.querySelectorAll("[data-zone]").forEach(node => node.addEventListener("click", () => { state.selectedZone = node.dataset.zone; renderApp(); }));
    document.querySelectorAll("[data-open-module]").forEach(node => node.addEventListener("click", () => openModule(node.dataset.openModule)));
    document.querySelectorAll("[data-complete-module]").forEach(node => node.addEventListener("click", () => toggleComplete(node.dataset.completeModule)));
    document.querySelectorAll("[data-note-module]").forEach(node => node.addEventListener("click", () => { state.selectedNoteModule = node.dataset.noteModule; renderApp(); }));
    document.querySelectorAll("[data-external]").forEach(node => node.addEventListener("click", () => openExternal(node.dataset.external)));
    document.getElementById("logout-button")?.addEventListener("click", () => logout(true));
    document.getElementById("mobile-menu")?.addEventListener("click", () => { state.sidebarOpen = !state.sidebarOpen; renderApp(); });
    document.getElementById("sidebar-overlay")?.addEventListener("click", () => { state.sidebarOpen = false; renderApp(); });
    document.getElementById("save-note")?.addEventListener("click", saveNote);
    document.getElementById("refresh-admin")?.addEventListener("click", () => loadAdminOperations(true));
    document.getElementById("admin-create-form")?.addEventListener("submit", event => { event.preventDefault(); createAdminUser(event.currentTarget); });
    document.querySelectorAll("[data-admin-tab]").forEach(node => node.addEventListener("click", () => { state.adminTab = node.dataset.adminTab; renderApp(); }));
    document.querySelectorAll("[data-confirm-order]").forEach(node => node.addEventListener("click", () => confirmAdminOrder(node.dataset.confirmOrder, node.dataset.invoice)));
    document.querySelectorAll("[data-access-status]").forEach(node => node.addEventListener("click", () => changeAdminAccessStatus(node.dataset.accessStatus, node.dataset.nextStatus)));
    document.querySelectorAll("[data-reset-device]").forEach(node => node.addEventListener("click", () => resetAdminToolDevice(node.dataset.resetDevice)));
    const search = document.getElementById("module-search");
    search?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        state.moduleSearch = search.value;
        state.selectedZone = "all";
        changeView("checklist");
      }
    });
    if (state.currentView === "admin" && !state.adminLoading && !(state.adminData.orders || []).length) loadAdminOperations(true);
  }

  async function init() {
    if (loadSession()) await bootstrap(true);
    else renderLogin();
  }

  init();
})();
