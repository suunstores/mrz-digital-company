/**
 * MRZ Digital Academy - Google Apps Script Backend (MVP)
 * Spreadsheet template: MRZ_Digital_Academy_Database.xlsx
 *
 * Jalankan pertama kali:
 * 1) setupProject()
 * 2) Isi sheet USER_IMPORT
 * 3) importPendingUsers()
 * 4) Deploy sebagai Web App
 */

const MRZ = {
  HEADER_ROW: 4,
  DATA_ROW: 5,
  MAX_FAILED_LOGIN: 5,
  LOCK_MINUTES: 15,
  PASSWORD_ROUNDS: 1200,
  SHEETS: {
    SETTINGS: 'SETTINGS',
    USER_IMPORT: 'USER_IMPORT',
    USERS: 'USERS',
    MODULES: 'MODULES',
    PROGRESS: 'PROGRESS',
    NOTES: 'NOTES',
    SCHEDULE: 'SCHEDULE',
    ANNOUNCEMENTS: 'ANNOUNCEMENTS',
    AUDIT_LOG: 'AUDIT_LOG',
    TOOLS: 'TOOLS',
    TOOL_MODULES: 'TOOL_MODULES',
    TOOL_SAMPLES: 'TOOL_SAMPLES',
    TOOL_PROGRESS: 'TOOL_PROGRESS',
    USER_ACCESS: 'USER_ACCESS',
    ORDERS: 'ORDERS'
  },
  HEADERS: {
    SETTINGS: ['key', 'value', 'description'],
    USER_IMPORT: ['name', 'email', 'temporary_password', 'package', 'role', 'expires_at', 'import_status', 'result_message'],
    USERS: ['user_id', 'name', 'email', 'password_hash', 'password_salt', 'package', 'status', 'registered_at', 'expires_at', 'last_login_at', 'failed_attempts', 'locked_until', 'role', 'phone', 'registration_source'],
    MODULES: ['module_id', 'zone_no', 'zone_name', 'title', 'description', 'video_url', 'worksheet_url', 'sort_order', 'required_previous_module_id', 'is_published', 'duration_minutes', 'thumbnail_url'],
    PROGRESS: ['progress_id', 'user_id', 'module_id', 'is_completed', 'completed_at', 'updated_at'],
    NOTES: ['note_id', 'user_id', 'module_id', 'note_text', 'updated_at'],
    SCHEDULE: ['schedule_id', 'user_id', 'title', 'start_at', 'end_at', 'meeting_url', 'status', 'created_at'],
    ANNOUNCEMENTS: ['announcement_id', 'title', 'body', 'is_published', 'published_at'],
    AUDIT_LOG: ['log_id', 'user_id', 'action', 'details', 'created_at'],
    TOOLS: ['tool_id', 'tool_name', 'slug', 'short_description', 'headline', 'subheadline', 'benefits', 'audience', 'original_price', 'sale_price', 'thumbnail_url', 'purchase_label', 'is_active', 'sort_order', 'tool_url'],
    TOOL_MODULES: ['tool_module_id', 'tool_id', 'title', 'description', 'video_url', 'worksheet_url', 'sort_order', 'access_level', 'duration_minutes', 'is_published'],
    TOOL_SAMPLES: ['sample_id', 'tool_id', 'title', 'description', 'media_type', 'media_url', 'sort_order', 'is_published'],
    TOOL_PROGRESS: ['progress_id', 'user_id', 'tool_module_id', 'is_completed', 'completed_at', 'updated_at'],
    USER_ACCESS: ['access_id', 'user_id', 'tool_id', 'status', 'expires_at', 'order_id', 'created_at'],
    ORDERS: ['order_id', 'invoice_number', 'user_id', 'tool_id', 'customer_name', 'email', 'phone', 'original_price', 'amount_paid', 'payment_method', 'payment_reference', 'status', 'created_at', 'paid_at']
  }
};

/** =========================
 *  PUBLIC WEB APP ENDPOINTS
 *  ========================= */

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'health').trim();

  if (action === 'health') {
    return json_({
      ok: true,
      service: 'MRZ Digital Academy API',
      timestamp: new Date().toISOString()
    });
  }

  return json_({
    ok: false,
    error: 'Gunakan POST untuk mengakses API.'
  });
}

function doPost(e) {
  try {
    const body = parseRequestBody_(e);
    const action = String(body.action || '').trim();

    switch (action) {
      case 'login':
        return json_(apiLogin_(body));
      case 'register':
        return json_(apiRegister_(body));
      case 'bootstrap':
        return json_(apiBootstrap_(body));
      case 'completeModule':
        return json_(apiCompleteModule_(body));
      case 'saveNote':
        return json_(apiSaveNote_(body));
      case 'toolDetail':
        return json_(apiToolDetail_(body));
      case 'completeToolModule':
        return json_(apiCompleteToolModule_(body));
      case 'launchTool':
        return json_(apiLaunchTool_(body));
      case 'createOrder':
        return json_(apiCreateOrder_(body));
      case 'adminSummary':
        return json_(apiAdminSummary_(body));
      case 'adminCreateUser':
        return json_(apiAdminCreateUser_(body));
      case 'adminSetUserStatus':
        return json_(apiAdminSetUserStatus_(body));
      case 'adminGrantToolAccess':
        return json_(apiAdminGrantToolAccess_(body));
      case 'adminMarkOrderPaid':
        return json_(apiAdminMarkOrderPaid_(body));
      default:
        return json_({ ok: false, error: 'Action tidak dikenal.' });
    }
  } catch (error) {
    writeLog_('', 'API_ERROR', String(error && error.message ? error.message : error));
    return json_({
      ok: false,
      error: error && error.message ? error.message : 'Terjadi kesalahan pada server.'
    });
  }
}

/** =========================
 *  ONE-TIME SETUP & ADMIN
 *  ========================= */

