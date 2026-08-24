/* ================= API CLIENT =================
   Wrapper tipis di atas fetch() untuk semua endpoint backend Flask.
   Frontend disajikan oleh Flask sendiri (backend/static), jadi API selalu
   berada di origin yang sama -- cukup path relatif, tidak perlu base URL
   terpisah atau CORS. Endpoint admin tetap kirim cookie sesi lewat
   credentials:'include' (aman meski same-origin). */
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
  bebanPos: (f) => apiRequest(`/beban-pos${qs(f)}`),
  instansiTerlibat: (f) => apiRequest(`/instansi-terlibat${qs(f)}`),
  sumberBerita: (f) => apiRequest(`/sumber-berita${qs(f)}`),
  waktuKejadian: (f) => apiRequest(`/waktu-kejadian${qs(f)}`),
  durasiOperasi: (f) => apiRequest(`/durasi-operasi${qs(f)}`),
  korbanAgregat: (f) => apiRequest(`/korban-agregat${qs(f)}`),
  ref: (nama) => apiRequest(`/ref/${nama}`),

  // ---- Admin (session cookie wajib) ----
  adminLogin: (username, password) => apiRequest('/admin/login', { method: 'POST', body: { username, password }, auth: true }),
  adminLogout: () => apiRequest('/admin/logout', { method: 'POST', auth: true }),
  adminMe: () => apiRequest('/admin/me', { auth: true }),
  adminOperasiList: () => apiRequest('/admin/operasi', { auth: true }),
  adminOperasiDetail: (id) => apiRequest(`/admin/operasi/${id}`, { auth: true }),
  adminOperasiCreate: (payload) => apiRequest('/admin/operasi', { method: 'POST', body: payload, auth: true }),
  adminOperasiUpdate: (id, payload) => apiRequest(`/admin/operasi/${id}`, { method: 'PUT', body: payload, auth: true }),
  adminOperasiDelete: (id) => apiRequest(`/admin/operasi/${id}`, { method: 'DELETE', auth: true }),
};
