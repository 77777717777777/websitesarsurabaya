const API_BASE = '/api';

async function apiRequest(path, { method = 'GET', body = null, auth = false } = {}) {
  const opts = {
    method,
    headers: {},
  };
  if (auth) opts.credentials = 'include';
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res, json;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch (err) {
    throw new Error('Tidak dapat terhubung ke server API. Pastikan backend Flask berjalan.');
  }
  try {
    json = await res.json();
  } catch (err) {
    throw new Error('Respons server tidak valid.');
  }
  if (!res.ok && res.status !== 401) {
    throw new Error(json.message || `Request gagal (HTTP ${res.status})`);
  }
  return { status: res.status, ...json };
}

/* Upload file (multipart/form-data) -- terpisah dari apiRequest() karena
   body-nya FormData, bukan JSON (Content-Type diisi otomatis oleh browser
   dengan boundary yang benar, JANGAN di-set manual). */
async function apiUpload(path, formData) {
  let res, json;
  try {
    res = await fetch(API_BASE + path, { method: 'POST', credentials: 'include', body: formData });
  } catch (err) {
    throw new Error('Tidak dapat terhubung ke server API. Pastikan backend Flask berjalan.');
  }
  try {
    json = await res.json();
  } catch (err) {
    throw new Error('Respons server tidak valid.');
  }
  if (!res.ok && res.status !== 401) {
    throw new Error(json.message || `Request gagal (HTTP ${res.status})`);
  }
  return { status: res.status, ...json };
}

function qs(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length) usp.set(k, v.join(','));
    } else {
      usp.set(k, v);
    }
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

const Api = {
  // ---- Publik ----
  kpi: (f) => apiRequest(`/kpi${qs(f)}`),
  operasi: (f) => apiRequest(`/operasi${qs(f)}`),
  komposisiKejadian: (f) => apiRequest(`/komposisi-kejadian${qs(f)}`),
  topKlasifikasi: (f) => apiRequest(`/top-klasifikasi${qs(f)}`),
  statusDilaksanakan: (f) => apiRequest(`/status-dilaksanakan${qs(f)}`),
  statusHasil: (f) => apiRequest(`/status-hasil${qs(f)}`),
  trenBulanan: (f) => apiRequest(`/tren-bulanan${qs(f)}`),
  bebanWilayah: (f) => apiRequest(`/beban-wilayah${qs(f)}`),
  sumberBerita: (f) => apiRequest(`/admin/sumber-berita${qs(f)}`, { auth: true }), // PII, wajib login
  waktuKejadian: (f) => apiRequest(`/waktu-kejadian${qs(f)}`),
  durasiOperasi: (f) => apiRequest(`/durasi-operasi${qs(f)}`),
  korbanAgregat: (f) => apiRequest(`/korban-agregat${qs(f)}`),
  refNilai: (nama) => apiRequest(`/ref-nilai/${nama}`),

  // ---- Admin (session cookie wajib) ----
  adminLogin: (username, password) => apiRequest('/admin/login', { method: 'POST', body: { username, password }, auth: true }),
  adminLogout: () => apiRequest('/admin/logout', { method: 'POST', auth: true }),
  adminMe: () => apiRequest('/admin/me', { auth: true }),
  adminOperasiList: (opt) => apiRequest(`/admin/operasi${qs(opt)}`, { auth: true }),
  adminOperasiDetail: (id) => apiRequest(`/admin/operasi/${id}`, { auth: true }),
  adminOperasiCreate: (payload) => apiRequest('/admin/operasi', { method: 'POST', body: payload, auth: true }),
  adminOperasiUpdate: (id, payload) => apiRequest(`/admin/operasi/${id}`, { method: 'PUT', body: payload, auth: true }),
  adminOperasiDelete: (id) => apiRequest(`/admin/operasi/${id}`, { method: 'DELETE', auth: true }),
  adminOperasiBulkImport: (rows) => apiRequest('/admin/operasi/bulk', { method: 'POST', body: { rows }, auth: true }),
  adminOperasiBulkPreview: (file, tahun) => {
    const fd = new FormData();
    fd.append('file', file);
    if (tahun) fd.append('tahun', tahun);
    return apiUpload('/admin/operasi/bulk/preview', fd);
  },
  adminList: () => apiRequest('/admin/admins', { auth: true }),
  adminCreate: (payload) => apiRequest('/admin/admins', { method: 'POST', body: payload, auth: true }),
  adminSetStatus: (id, status) => apiRequest(`/admin/admins/${id}/status`, { method: 'PUT', body: { status }, auth: true }),
  adminChangePassword: (passwordLama, passwordBaru, konfirmasi) => apiRequest('/admin/me/password', {
    method: 'PUT',
    body: { password_lama: passwordLama, password_baru: passwordBaru, konfirmasi_password_baru: konfirmasi },
    auth: true,
  }),
};