function setupProject() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('Buka Apps Script dari spreadsheet melalui Extensions → Apps Script.');
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', active.getId());

  if (!props.getProperty('TOKEN_SECRET')) {
    props.setProperty('TOKEN_SECRET', randomSecret_());
  }
  if (!props.getProperty('PASSWORD_PEPPER')) {
    props.setProperty('PASSWORD_PEPPER', randomSecret_());
  }

  Object.keys(MRZ.SHEETS).forEach(function(key) {
    ensureSheet_(MRZ.SHEETS[key], MRZ.HEADERS[key]);
  });

  seedVoiceOverProduct_();

  const settings = getSettings_();
  if (settings.TIMEZONE) {
    active.setSpreadsheetTimeZone(String(settings.TIMEZONE));
  }

  return {
    ok: true,
    spreadsheet_id: active.getId(),
    sheets_ready: Object.keys(MRZ.SHEETS).length,
    message: 'Setup selesai. Lanjut isi USER_IMPORT lalu jalankan importPendingUsers().'
  };
}

/**
 * Isi sheet USER_IMPORT mulai baris 5.
 * Kolom import_status boleh kosong atau PENDING.
 * Setelah sukses, temporary_password otomatis dikosongkan.
 */
function importPendingUsers() {
  const sheet = getSheet_(MRZ.SHEETS.USER_IMPORT);
  const rows = readObjects_(MRZ.SHEETS.USER_IMPORT);
  let created = 0;
  let failed = 0;

  rows.forEach(function(item) {
    const status = String(item.import_status || '').trim().toUpperCase();
    if (status && status !== 'PENDING' && status !== 'ERROR') return;
    if (!item.email && !item.name && !item.temporary_password) return;

    try {
      createUser(
        item.email,
        item.name,
        item.temporary_password,
        item.package || 'STANDARD',
        item.role || 'MEMBER',
        item.expires_at || ''
      );

      sheet.getRange(item._row, 3).clearContent();
      sheet.getRange(item._row, 7).setValue('CREATED');
      sheet.getRange(item._row, 8).setValue('Akun berhasil dibuat.');
      created++;
    } catch (error) {
      sheet.getRange(item._row, 7).setValue('ERROR');
      sheet.getRange(item._row, 8).setValue(error.message || String(error));
      failed++;
    }
  });

  return { ok: true, created: created, failed: failed };
}

function createUser(email, name, temporaryPassword, packageName, role, expiresAt, phone, registrationSource) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    email = normalizeEmail_(email);
    name = String(name || '').trim();
    temporaryPassword = String(temporaryPassword || '');
    packageName = String(packageName || 'STANDARD').trim().toUpperCase();
    role = String(role || 'MEMBER').trim().toUpperCase();
    phone = normalizePhone_(phone);
    registrationSource = String(registrationSource || 'ADMIN').trim().toUpperCase();

    if (!email || email.indexOf('@') < 1) throw new Error('Email tidak valid.');
    if (!name) throw new Error('Nama wajib diisi.');
    validatePassword_(temporaryPassword);
    if (['MEMBER', 'ADMIN'].indexOf(role) === -1) throw new Error('Role harus MEMBER atau ADMIN.');

    if (findUserByEmail_(email)) {
      throw new Error('Email sudah terdaftar.');
    }

    const salt = randomSecret_().slice(0, 32);
    const passwordHash = hashPassword_(temporaryPassword, salt);
    const userId = makeId_('USR');
    const now = new Date();
    const expiry = normalizeDate_(expiresAt);

    appendObject_(MRZ.SHEETS.USERS, {
      user_id: userId,
      name: name,
      email: email,
      password_hash: passwordHash,
      password_salt: salt,
      package: packageName,
      status: 'ACTIVE',
      registered_at: now,
      expires_at: expiry || '',
      last_login_at: '',
      failed_attempts: 0,
      locked_until: '',
      role: role,
      phone: phone,
      registration_source: registrationSource
    });

    writeLog_(userId, 'USER_CREATED', JSON.stringify({ email: email, role: role, package: packageName }));
    return { ok: true, user_id: userId, email: email };
  } finally {
    lock.releaseLock();
  }
}

/** Berikan akses Voice Over secara manual dari Apps Script editor. */
function grantVoiceOverAccess(email, expiresAt) {
  const user = findUserByEmail_(email);
  if (!user) throw new Error('User tidak ditemukan.');
  return grantToolAccess_(user.user_id, 'TOOL-VO', '', expiresAt || '');
}

/** Tandai invoice sudah dibayar dan buka akses tools. */
function markOrderPaidFromSheet(invoiceNumber, paymentReference) {
  const key = String(invoiceNumber || '').trim();
  if (!key) throw new Error('Invoice wajib diisi.');
  const order = readObjects_(MRZ.SHEETS.ORDERS).filter(function(row) {
    return String(row.invoice_number) === key || String(row.order_id) === key;
  })[0];
  if (!order) throw new Error('Pesanan tidak ditemukan.');
  updateObjectRow_(MRZ.SHEETS.ORDERS, order._row, {
    status: 'PAID',
    payment_method: 'MANUAL',
    payment_reference: paymentReference || '',
    paid_at: new Date()
  });
  grantToolAccess_(order.user_id, order.tool_id, order.order_id, '');
  return { ok: true, invoice_number: order.invoice_number, access_granted: true };
}

function resetUserPassword(email, newPassword) {
  email = normalizeEmail_(email);
  validatePassword_(newPassword);

  const user = findUserByEmail_(email);
  if (!user) throw new Error('User tidak ditemukan.');

  const salt = randomSecret_().slice(0, 32);
  updateObjectRow_(MRZ.SHEETS.USERS, user._row, {
    password_salt: salt,
    password_hash: hashPassword_(newPassword, salt),
    failed_attempts: 0,
    locked_until: ''
  });

  writeLog_(user.user_id, 'PASSWORD_RESET', email);
  return { ok: true };
}

/** =========================
 *  API ACTIONS
 *  ========================= */

function apiLogin_(body) {
  const email = normalizeEmail_(body.email);
  const password = String(body.password || '');
  const user = findUserByEmail_(email);

  if (!user) throw new Error('Email atau password salah.');

  const now = new Date();
  const lockedUntil = normalizeDate_(user.locked_until);
  if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
    throw new Error('Login terkunci sementara. Coba kembali beberapa menit lagi.');
  }

  if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
    throw new Error('Akun tidak aktif. Hubungi admin.');
  }

  const expiry = normalizeDate_(user.expires_at);
  if (expiry && expiry.getTime() < startOfToday_().getTime()) {
    updateObjectRow_(MRZ.SHEETS.USERS, user._row, { status: 'EXPIRED' });
    throw new Error('Masa aktif akun sudah berakhir.');
  }

  const valid = constantTimeEqual_(
    hashPassword_(password, String(user.password_salt || '')),
    String(user.password_hash || '')
  );

  if (!valid) {
    const attempts = Number(user.failed_attempts || 0) + 1;
    const patch = { failed_attempts: attempts };

    if (attempts >= MRZ.MAX_FAILED_LOGIN) {
      patch.locked_until = new Date(now.getTime() + MRZ.LOCK_MINUTES * 60 * 1000);
      patch.failed_attempts = 0;
    }

    updateObjectRow_(MRZ.SHEETS.USERS, user._row, patch);
    writeLog_(user.user_id, 'LOGIN_FAILED', email);
    throw new Error('Email atau password salah.');
  }

  updateObjectRow_(MRZ.SHEETS.USERS, user._row, {
    last_login_at: now,
    failed_attempts: 0,
    locked_until: ''
  });

  const settings = getSettings_();
  const sessionHours = Math.max(1, Number(settings.SESSION_HOURS || 12));
  const token = createToken_({
    uid: user.user_id,
    email: user.email,
    role: String(user.role || 'MEMBER').toUpperCase(),
    exp: now.getTime() + sessionHours * 60 * 60 * 1000
  });

  writeLog_(user.user_id, 'LOGIN_SUCCESS', email);

  return {
    ok: true,
    token: token,
    user: publicUser_(user)
  };
}

function apiBootstrap_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');
  assertActiveUser_(user);

  const modules = readObjects_(MRZ.SHEETS.MODULES)
    .filter(function(m) { return toBoolean_(m.is_published); })
    .sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); });

  const progressRows = readObjects_(MRZ.SHEETS.PROGRESS)
    .filter(function(p) { return String(p.user_id) === String(user.user_id); });

  const completedMap = {};
  progressRows.forEach(function(p) {
    if (toBoolean_(p.is_completed)) completedMap[String(p.module_id)] = true;
  });

  const modulePayload = modules.map(function(m) {
    const prerequisite = String(m.required_previous_module_id || '').trim();
    return {
      module_id: m.module_id,
      zone_no: Number(m.zone_no || 0),
      zone_name: m.zone_name,
      title: m.title,
      description: m.description,
      video_url: m.video_url,
      worksheet_url: m.worksheet_url,
      sort_order: Number(m.sort_order || 0),
      required_previous_module_id: prerequisite,
      duration_minutes: Number(m.duration_minutes || 0),
      thumbnail_url: m.thumbnail_url,
      is_completed: !!completedMap[String(m.module_id)],
      is_locked: prerequisite ? !completedMap[prerequisite] : false
    };
  });

  const completedCount = modulePayload.filter(function(m) { return m.is_completed; }).length;
  const totalCount = modulePayload.length;

  const notes = readObjects_(MRZ.SHEETS.NOTES)
    .filter(function(n) { return String(n.user_id) === String(user.user_id); })
    .map(cleanObject_);

  const schedule = readObjects_(MRZ.SHEETS.SCHEDULE)
    .filter(function(s) { return !s.user_id || String(s.user_id) === String(user.user_id); })
    .map(cleanObject_);

  const announcements = readObjects_(MRZ.SHEETS.ANNOUNCEMENTS)
    .filter(function(a) { return toBoolean_(a.is_published); })
    .map(cleanObject_);

  const tools = buildToolsCatalog_(user);

  return {
    ok: true,
    user: publicUser_(user),
    settings: publicSettings_(),
    modules: modulePayload,
    notes: notes,
    schedule: schedule,
    announcements: announcements,
    tools: tools,
    progress: {
      completed: completedCount,
      total: totalCount,
      percent: totalCount ? Math.round((completedCount / totalCount) * 100) : 0
    }
  };
}

function apiCompleteModule_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');
  assertActiveUser_(user);

  const moduleId = String(body.module_id || '').trim();
  const completed = body.completed === undefined ? true : toBoolean_(body.completed);
  if (!moduleId) throw new Error('module_id wajib diisi.');

  const moduleRow = readObjects_(MRZ.SHEETS.MODULES).filter(function(m) {
    return String(m.module_id) === moduleId && toBoolean_(m.is_published);
  })[0];

  if (!moduleRow) throw new Error('Modul tidak ditemukan.');

  const prerequisite = String(moduleRow.required_previous_module_id || '').trim();
  if (completed && prerequisite && !isModuleCompleted_(user.user_id, prerequisite)) {
    throw new Error('Selesaikan modul sebelumnya terlebih dahulu.');
  }

  const existing = readObjects_(MRZ.SHEETS.PROGRESS).filter(function(p) {
    return String(p.user_id) === String(user.user_id) && String(p.module_id) === moduleId;
  })[0];

  const now = new Date();
  if (existing) {
    updateObjectRow_(MRZ.SHEETS.PROGRESS, existing._row, {
      is_completed: completed,
      completed_at: completed ? now : '',
      updated_at: now
    });
  } else {
    appendObject_(MRZ.SHEETS.PROGRESS, {
      progress_id: makeId_('PRG'),
      user_id: user.user_id,
      module_id: moduleId,
      is_completed: completed,
      completed_at: completed ? now : '',
      updated_at: now
    });
  }

  writeLog_(user.user_id, completed ? 'MODULE_COMPLETED' : 'MODULE_REOPENED', moduleId);
  return { ok: true, module_id: moduleId, completed: completed };
}

function apiSaveNote_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');
  assertActiveUser_(user);

  const moduleId = String(body.module_id || '').trim();
  const noteText = String(body.note_text || '').trim();
  if (!moduleId) throw new Error('module_id wajib diisi.');
  if (noteText.length > 10000) throw new Error('Catatan terlalu panjang.');

  const existing = readObjects_(MRZ.SHEETS.NOTES).filter(function(n) {
    return String(n.user_id) === String(user.user_id) && String(n.module_id) === moduleId;
  })[0];

  const now = new Date();
  if (existing) {
    updateObjectRow_(MRZ.SHEETS.NOTES, existing._row, {
      note_text: noteText,
      updated_at: now
    });
  } else {
    appendObject_(MRZ.SHEETS.NOTES, {
      note_id: makeId_('NTE'),
      user_id: user.user_id,
      module_id: moduleId,
      note_text: noteText,
      updated_at: now
    });
  }

  writeLog_(user.user_id, 'NOTE_SAVED', moduleId);
  return { ok: true, module_id: moduleId, updated_at: now };
}

function apiAdminSummary_(body) {
  const auth = requireAdmin_(body.token);
  const users = readObjects_(MRZ.SHEETS.USERS);
  const modules = readObjects_(MRZ.SHEETS.MODULES).filter(function(m) { return toBoolean_(m.is_published); });
  const progress = readObjects_(MRZ.SHEETS.PROGRESS).filter(function(p) { return toBoolean_(p.is_completed); });

  return {
    ok: true,
    requested_by: auth.email,
    summary: {
      total_users: users.length,
      active_users: users.filter(function(u) { return String(u.status).toUpperCase() === 'ACTIVE'; }).length,
      published_modules: modules.length,
      completed_modules: progress.length
    }
  };
}

function apiAdminCreateUser_(body) {
  requireAdmin_(body.token);
  return createUser(
    body.email,
    body.name,
    body.temporary_password,
    body.package || 'STANDARD',
    body.role || 'MEMBER',
    body.expires_at || ''
  );
}

function apiAdminSetUserStatus_(body) {
  const auth = requireAdmin_(body.token);
  const email = normalizeEmail_(body.email);
  const status = String(body.status || '').trim().toUpperCase();

  if (['ACTIVE', 'SUSPENDED', 'EXPIRED'].indexOf(status) === -1) {
    throw new Error('Status tidak valid.');
  }

  const user = findUserByEmail_(email);
  if (!user) throw new Error('User tidak ditemukan.');

  updateObjectRow_(MRZ.SHEETS.USERS, user._row, { status: status });
  writeLog_(auth.uid, 'USER_STATUS_CHANGED', JSON.stringify({ target: email, status: status }));
  return { ok: true, email: email, status: status };
}


/** =========================
 *  SELF REGISTRATION, TOOLS & ORDERS
 *  ========================= */

function apiRegister_(body) {
  const name = String(body.name || '').trim();
  const email = normalizeEmail_(body.email);
  const phone = normalizePhone_(body.phone);
  const password = String(body.password || '');

  if (name.length < 2) throw new Error('Nama minimal 2 karakter.');
  if (!email || email.indexOf('@') < 1) throw new Error('Email tidak valid.');
  if (phone.length < 9) throw new Error('Nomor WhatsApp tidak valid.');
  validatePassword_(password);

  createUser(email, name, password, 'FREE', 'MEMBER', '', phone, 'SELF_SIGNUP');
  writeLog_('', 'SELF_REGISTERED', email);
  return apiLogin_({ email: email, password: password });
}

function apiToolDetail_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');

  const tool = getToolById_(body.tool_id || body.slug);
  if (!tool || !toBoolean_(tool.is_active)) throw new Error('Tools tidak ditemukan.');

  const hasAccess = hasToolAccess_(user, tool.tool_id);
  const completedMap = {};
  readObjects_(MRZ.SHEETS.TOOL_PROGRESS).forEach(function(row) {
    if (String(row.user_id) === String(user.user_id) && toBoolean_(row.is_completed)) {
      completedMap[String(row.tool_module_id)] = true;
    }
  });

  const modules = readObjects_(MRZ.SHEETS.TOOL_MODULES)
    .filter(function(row) {
      return String(row.tool_id) === String(tool.tool_id) && toBoolean_(row.is_published);
    })
    .sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); })
    .map(function(row) {
      const accessLevel = String(row.access_level || 'PREMIUM').toUpperCase();
      const locked = accessLevel !== 'FREE' && !hasAccess;
      return {
        tool_module_id: row.tool_module_id,
        tool_id: row.tool_id,
        title: row.title,
        description: row.description,
        video_url: locked ? '' : row.video_url,
        worksheet_url: locked ? '' : row.worksheet_url,
        sort_order: Number(row.sort_order || 0),
        access_level: accessLevel,
        duration_minutes: Number(row.duration_minutes || 0),
        is_locked: locked,
        is_completed: !!completedMap[String(row.tool_module_id)]
      };
    });

  const samples = readObjects_(MRZ.SHEETS.TOOL_SAMPLES)
    .filter(function(row) {
      return String(row.tool_id) === String(tool.tool_id) && toBoolean_(row.is_published);
    })
    .sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); })
    .map(function(row) {
      return {
        sample_id: row.sample_id,
        title: row.title,
        description: row.description,
        media_type: String(row.media_type || 'AUDIO').toUpperCase(),
        media_url: row.media_url || '',
        sort_order: Number(row.sort_order || 0)
      };
    });

  return {
    ok: true,
    tool: publicTool_(tool, hasAccess),
    samples: samples,
    modules: modules,
    progress: {
      completed: modules.filter(function(m) { return m.is_completed; }).length,
      total: modules.length,
      percent: modules.length ? Math.round(modules.filter(function(m) { return m.is_completed; }).length / modules.length * 100) : 0
    }
  };
}

function apiCompleteToolModule_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');

  const moduleId = String(body.tool_module_id || '').trim();
  const completed = body.completed === undefined ? true : toBoolean_(body.completed);
  const moduleRow = readObjects_(MRZ.SHEETS.TOOL_MODULES).filter(function(row) {
    return String(row.tool_module_id) === moduleId && toBoolean_(row.is_published);
  })[0];
  if (!moduleRow) throw new Error('Modul tools tidak ditemukan.');

  const accessLevel = String(moduleRow.access_level || 'PREMIUM').toUpperCase();
  if (accessLevel !== 'FREE' && !hasToolAccess_(user, moduleRow.tool_id)) {
    throw new Error('Modul ini khusus pemilik akses tools.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const existing = readObjects_(MRZ.SHEETS.TOOL_PROGRESS).filter(function(row) {
      return String(row.user_id) === String(user.user_id) && String(row.tool_module_id) === moduleId;
    })[0];
    const now = new Date();
    if (existing) {
      updateObjectRow_(MRZ.SHEETS.TOOL_PROGRESS, existing._row, {
        is_completed: completed,
        completed_at: completed ? now : '',
        updated_at: now
      });
    } else {
      appendObject_(MRZ.SHEETS.TOOL_PROGRESS, {
        progress_id: makeId_('TPR'),
        user_id: user.user_id,
        tool_module_id: moduleId,
        is_completed: completed,
        completed_at: completed ? now : '',
        updated_at: now
      });
    }
  } finally {
    lock.releaseLock();
  }

  writeLog_(user.user_id, completed ? 'TOOL_MODULE_COMPLETED' : 'TOOL_MODULE_REOPENED', moduleId);
  return { ok: true, tool_module_id: moduleId, completed: completed };
}

function apiLaunchTool_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  const tool = getToolById_(body.tool_id || body.slug);
  if (!user || !tool) throw new Error('Tools tidak ditemukan.');
  if (!hasToolAccess_(user, tool.tool_id)) throw new Error('Akses tools belum aktif.');
  if (!String(tool.tool_url || '').trim()) throw new Error('Link tools belum diisi oleh admin.');

  writeLog_(user.user_id, 'TOOL_LAUNCHED', tool.tool_id);
  return { ok: true, tool_id: tool.tool_id, url: String(tool.tool_url).trim() };
}

function apiCreateOrder_(body) {
  const auth = requireAuth_(body.token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');

  const tool = getToolById_(body.tool_id || body.slug);
  if (!tool || !toBoolean_(tool.is_active)) throw new Error('Tools tidak ditemukan.');
  if (hasToolAccess_(user, tool.tool_id)) throw new Error('Akses tools ini sudah aktif.');

  const phone = normalizePhone_(body.phone || user.phone);
  if (phone.length < 9) throw new Error('Nomor WhatsApp wajib diisi.');

  const pending = readObjects_(MRZ.SHEETS.ORDERS).filter(function(row) {
    return String(row.user_id) === String(user.user_id) &&
      String(row.tool_id) === String(tool.tool_id) &&
      String(row.status || '').toUpperCase() === 'PENDING';
  }).sort(function(a, b) { return Number(b._row) - Number(a._row); })[0];

  if (pending) {
    return {
      ok: true,
      existing: true,
      order: publicOrder_(pending),
      message: 'Pesanan sebelumnya masih menunggu pembayaran.'
    };
  }

  const now = new Date();
  const order = {
    order_id: makeId_('ORD'),
    invoice_number: makeInvoiceNumber_(),
    user_id: user.user_id,
    tool_id: tool.tool_id,
    customer_name: user.name,
    email: user.email,
    phone: phone,
    original_price: Number(tool.original_price || 0),
    amount_paid: Number(tool.sale_price || 0),
    payment_method: 'PENDING_GATEWAY',
    payment_reference: '',
    status: 'PENDING',
    created_at: now,
    paid_at: ''
  };

  appendObject_(MRZ.SHEETS.ORDERS, order);
  if (!user.phone && phone) updateObjectRow_(MRZ.SHEETS.USERS, user._row, { phone: phone });
  writeLog_(user.user_id, 'ORDER_CREATED', JSON.stringify({ order_id: order.order_id, tool_id: tool.tool_id }));

  return {
    ok: true,
    existing: false,
    order: publicOrder_(order),
    message: 'Pesanan berhasil dibuat dan masuk ke Spreadsheet.'
  };
}

function apiAdminGrantToolAccess_(body) {
  const auth = requireAdmin_(body.token);
  const user = body.user_id ? findUserById_(body.user_id) : findUserByEmail_(body.email);
  const tool = getToolById_(body.tool_id || body.slug);
  if (!user) throw new Error('User tidak ditemukan.');
  if (!tool) throw new Error('Tools tidak ditemukan.');

  const result = grantToolAccess_(user.user_id, tool.tool_id, body.order_id || '', body.expires_at || '');
  writeLog_(auth.uid, 'TOOL_ACCESS_GRANTED', JSON.stringify({ user_id: user.user_id, tool_id: tool.tool_id }));
  return result;
}

function apiAdminMarkOrderPaid_(body) {
  const auth = requireAdmin_(body.token);
  const key = String(body.order_id || body.invoice_number || '').trim();
  if (!key) throw new Error('order_id atau invoice_number wajib diisi.');

  const order = readObjects_(MRZ.SHEETS.ORDERS).filter(function(row) {
    return String(row.order_id) === key || String(row.invoice_number) === key;
  })[0];
  if (!order) throw new Error('Pesanan tidak ditemukan.');

  updateObjectRow_(MRZ.SHEETS.ORDERS, order._row, {
    status: 'PAID',
    payment_method: body.payment_method || order.payment_method || 'MANUAL',
    payment_reference: body.payment_reference || order.payment_reference || '',
    paid_at: new Date()
  });
  grantToolAccess_(order.user_id, order.tool_id, order.order_id, body.expires_at || '');
  writeLog_(auth.uid, 'ORDER_MARKED_PAID', order.order_id);
  return { ok: true, order_id: order.order_id, status: 'PAID', access_granted: true };
}

function buildToolsCatalog_(user) {
  return readObjects_(MRZ.SHEETS.TOOLS)
    .filter(function(tool) { return toBoolean_(tool.is_active); })
    .sort(function(a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); })
    .map(function(tool) { return publicTool_(tool, hasToolAccess_(user, tool.tool_id)); });
}

function publicTool_(tool, hasAccess) {
  return {
    tool_id: tool.tool_id,
    tool_name: tool.tool_name,
    slug: tool.slug,
    short_description: tool.short_description,
    headline: tool.headline,
    subheadline: tool.subheadline,
    benefits: splitList_(tool.benefits),
    audience: splitList_(tool.audience),
    original_price: Number(tool.original_price || 0),
    sale_price: Number(tool.sale_price || 0),
    thumbnail_url: tool.thumbnail_url || '',
    purchase_label: tool.purchase_label || 'Buka Akses Sekarang',
    has_access: !!hasAccess
  };
}

function publicOrder_(order) {
  return {
    order_id: order.order_id,
    invoice_number: order.invoice_number,
    tool_id: order.tool_id,
    amount: Number(order.amount_paid || 0),
    status: String(order.status || 'PENDING'),
    created_at: order.created_at || ''
  };
}

function getToolById_(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return null;
  return readObjects_(MRZ.SHEETS.TOOLS).filter(function(tool) {
    return String(tool.tool_id || '').toLowerCase() === key || String(tool.slug || '').toLowerCase() === key;
  })[0] || null;
}

function hasToolAccess_(user, toolId) {
  if (!user) return false;
  const packageName = String(user.package || '').toUpperCase();
  const role = String(user.role || '').toUpperCase();
  if (role === 'ADMIN' || packageName === 'OWNER' || packageName === 'VIP') return true;

  const now = new Date().getTime();
  return readObjects_(MRZ.SHEETS.USER_ACCESS).some(function(row) {
    if (String(row.user_id) !== String(user.user_id) || String(row.tool_id) !== String(toolId)) return false;
    if (String(row.status || '').toUpperCase() !== 'ACTIVE') return false;
    const expiry = normalizeDate_(row.expires_at);
    return !expiry || expiry.getTime() >= now;
  });
}

function grantToolAccess_(userId, toolId, orderId, expiresAt) {
  const existing = readObjects_(MRZ.SHEETS.USER_ACCESS).filter(function(row) {
    return String(row.user_id) === String(userId) && String(row.tool_id) === String(toolId);
  })[0];
  const expiry = normalizeDate_(expiresAt);
  if (existing) {
    updateObjectRow_(MRZ.SHEETS.USER_ACCESS, existing._row, {
      status: 'ACTIVE',
      expires_at: expiry || '',
      order_id: orderId || existing.order_id || ''
    });
    return { ok: true, access_id: existing.access_id, updated: true };
  }

  const accessId = makeId_('ACS');
  appendObject_(MRZ.SHEETS.USER_ACCESS, {
    access_id: accessId,
    user_id: userId,
    tool_id: toolId,
    status: 'ACTIVE',
    expires_at: expiry || '',
    order_id: orderId || '',
    created_at: new Date()
  });
  return { ok: true, access_id: accessId, updated: false };
}

function seedVoiceOverProduct_() {
  const toolId = 'TOOL-VO';
  if (!getToolById_(toolId)) {
    appendObject_(MRZ.SHEETS.TOOLS, {
      tool_id: toolId,
      tool_name: 'MRZ Voice Over Pro',
      slug: 'mrz-voice-over-pro',
      short_description: 'Tools AI untuk membuat voice over natural, ekspresif, dan siap digunakan untuk berbagai kebutuhan konten.',
      headline: 'Ubah Teks Menjadi Voice Over Natural dalam Hitungan Menit',
      subheadline: 'Tidak perlu rekaman sendiri, microphone mahal, atau editing rumit. Masukkan script, pilih gaya suara, lalu hasilkan voice over siap pakai.',
      benefits: 'Membuat voice over tanpa rekaman manual\nHasil suara lebih natural dan tidak kaku\nCocok untuk iklan, storytelling, edukasi, dan affiliate\nMenghemat waktu produksi dan biaya talent\nMudah digunakan oleh pemula',
      audience: 'Content creator TikTok, Reels, dan YouTube\nAffiliate marketer\nPenjual produk digital maupun fisik\nYouTuber faceless\nGuru, mentor, freelancer, dan agency konten',
      original_price: 300000,
      sale_price: 99000,
      thumbnail_url: '/assets/mrz-voice-over-pro.png',
      purchase_label: 'Buka Akses Sekarang — Rp99.000',
      is_active: true,
      sort_order: 1,
      tool_url: 'https://share.gemini.google/VhNLvTXBhApD'
    });
  }

  const existingModules = readObjects_(MRZ.SHEETS.TOOL_MODULES).filter(function(row) { return String(row.tool_id) === toolId; });
  if (!existingModules.length) {
    [
      ['TM-VO-001', 'Pengenalan MRZ Voice Over Pro', 'Kenali fungsi, alur kerja, dan hasil yang bisa dibuat menggunakan tools.', 1, 'FREE', 6],
      ['TM-VO-002', 'Membuat Script yang Natural', 'Pelajari struktur script agar voice over terdengar lebih manusiawi dan tidak kaku.', 2, 'PREMIUM', 12],
      ['TM-VO-003', 'Memilih Karakter dan Gaya Suara', 'Sesuaikan karakter suara dengan iklan, storytelling, edukasi, atau konten affiliate.', 3, 'PREMIUM', 10],
      ['TM-VO-004', 'Mengatur Intonasi dan Emosi', 'Gunakan instruksi yang tepat untuk menghasilkan intonasi, tempo, dan emosi yang sesuai.', 4, 'PREMIUM', 14],
      ['TM-VO-005', 'Praktik Generate Voice Over', 'Praktik dari script hingga hasil akhir yang siap dipakai untuk konten.', 5, 'PREMIUM', 15]
    ].forEach(function(item) {
      appendObject_(MRZ.SHEETS.TOOL_MODULES, {
        tool_module_id: item[0], tool_id: toolId, title: item[1], description: item[2],
        video_url: '', worksheet_url: '', sort_order: item[3], access_level: item[4],
        duration_minutes: item[5], is_published: true
      });
    });
  }

  const existingSamples = readObjects_(MRZ.SHEETS.TOOL_SAMPLES).filter(function(row) { return String(row.tool_id) === toolId; });
  if (!existingSamples.length) {
    [
      ['SMP-VO-001', 'Voice Over Iklan', 'Contoh hasil untuk video iklan dan promosi.', 1],
      ['SMP-VO-002', 'Voice Over Storytelling', 'Contoh narasi dengan gaya bercerita yang lebih emosional.', 2],
      ['SMP-VO-003', 'Voice Over Edukasi', 'Contoh suara jelas untuk konten tutorial dan edukasi.', 3]
    ].forEach(function(item) {
      appendObject_(MRZ.SHEETS.TOOL_SAMPLES, {
        sample_id: item[0], tool_id: toolId, title: item[1], description: item[2],
        media_type: 'AUDIO', media_url: '', sort_order: item[3], is_published: true
      });
    });
  }
}

function splitList_(value) {
  return String(value || '').split(/\r?\n|\|/).map(function(item) { return item.trim(); }).filter(Boolean);
}

function makeInvoiceNumber_() {
  const tz = String(getSettings_().TIMEZONE || 'Asia/Jakarta');
  return 'MRZ-' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
}

/** =========================
 *  AUTH & PASSWORD HELPERS
 *  ========================= */

function validatePassword_(password) {
  password = String(password || '');
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
  if (password.length > 128) throw new Error('Password terlalu panjang.');
}

function hashPassword_(password, salt) {
  const pepper = getRequiredProperty_('PASSWORD_PEPPER');
  let value = String(salt) + ':' + String(password) + ':' + pepper;

  for (let i = 0; i < MRZ.PASSWORD_ROUNDS; i++) {
    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      value,
      Utilities.Charset.UTF_8
    );
    value = Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
  }
  return value;
}

function createToken_(payload) {
  const encodedPayload = base64UrlEncodeString_(JSON.stringify(payload));
  const signatureBytes = Utilities.computeHmacSha256Signature(
    encodedPayload,
    getRequiredProperty_('TOKEN_SECRET'),
    Utilities.Charset.UTF_8
  );
  const signature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/g, '');
  return encodedPayload + '.' + signature;
}

function verifyToken_(token) {
  token = String(token || '');
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('Sesi tidak valid. Silakan login ulang.');

  const expectedBytes = Utilities.computeHmacSha256Signature(
    parts[0],
    getRequiredProperty_('TOKEN_SECRET'),
    Utilities.Charset.UTF_8
  );
  const expected = Utilities.base64EncodeWebSafe(expectedBytes).replace(/=+$/g, '');

  if (!constantTimeEqual_(parts[1], expected)) {
    throw new Error('Sesi tidak valid. Silakan login ulang.');
  }

  const payload = JSON.parse(base64UrlDecodeString_(parts[0]));
  if (!payload.exp || Number(payload.exp) < Date.now()) {
    throw new Error('Sesi sudah berakhir. Silakan login ulang.');
  }
  return payload;
}

function requireAuth_(token) {
  const auth = verifyToken_(token);
  const user = findUserById_(auth.uid);
  if (!user) throw new Error('User tidak ditemukan.');
  assertActiveUser_(user);
  return auth;
}

function requireAdmin_(token) {
  const auth = requireAuth_(token);
  if (String(auth.role || '').toUpperCase() !== 'ADMIN') {
    throw new Error('Akses admin diperlukan.');
  }
  return auth;
}

function assertActiveUser_(user) {
  if (String(user.status || '').toUpperCase() !== 'ACTIVE') {
    throw new Error('Akun tidak aktif.');
  }
  const expiry = normalizeDate_(user.expires_at);
  if (expiry && expiry.getTime() < startOfToday_().getTime()) {
    throw new Error('Masa aktif akun sudah berakhir.');
  }
}

function constantTimeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    mismatch |= (a.charCodeAt(i % Math.max(1, a.length)) || 0) ^ (b.charCodeAt(i % Math.max(1, b.length)) || 0);
  }
  return mismatch === 0;
}

/** =========================
 *  SPREADSHEET HELPERS
 *  ========================= */

function getSpreadsheet_() {
  const id = getRequiredProperty_('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  return sheet;
}

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const width = Math.max(sheet.getLastColumn(), headers.length, 1);
  const currentHeaders = sheet.getRange(MRZ.HEADER_ROW, 1, 1, width).getValues()[0]
    .map(function(value) { return String(value || '').trim(); });
  const isEmpty = currentHeaders.every(function(value) { return value === ''; });

  if (isEmpty) {
    sheet.getRange(MRZ.HEADER_ROW, 1, 1, headers.length).setValues([headers]);
    return;
  }

  let nextColumn = currentHeaders.filter(Boolean).length + 1;
  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) >= 0) return;
    sheet.getRange(MRZ.HEADER_ROW, nextColumn).setValue(header);
    currentHeaders[nextColumn - 1] = header;
    nextColumn++;
  });
}

function readObjects_(sheetName) {
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < MRZ.HEADER_ROW || lastColumn < 1) return [];

  const headers = sheet.getRange(MRZ.HEADER_ROW, 1, 1, lastColumn).getValues()[0]
    .map(function(h) { return String(h || '').trim(); });

  if (lastRow < MRZ.DATA_ROW) return [];

  const values = sheet.getRange(MRZ.DATA_ROW, 1, lastRow - MRZ.DATA_ROW + 1, lastColumn).getValues();
  const result = [];

  values.forEach(function(row, index) {
    const hasValue = row.some(function(value) { return value !== '' && value !== null; });
    if (!hasValue) return;

    const obj = { _row: MRZ.DATA_ROW + index };
    headers.forEach(function(header, colIndex) {
      if (header) obj[header] = row[colIndex];
    });
    result.push(obj);
  });

  return result;
}

function appendObject_(sheetName, object) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const row = headers.map(function(header) {
    return object[header] === undefined ? '' : object[header];
  });
  sheet.appendRow(row);
}

function updateObjectRow_(sheetName, rowNumber, patch) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const map = {};
  headers.forEach(function(header, index) { map[header] = index + 1; });

  Object.keys(patch).forEach(function(key) {
    if (!map[key]) return;
    sheet.getRange(rowNumber, map[key]).setValue(patch[key] === undefined ? '' : patch[key]);
  });
}

function getHeaders_(sheet) {
  return sheet.getRange(MRZ.HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function(h) { return String(h || '').trim(); });
}

function findUserByEmail_(email) {
  email = normalizeEmail_(email);
  return readObjects_(MRZ.SHEETS.USERS).filter(function(user) {
    return normalizeEmail_(user.email) === email;
  })[0] || null;
}

function findUserById_(userId) {
  return readObjects_(MRZ.SHEETS.USERS).filter(function(user) {
    return String(user.user_id) === String(userId);
  })[0] || null;
}

function isModuleCompleted_(userId, moduleId) {
  return readObjects_(MRZ.SHEETS.PROGRESS).some(function(p) {
    return String(p.user_id) === String(userId) &&
      String(p.module_id) === String(moduleId) &&
      toBoolean_(p.is_completed);
  });
}

function getSettings_() {
  const result = {};
  readObjects_(MRZ.SHEETS.SETTINGS).forEach(function(row) {
    const key = String(row.key || '').trim();
    if (key) result[key] = row.value;
  });
  return result;
}

function publicSettings_() {
  const all = getSettings_();
  return {
    APP_NAME: all.APP_NAME || 'MRZ Digital Academy',
    BRAND_NAME: all.BRAND_NAME || 'MRZ Digital',
    TAGLINE: all.TAGLINE || 'Mempermudah Pekerjaanmu',
    PRIMARY_COLOR: all.PRIMARY_COLOR || '#6E1423',
    ACCENT_COLOR: all.ACCENT_COLOR || '#C9A227',
    TELEGRAM_URL: all.TELEGRAM_URL || '',
    MENTOR_WHATSAPP: all.MENTOR_WHATSAPP || '',
    SUPPORT_EMAIL: all.SUPPORT_EMAIL || ''
  };
}

function publicUser_(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    package: user.package,
    status: user.status,
    expires_at: user.expires_at || '',
    role: user.role || 'MEMBER',
    phone: user.phone || ''
  };
}

function writeLog_(userId, action, details) {
  try {
    appendObject_(MRZ.SHEETS.AUDIT_LOG, {
      log_id: makeId_('LOG'),
      user_id: userId || '',
      action: String(action || ''),
      details: String(details || '').slice(0, 5000),
      created_at: new Date()
    });
  } catch (ignore) {
    // Logging tidak boleh menghentikan proses utama.
  }
}

/** =========================
 *  GENERAL HELPERS
 *  ========================= */

function parseRequestBody_(e) {
  if (!e) return {};

  const contents = e.postData && e.postData.contents ? String(e.postData.contents) : '';
  if (contents) {
    try {
      return JSON.parse(contents);
    } catch (ignore) {
      // Fallback ke parameter form.
    }
  }

  return e.parameter || {};
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanObject_(obj) {
  const output = {};
  Object.keys(obj).forEach(function(key) {
    if (key !== '_row') output[key] = obj[key];
  });
  return output;
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone_(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.indexOf('0') === 0) phone = '62' + phone.slice(1);
  return phone;
}

function normalizeDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday_() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toBoolean_(value) {
  if (value === true || value === 1) return true;
  return ['TRUE', 'YES', '1', 'ACTIVE', 'COMPLETED'].indexOf(String(value || '').trim().toUpperCase()) >= 0;
}

function makeId_(prefix) {
  return prefix + '-' + Date.now() + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function randomSecret_() {
  return [Utilities.getUuid(), Utilities.getUuid(), Utilities.getUuid()].join('-');
}

function getRequiredProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Konfigurasi belum lengkap. Jalankan setupProject() terlebih dahulu.');
  return value;
}

function base64UrlEncodeString_(value) {
  return Utilities.base64EncodeWebSafe(String(value), Utilities.Charset.UTF_8).replace(/=+$/g, '');
}

function base64UrlDecodeString_(value) {
  const text = String(value);
  const padded = text + '='.repeat((4 - (text.length % 4)) % 4);
  const bytes = Utilities.base64DecodeWebSafe(padded);
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}
