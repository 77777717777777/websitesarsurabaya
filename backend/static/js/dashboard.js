const MONTHS_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const CAT_COLORS = ['#FFE066','#FFB020','#FF7A1A','#D6480F','#7A2E0E'];
const KATEGORI_LABEL_OVERRIDES = {
  'BENCANA': 'Bencana',
  'KECELAKAAN DGN PENANGANAN KHUSUS': 'Kecelakaan dengan Penanganan Khusus',
  'KECELAKAAN KAPAL': 'Kecelakaan Kapal',
  'KECELAKAAN PESAWAT UDARA': 'Kecelakaan Pesawat Udara',
  'KONDISI YANG MEMBAHAYAKAN JIWA MANUSIA': 'Kondisi yang Membahayakan Jiwa Manusia',
  'PENGECEKAN SIGNAL DISTRESS': 'Pengecekan Signal Distress',
};
function toDisplayKategoriLabel(raw){
  if (!raw) return raw;
  if (KATEGORI_LABEL_OVERRIDES[raw]) return KATEGORI_LABEL_OVERRIDES[raw];
  return String(raw).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function $(id){ return document.getElementById(id); }

/* Daftar kategori & klasifikasi standar untuk dropdown form manual -- SAMA
   PERSIS dengan CATEGORY_KEYWORDS / KATEGORI_MAP di
   backend/services/excel_import_service.py, supaya nilai yang diketik manual
   selalu konsisten dengan hasil impor Excel. Beda dari CATS/REF.klasifikasi
   (dibangun dari nilai yang SUDAH ADA di database lewat /api/ref-nilai) --
   daftar di sini tetap lengkap walau suatu kategori belum pernah dipakai
   sekalipun (mis. "PENGECEKAN SIGNAL DISTRESS"). Diurutkan dari yang paling
   sering dipakai di data historis, supaya pilihan umum ada di atas. */
const ADMIN_KATEGORI_OPTIONS = [
  'KONDISI YANG MEMBAHAYAKAN JIWA MANUSIA',
  'KECELAKAAN KAPAL',
  'BENCANA',
  'KECELAKAAN DGN PENANGANAN KHUSUS',
  'KECELAKAAN PESAWAT UDARA',
  'PENGECEKAN SIGNAL DISTRESS',
];
const ADMIN_KLASIFIKASI_OPTIONS = [
  'Orang Tenggelam/Hanyut/Tercebur',
  'Orang Terseret Arus/Ombak',
  'Kapal - Tenggelam/Terbalik/Kandas/Rusak',
  'Man Over Boat (MOB)',
  'Orang Hilang/Tersesat',
  'Orang Terjatuh',
  'Kapal - Hilang Kontak',
  'Bencana Alam - Banjir',
  'Bencana Alam - Longsor',
  'Kapal - Terbakar',
  'Kecelakaan Lalu Lintas',
  'Evakuasi/Medevac',
  'Percobaan Bunuh Diri',
  'Orang Tertimpa/Terjepit/Terjebak',
  'Pesawat Jatuh',
  'Bencana Alam - Gempa',
  'Lainnya',
];

function formatTahunLabel(year){
  if (year == null) return 'Semua Tahun';
  return String(year);
}

/* ================= GEO TRANSFORM (kalibrasi affine dari 8 titik referensi) ================= */
function geoToPct(lat, lon){
  if (lat === null || lat === undefined || lon === null || lon === undefined) return null;
  let x = 29.157929*lon + -3.575186*lat + -3271.824035;
  let y = -2.847388*lon + -47.683002*lat + 13.164748;
  x = Math.max(2, Math.min(98, x));
  y = Math.max(4, Math.min(96, y));
  return {x, y};
}
function pctToGeo(xPct, yPct){
  const lon = 0.034046701328907636*xPct + -0.002552760623949221*yPct + 111.42842217070506;
  const lat = -0.002033097010199057*xPct + -0.02081939597747001*yPct + -6.377853561900309;
  return {lat, lon};
}

/* Kelompok wilayah skematik untuk Zona Prioritas -- posisi x/y untuk tata letak visual,
   ref[lat,lon] untuk mengelompokkan titik kejadian riil via kedekatan koordinat terdekat.
   'wilayah' di sini dipetakan ke nama WILAYAH (wilayah_mapped), bukan ke record pos/unit
   siaga dari database -- WILAYAH_REAL_COORDS di bawah menyediakan titik koordinat referensi
   untuk digambar di peta per nama wilayah. */
const ZONA_DEF = [
  {kab:"Kab. Sumenep",    wilayah:"Sumenep",     x:78, y:24, ref:[-7.02,113.85]},
  {kab:"Kota Surabaya",   wilayah:"Surabaya",    x:40, y:40, ref:[-7.25,112.75]},
  {kab:"Kab. Banyuwangi", wilayah:"Banyuwangi",  x:90, y:80, ref:[-8.30,114.40]},
  {kab:"Kab. Trenggalek", wilayah:"Trenggalek",  x:15, y:82, ref:[-8.25,111.72]},
  {kab:"Kab. Malang",     wilayah:"Malang",      x:47, y:70, ref:[-8.40,112.62]},
  {kab:"Kab. Bojonegoro", wilayah:"Bojonegoro",  x:15, y:32, ref:[-7.15,111.90]},
  {kab:"Kab. Lamongan",   wilayah:"Lamongan",    x:27, y:34, ref:[-6.86,112.32]},
  {kab:"Kab. Jember",     wilayah:"Jember",      x:70, y:78, ref:[-8.30,113.70]},
  {kab:"Kab. Pamekasan",  wilayah:"Sumenep",     x:64, y:22, ref:[-7.15,113.45]},
  {kab:"Kab. Gresik",     wilayah:"Surabaya",    x:33, y:34, ref:[-7.13,112.65]},
  {kab:"Kab. Sidoarjo",   wilayah:"Surabaya",    x:41, y:46, ref:[-7.38,112.72]},
];
function nearestZonaIdx(lat, lon){
  let best = -1, bestD = Infinity;
  ZONA_DEF.forEach((z,i)=>{
    const d = (z.ref[0]-lat)**2 + (z.ref[1]-lon)**2;
    if (d < bestD){ bestD = d; best = i; }
  });
  return best;
}
function computeZonaStats(operasiRows){
  const buckets = ZONA_DEF.map(z => ({...z, kejadian:0, selamat:0, meninggal:0, hilang:0, catCount:{}}));
  (operasiRows||[]).forEach(o=>{
    if (o.lokasi_kejadian_lat == null || o.lokasi_kejadian_lon == null) return;
    const idx = nearestZonaIdx(o.lokasi_kejadian_lat, o.lokasi_kejadian_lon);
    if (idx < 0) return;
    const b = buckets[idx];
    b.kejadian++;
    b.selamat += o.jumlah_selamat || 0;
    b.meninggal += o.jumlah_meninggal || 0;
    b.hilang += o.jumlah_hilang || 0;
    b.catCount[o.nama_kategori] = (b.catCount[o.nama_kategori] || 0) + 1;
  });
  buckets.forEach(b=>{
    let domCat = null, domN = -1;
    Object.entries(b.catCount).forEach(([k,v])=>{ if (v > domN){ domN = v; domCat = k; } });
    b.dominanCatId = domCat; // string nama kategori
  });
  return buckets.sort((a,b)=> b.kejadian - a.kejadian);
}

/* ================= STATE ================= */
let CATS = [];        // [{id,label,color}] -- id = nama kategori (string)
let CATMAP = {};       // nama_kategori (string) -> {label,color}
let WILAYAH_LIST = []; // [{id,label}] -- id = nama wilayah (string)
let WILAYAH_MAP = {};  // nama_wilayah -> {label}
let REF = { klasifikasi:[], sumber:[] }; // instansi & peralatan di-drop, tidak ada lagi tabel referensinya
let YEARS_AVAILABLE = [];
let auth = { isLoggedIn:false, id_admin:null, username:null, nama_lengkap:null };
let charts = {};
let predMonthKey = null;              // format "2026-09", ganti predMonthIdx lama
let PREDIKSI_ZONA_CACHE = null;       // { metadata, prediksi: { "2026-09": {...}, ... } }
let KABKOTA_GEOJSON_CACHE = null;

const WARNA_LEVEL = { 'Rendah': '#4CAF50', 'Sedang': '#FF9800', 'Tinggi': '#E53935' };
const WARNA_LUAR_SCOPE = '#4A4A4A';

async function fetchPrediksiZonaRawan(){
  if (PREDIKSI_ZONA_CACHE) return PREDIKSI_ZONA_CACHE;
  const res = await fetch('/api/prediksi-zona-rawan');
  const json = await res.json();
  PREDIKSI_ZONA_CACHE = json.data;
  return PREDIKSI_ZONA_CACHE;
}

async function fetchKabkotaGeoJSON(){
  if (KABKOTA_GEOJSON_CACHE) return KABKOTA_GEOJSON_CACHE;
  const res = await fetch('/data/kabkota-jatim.geojson');
  KABKOTA_GEOJSON_CACHE = await res.json();
  return KABKOTA_GEOJSON_CACHE;
}// 0,1,2 -> 3 bulan proyeksi ke depan

let state = {
  page: 'beranda',
  year: null,
  activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], // 1-12 (bulan_angka)
  activeCats: [],     // array of string (nama_kategori)
  activeWilayah: [],  // array of string (nama_wilayah)
};

/* Wilayah Banyuwangi & Jember tidak beroperasi/tidak mengirim data untuk tahun
   berjalan (2026 dan seterusnya), jadi default-nya di-uncheck untuk tahun itu -- tapi
   tetap wilayah aktif biasa, dan tetap bisa dicentang manual kapan saja. Dihitung ulang
   setiap kali filter Tahun berubah. */
const WILAYAH_DEFAULT_EXCLUDED = ['Banyuwangi', 'Jember'];
function computeDefaultActiveWilayah(year){
  if (year != null && year >= 2026) {
    return WILAYAH_LIST.filter(w => !WILAYAH_DEFAULT_EXCLUDED.includes(w.label)).map(w=>w.id);
  }
  return WILAYAH_LIST.map(w=>w.id);
}

function getActiveFilters(){
  return {
    tahun: state.year != null ? [state.year] : [],
    bulan: state.activeMonths, // sudah 1-12, cocok dengan bulan_angka di backend
    kategori: state.activeCats,
    wilayah: state.activeWilayah,
  };
}

/* ================= CLOCK ================= */
function tickClock(){
  const now = new Date();
  const timeEl = $('time-str'), dateEl = $('date-str2');
  if (timeEl){
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    timeEl.textContent = `${hh}:${mm}:${ss}`;
  }
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID',{day:'numeric', month:'long', year:'numeric'});
}
tickClock(); setInterval(tickClock, 1000);

/* ================= EXPORT PANEL =================
   Export data operasi (sesuai filter aktif) ke CSV/XLSX, atau screenshot halaman aktif
   ke PNG. XLSX pakai SheetJS, Image pakai html2canvas (keduanya dimuat dari CDN). */
function toggleExportPanel(){ $('export-panel').classList.toggle('open'); }
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.export-wrap')) $('export-panel') && $('export-panel').classList.remove('open');
});

const EXPORT_COLUMNS = [
  ['id_operasi','ID'], ['waktu_kejadian','Waktu Kejadian'], ['nama_kategori','Kategori'], ['nama_klasifikasi','Klasifikasi'],
  ['lokasi_kejadian_deskripsi','Lokasi Kejadian'], ['wilayah_mapped','Wilayah'],
  ['status_operasi','Status'], ['pob','POB'], ['jumlah_selamat','Selamat'], ['jumlah_meninggal','Meninggal Dunia'], ['jumlah_hilang','Hilang'],
];

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

async function exportCSV(){
  const rows = (await Api.operasi(getActiveFilters())).data || [];
  const escapeCsv = v => { if (v == null) return ''; const s = String(v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
  const header = EXPORT_COLUMNS.map(c=>escapeCsv(c[1])).join(',');
  const lines = rows.map(r => EXPORT_COLUMNS.map(c=>escapeCsv(r[c[0]])).join(','));
  const csv = [header, ...lines].join('\r\n');
  downloadBlob(new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'}), `operasi-sar-${Date.now()}.csv`);
}

async function exportXLSX(){
  if (typeof XLSX === 'undefined'){ showAdminToast('Library XLSX gagal dimuat (cek koneksi internet).', true); return; }
  const rows = (await Api.operasi(getActiveFilters())).data || [];
  const sheetData = rows.map(r => Object.fromEntries(EXPORT_COLUMNS.map(c=>[c[1], r[c[0]] != null ? r[c[0]] : ''])));
  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Operasi SAR');
  XLSX.writeFile(wb, `operasi-sar-${Date.now()}.xlsx`);
}

async function exportImage(){
  if (typeof html2canvas === 'undefined'){ showAdminToast('Library html2canvas gagal dimuat (cek koneksi internet).', true); return; }
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const canvas = await html2canvas(activePage, { backgroundColor:'#0A0706', scale:2 });
  canvas.toBlob(blob => { if (blob) downloadBlob(blob, `dashboard-${state.page}-${Date.now()}.png`); }, 'image/png');
}

/* Laporan PDF resmi (tabel + ringkasan KPI) -- beda dari "Export as Image" yang cuma
   screenshot tampilan dashboard. Dipakai untuk lampiran laporan resmi, bukan sekadar
   dokumentasi visual. Pakai jsPDF + plugin autoTable (CDN). */
async function exportPDF(){
  if (typeof window.jspdf === 'undefined'){ showAdminToast('Library PDF gagal dimuat (cek koneksi internet).', true); return; }
  const { jsPDF } = window.jspdf;
  const f = getActiveFilters();
  const [rowsRes, kpiRes] = await Promise.all([ Api.operasi(f), Api.kpi(f) ]);
  const rows = rowsRes.data || [];
  const kpi = kpiRes.data;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Laporan Data Operasi SAR', 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Kantor SAR Surabaya — Badan Nasional Pencarian dan Pertolongan', 40, 56);

  const filterParts = [
    `Tahun: ${state.year != null ? formatTahunLabel(state.year) : 'Semua tahun'}`,
    state.activeMonths.length < 12 ? `${state.activeMonths.length} bulan terpilih` : 'Semua bulan',
    (state.activeCats.length && state.activeCats.length < CATS.length) ? `${state.activeCats.length} kategori terpilih` : 'Semua kategori',
    (state.activeWilayah.length && state.activeWilayah.length < WILAYAH_LIST.length) ? `${state.activeWilayah.length} wilayah terpilih` : 'Semua wilayah',
  ];
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Filter aktif: ${filterParts.join('  ·  ')}`, 40, 72);
  doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 40, 84);

  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total Kejadian: ${(kpi.total_kejadian||0).toLocaleString('id-ID')}    ·    Korban Ditangani: ${(kpi.korban_ditangani||0).toLocaleString('id-ID')}    ·    Selamat: ${(kpi.selamat||0).toLocaleString('id-ID')}    ·    Meninggal Dunia: ${(kpi.meninggal||0).toLocaleString('id-ID')}    ·    Hilang: ${(kpi.hilang||0).toLocaleString('id-ID')}`,
    40, 102,
  );

  const head = [EXPORT_COLUMNS.map(c => c[1])];
  const body = rows.map(r => EXPORT_COLUMNS.map(c => {
    const v = r[c[0]];
    if (v == null) return '';
    if (c[0] === 'waktu_kejadian') { const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('id-ID'); }
    return String(v);
  }));

  doc.autoTable({
    head, body,
    startY: 116,
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [230, 89, 10], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 245, 240] },
    margin: { left: 40, right: 40, bottom: 36 },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(`Halaman ${doc.internal.getCurrentPageInfo().pageNumber} / ${doc.internal.getNumberOfPages()}`, pageWidth - 90, pageHeight - 18);
    },
  });

  doc.save(`laporan-operasi-sar-${Date.now()}.pdf`);
}

async function doExport(fmt){
  $('export-panel').classList.remove('open');
  try {
    if (fmt === 'csv') await exportCSV();
    else if (fmt === 'xlsx') await exportXLSX();
    else if (fmt === 'image') await exportImage();
    else if (fmt === 'pdf') await exportPDF();
  } catch (err) {
    showAdminToast('Gagal export: ' + err.message, true);
  }
}

/* ================= AUTH ================= */
function openLoginModal(){ $('login-modal').classList.add('open'); $('login-error').style.display = 'none'; }
function closeLoginModal(){ $('login-modal').classList.remove('open'); }
function togglePasswordVisibility(){
  const inp = $('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
async function submitLogin(){
  const username = ($('login-username').value || '').trim();
  const password = $('login-password').value || '';
  const btn = $('login-submit-btn');
  if (!username || !password){
    $('login-error').textContent = 'Username dan password wajib diisi.';
    $('login-error').style.display = 'block';
    return;
  }
  btn.disabled = true;
  try {
    const res = await Api.adminLogin(username, password);
    if (!res.success){
      $('login-error').textContent = res.message || 'Username atau password salah.';
      $('login-error').style.display = 'block';
      return;
    }
    auth = { isLoggedIn:true, id_admin: res.data.id_admin, username: res.data.username, nama_lengkap: res.data.nama_lengkap };
    $('login-username').value = ''; $('login-password').value = '';
    closeLoginModal();
    renderAuthUI();
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}
function onLoginBtnClick(){
  if (auth.isLoggedIn) $('admin-menu-panel').classList.toggle('open');
  else openLoginModal();
}
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.admin-auth-wrap')){
    const p = $('admin-menu-panel'); if (p) p.classList.remove('open');
  }
});
async function doLogout(){
  const p = $('admin-menu-panel'); if (p) p.classList.remove('open');
  try { await Api.adminLogout(); } catch(e){ /* ignore */ }
  auth = { isLoggedIn:false, id_admin:null, username:null, nama_lengkap:null };
  if (state.page === 'admin-input') goPage('beranda');
  renderAuthUI();
}
function renderAuthUI(){
  const txt = $('login-txt'), chev = $('login-chev');
  if (txt) txt.textContent = auth.isLoggedIn ? (auth.nama_lengkap || auth.username) : 'Login';
  if (chev) chev.style.display = auth.isLoggedIn ? 'inline' : 'none';
  const nameEl = $('admin-menu-name');
  if (nameEl) nameEl.textContent = auth.isLoggedIn ? `Masuk sebagai ${auth.username}` : '';
  const navItem = $('admin-nav-item'), navDivider = $('admin-nav-divider');
  if (navItem) navItem.style.display = auth.isLoggedIn ? 'flex' : 'none';
  if (navDivider) navDivider.style.display = auth.isLoggedIn ? 'block' : 'none';
  const exportWrap = $('export-wrap');
  if (exportWrap) exportWrap.style.display = auth.isLoggedIn ? 'flex' : 'none';
}
async function checkAuthOnLoad(){
  try {
    const res = await Api.adminMe();
    if (res.success){
      auth = { isLoggedIn:true, id_admin: res.data.id_admin, username: res.data.username, nama_lengkap: res.data.nama_lengkap };
    }
  } catch (e) { /* not logged in / backend not reachable yet */ }
  renderAuthUI();
}

/* ================= NAV ================= */
const PAGE_TITLE = {beranda:'Beranda', peta:'Peta Sebaran Kejadian', tren:'Tren & Statistik', zona:'Zona Prioritas', prediksi:'Prediksi Sebaran Lokasi', 'admin-input':'Input Data Operasi SAR'};
function goPage(p){
  if (p === 'admin-input' && !auth.isLoggedIn){ openLoginModal(); return; }
  state.page = p;
  document.querySelectorAll('.nav-item').forEach(b=> b.classList.toggle('active', b.dataset.page===p));
  document.querySelectorAll('.page').forEach(s=> s.classList.remove('active'));
  $('page-'+p).classList.add('active');
  $('page-title').textContent = PAGE_TITLE[p];
  const fb = document.querySelector('.filterbar');
  if (fb) fb.style.display = (p==='admin-input') ? 'none' : '';
  render();
}

/* ================= FILTER PANELS ================= */
function toggleMS(id){
  document.querySelectorAll('.ms-panel').forEach(p=>{ if (p.id !== 'panel-'+id) p.classList.remove('open'); });
  $('panel-'+id).classList.toggle('open');
}
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.msfilter')) document.querySelectorAll('.ms-panel').forEach(p=>p.classList.remove('open'));
});

function buildTahunPanel(){
  const optAll = `
    <label class="ms-opt"><input type="radio" name="rb_tahun" value="all" ${state.year===null?'checked':''} onchange="onTahunToggle(this)">Semua Tahun</label>
  `;
  const opts = YEARS_AVAILABLE.map(y => `
    <label class="ms-opt"><input type="radio" name="rb_tahun" value="${y}" ${y===state.year?'checked':''} onchange="onTahunToggle(this)">${formatTahunLabel(y)}</label>
  `).join('');
  $('panel-tahun').innerHTML = `<div class="ms-list">${optAll}${opts}</div>`;
  $('btn-tahun-text').textContent = 'Tahun: ' + formatTahunLabel(state.year);
}
function onTahunToggle(el){
  state.year = el.value === 'all' ? null : parseInt(el.value, 10);
  $('btn-tahun-text').textContent = 'Tahun: ' + formatTahunLabel(state.year);
  state.activeWilayah = computeDefaultActiveWilayah(state.year);
  buildWilayahPanel();
  $('panel-tahun').classList.remove('open');
  render();
}
function buildBulanPanel(){
  const items = MONTHS_FULL.map((m,i)=>`
    <label class="ms-opt"><input type="checkbox" checked data-idx="${i+1}" onchange="onBulanToggle(this)">${m}</label>
  `).join('');
  $('panel-bulan').innerHTML = `<div class="ms-list">${items}</div><div class="ms-actions"><button onclick="msAllBulan(true)">Pilih Semua</button><button onclick="msAllBulan(false)">Kosongkan</button></div>`;
}
function onBulanToggle(el){
  const i = parseInt(el.dataset.idx,10); // 1-12
  if (el.checked){ if (!state.activeMonths.includes(i)) state.activeMonths.push(i); }
  else state.activeMonths = state.activeMonths.filter(x=>x!==i);
  render();
}
function msAllBulan(on){
  state.activeMonths = on ? Array.from({length:12}, (_,i)=>i+1) : [];
  document.querySelectorAll('#panel-bulan input').forEach(cb=>cb.checked=on);
  render();
}
function buildKategoriPanel(){
  const items = CATS.map(c=>`
    <label class="ms-opt"><input type="checkbox" checked data-k="${c.id}" onchange="onKategoriToggle(this)"><span class="sw" style="background:${c.color}"></span>${c.label}</label>
  `).join('');
  $('panel-kategori').innerHTML = `<div class="ms-list">${items}</div><div class="ms-actions"><button onclick="msAllKategori(true)">Pilih Semua</button><button onclick="msAllKategori(false)">Kosongkan</button></div>`;
}
function onKategoriToggle(el){
  const k = el.dataset.k; // string, nama kategori
  if (el.checked){ if (!state.activeCats.includes(k)) state.activeCats.push(k); }
  else state.activeCats = state.activeCats.filter(x=>x!==k);
  render();
}
function msAllKategori(on){
  state.activeCats = on ? CATS.map(c=>c.id) : [];
  document.querySelectorAll('#panel-kategori input').forEach(cb=>cb.checked=on);
  render();
}
function buildWilayahPanel(){
  const items = WILAYAH_LIST.map(w=>{
    const checked = state.activeWilayah.includes(w.id);
    return `<label class="ms-opt"><input type="checkbox" ${checked?'checked':''} data-w="${w.id}" onchange="onWilayahToggle(this)">${w.label}</label>`;
  }).join('');
  $('panel-pos').innerHTML = `<div class="ms-list">${items}</div><div class="ms-actions"><button onclick="msAllWilayah(true)">Pilih Semua</button><button onclick="msAllWilayah(false)">Kosongkan</button></div>`;
}
function onWilayahToggle(el){
  const w = el.dataset.w;
  if (el.checked){ if (!state.activeWilayah.includes(w)) state.activeWilayah.push(w); }
  else state.activeWilayah = state.activeWilayah.filter(x=>x!==w);
  render();
}
function msAllWilayah(on){
  state.activeWilayah = on ? WILAYAH_LIST.map(w=>w.id) : [];
  buildWilayahPanel();
  render();
}
// Alias supaya markup HTML lama yang masih memanggil buildPosPanel/onPosToggle/msAllPos tidak langsung patah
function buildPosPanel(){ buildWilayahPanel(); }
function onPosToggle(el){ onWilayahToggle(el); }
function msAllPos(on){ msAllWilayah(on); }

/* ================= CHART HELPERS ================= */
const barValueLabels = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart){
    if (!chart.config.options.plugins || !chart.config.options.plugins.barValueLabels || !chart.config.options.plugins.barValueLabels.enabled) return;
    const { ctx } = chart;
    chart.data.datasets.forEach((ds, dsIdx)=>{
      const meta = chart.getDatasetMeta(dsIdx);
      meta.data.forEach((bar, i)=>{
        const val = ds.data[i];
        if (val === null || val === undefined) return;
        ctx.save();
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.fillStyle = '#FDF6EF';
        ctx.textBaseline = 'middle';
        if (chart.config.options.indexAxis === 'y'){
          ctx.textAlign = 'left';
          ctx.fillText(val.toLocaleString('id-ID'), bar.x + 6, bar.y);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(val.toLocaleString('id-ID'), bar.x, bar.y - 8);
        }
        ctx.restore();
      });
    });
  }
};
Chart.register(barValueLabels);
function destroy(id){ if (charts[id]){ charts[id].destroy(); delete charts[id]; } }
function baseOpt(){
  const line = 'rgba(255,138,54,.12)', mid = '#C9B8A8';
  Chart.defaults.color = mid; Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(18,13,10,.92)';
  Chart.defaults.plugins.tooltip.titleColor = '#FDF6EF';
  Chart.defaults.plugins.tooltip.bodyColor = '#C9B8A8';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,138,54,.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  return { line, mid };
}
function orangeGlow(ctx, strong, area){
  area = area || ctx.chart.chartArea;
  if (!area) return 'rgba(255,122,26,.14)';
  const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, strong || 'rgba(255,122,26,.45)');
  g.addColorStop(0.45, 'rgba(255,106,15,.16)');
  g.addColorStop(1, 'rgba(255,90,10,.02)');
  return g;
}
function renderLegendList(containerId, entries){
  $(containerId).innerHTML = entries.map(e=>`
    <div class="legend-row"><div class="l"><span class="sw" style="background:${e.color}"></span>${e.label}</div><div class="v">${e.value != null ? e.value.toLocaleString('id-ID') : ''}</div></div>`).join('');
}

/* ================= MAP DRAWING (SVG skematik, sebagian sudah legacy) ================= */
const JAVA_MAIN_PATH = "M28,176 C34,158 52,150 66,146 C90,140 96,150 116,148 C132,146 138,134 158,132 C176,130 182,140 198,140 C214,140 218,126 238,124 C256,122 262,132 282,130 C302,128 306,116 328,114 C350,112 356,122 380,122 C402,122 408,112 432,112 C456,112 460,122 484,122 C506,122 510,114 532,116 C556,118 558,128 582,130 C606,132 610,124 632,128 C656,132 662,142 686,148 C710,154 722,148 742,158 C758,166 768,176 772,190 C776,204 768,214 754,222 C738,231 728,226 712,234 C696,242 692,254 676,262 C660,270 650,266 634,276 C618,286 614,298 598,306 C582,314 572,308 556,304 C540,300 534,290 518,292 C502,294 500,304 484,306 C468,308 462,298 446,298 C430,298 426,308 410,308 C394,308 390,298 374,296 C358,294 352,304 336,302 C320,300 318,288 302,286 C286,284 280,294 264,290 C248,286 246,274 230,268 C214,262 204,268 190,258 C176,248 176,236 162,226 C148,216 136,220 124,210 C112,200 114,188 100,182 C86,176 76,186 62,182 C50,179 40,182 28,176 Z";
const MADURA_PATH = "M436,92 C452,80 472,74 498,72 C524,70 552,68 580,70 C604,72 624,78 640,88 C652,96 654,104 646,112 C636,120 620,118 604,122 C586,126 574,134 554,134 C534,134 524,124 504,122 C486,120 474,128 458,124 C444,120 440,112 434,104 C431,99 432,95 436,92 Z";
const SMALL_ISLANDS = [ {cx:762, cy:220, rx:20, ry:11}, {cx:118, cy:118, rx:10, ry:6}, {cx:672, cy:96, rx:7, ry:4.5}, {cx:250, cy:96, rx:6, ry:4} ];
function mapDefsOnce(){
  return `
    <defs>
      <pattern id="mgrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0L0 0 0 34" fill="none" stroke="#1A0F08" stroke-width="0.6"/></pattern>
      <clipPath id="javaClip"><path d="${JAVA_MAIN_PATH}"/><path d="${MADURA_PATH}"/></clipPath>
      <filter id="heatBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
      <radialGradient id="posGrad" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#FFC98A"/><stop offset="45%" stop-color="#FF7A1A"/><stop offset="100%" stop-color="#A63D12"/></radialGradient>
      <radialGradient id="posHalo" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,122,26,.55)"/><stop offset="100%" stop-color="rgba(255,122,26,0)"/></radialGradient>
    </defs>`;
}
function mapBaseSVG(opts){
  opts = opts || {};
  const islands = SMALL_ISLANDS.map(is=>`<ellipse cx="${is.cx}" cy="${is.cy}" rx="${is.rx}" ry="${is.ry}" fill="#120B07" stroke="#3A2010" stroke-width="1"/>`).join('');
  const land = (opts.hideLand) ? '' : `
    <path d="${JAVA_MAIN_PATH}" fill="#120B07" stroke="#3A2010" stroke-width="1.1"/>
    <path d="${MADURA_PATH}" fill="#0F0906" stroke="#3A2010" stroke-width="1.1"/>
    ${islands}`;
  return `
    ${mapDefsOnce()}
    <rect width="800" height="400" fill="url(#mgrid)"/>
    ${land}
    <text x="88" y="72" fill="#4A3020" font-size="9" font-family="JetBrains Mono" letter-spacing="3">LAUT JAWA</text>
    <text x="248" y="380" fill="#4A3020" font-size="9" font-family="JetBrains Mono" letter-spacing="3">SAMUDERA HINDIA</text>
    <text x="592" y="66" fill="#4A3020" font-size="8" font-family="JetBrains Mono" letter-spacing="2">SELAT MADURA</text>
  `;
}
function pt(x,y){ return [x/100*800, y/100*400]; }
function posMarkerSVG(px,py,size){
  const r = size || 13;
  return `<circle cx="${px}" cy="${py}" r="${r*2.6}" fill="url(#posHalo)"/>
    <circle cx="${px}" cy="${py}" r="${r}" fill="url(#posGrad)" stroke="rgba(255,214,170,.55)" stroke-width="1.4"/>
    <rect x="${px-r*0.36}" y="${py-r*0.36}" width="${r*0.72}" height="${r*0.72}" rx="2" fill="#1A0F08"/>
    <path d="M${px-r*0.22} ${py+r*0.16} L${px} ${py-r*0.3} L${px+r*0.22} ${py+r*0.16} Z" fill="#FFE1B0"/>`;
}
function showMapTip(id,label,val,x,y,unit){
  const el = $(id); if (!el) return;
  el.style.left = x+'%'; el.style.top = Math.max(6,y)+'%';
  el.innerHTML = `<div class="mt-lbl">Wilayah</div><div class="mt-name">${label}</div><div class="mt-row"><span>Kejadian</span><b>${val.toLocaleString('id-ID')}${unit||''}</b></div>`;
  el.style.display = 'block';
}
function hideMapTip(id){ const el = $(id); if (el) el.style.display = 'none'; }
function hotspotLayerZona(points, tooltipId){
  const dots = points.map(p=>
    `<div class="hotspot" style="left:${p.x}%; top:${p.y}%;" onmouseenter="showMapTip('${tooltipId}','${(p.label||'').replace(/'/g,"\\'")}', ${p.value}, ${p.x}, ${p.y})" onmouseleave="hideMapTip('${tooltipId}')"></div>`
  ).join('');
  return dots + `<div class="map-tip" id="${tooltipId}"></div>`;
}

/* Konten popup detail operasi (data riil dari /api/operasi, tanpa nama korban/pelapor) --
   dipakai bersama oleh popup SVG manual (peta skematik lama) dan marker.bindPopup() Leaflet. */
function buildIncidentPopupHTML(o, opts){
  opts = opts || {};
  const cat = CATMAP[o.nama_kategori] || {label:'Kejadian', color:'#FF7A1A'};
  const st = o.status_operasi || '-';
  const tanggal = o.waktu_kejadian ? new Date(o.waktu_kejadian) : null;
  const korban = (o.jumlah_selamat||0) + (o.jumlah_meninggal||0) + (o.jumlah_hilang||0);
  const closeBtn = opts.closeHandler ? `<button class="mp-close" onclick="${opts.closeHandler}">&times;</button>` : '';
  return `
    <div class="mp-head">
      <div><div class="mp-cat">${cat.label}</div><div class="mp-title">${o.lokasi_kejadian_deskripsi || o.wilayah_mapped || '-'}</div></div>
      ${closeBtn}
    </div>
    <div class="mp-body">
      <div class="mp-row"><span>Wilayah</span></div>
      <div style="font-size:11px; color:var(--text-hi); margin-top:-4px;">${o.wilayah_mapped || '-'}</div>
      <div class="mp-row"><span>Tanggal Kejadian</span><b>${tanggal ? tanggal.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-'}</b></div>
      <div class="mp-row"><span>Jumlah Korban</span><b>${korban} orang</b></div>
      <div class="mp-row"><span>Status</span><b>${st}</b></div>
    </div>`;
}
function openIncidentPopup(tooltipId, o){
  const popupEl = $('popup-'+tooltipId); if (!popupEl) return;
  hideMapTip(tooltipId);
  const g = geoToPct(o.lokasi_kejadian_lat, o.lokasi_kejadian_lon);
  popupEl.style.left = Math.min(78, g ? g.x : 50) + '%';
  popupEl.style.top = Math.max(4, (g ? g.y : 50) - 2) + '%';
  popupEl.innerHTML = buildIncidentPopupHTML(o, {closeHandler: `closeIncidentPopup('${tooltipId}')`});
  popupEl.classList.add('open');
}
function closeIncidentPopup(tooltipId){ const el = $('popup-'+tooltipId); if (el) el.classList.remove('open'); }

function renderIncidentScatter(containerId, rows){
  const points = (rows||[]).filter(o=>o.lokasi_kejadian_lat!=null && o.lokasi_kejadian_lon!=null).map(o=>{
    const g = geoToPct(o.lokasi_kejadian_lat, o.lokasi_kejadian_lon);
    return {...o, x:g.x, y:g.y};
  });
  const dots = points.map((p)=>{
    const [px,py] = pt(p.x,p.y);
    const col = CATMAP[p.nama_kategori] ? CATMAP[p.nama_kategori].color : '#FF7A1A';
    return `<circle cx="${px}" cy="${py}" r="4.2" fill="${col}" fill-opacity=".92" stroke="#0A0605" stroke-width=".8"/>`;
  }).join('');
  const hotspots = points.map((p,i)=>
    `<div class="hotspot" style="left:${p.x}%; top:${p.y}%;" onmouseenter="showIncidentTip('${containerId}', ${i})" onmouseleave="hideMapTip('tip-${containerId}')" onclick="event.stopPropagation(); openIncidentPopup('tip-${containerId}', window.__pts_${containerId.replace(/-/g,'_')}[${i}])"></div>`
  ).join('');
  window['__pts_'+containerId.replace(/-/g,'_')] = points;
  const posMarkers = WILAYAH_LIST.filter(w=>state.activeWilayah.includes(w.id)).map(w=>{
    const ref = WILAYAH_REAL_COORDS[w.label]; if (!ref) return '';
    const g = geoToPct(ref[0], ref[1]);
    const [px,py] = pt(g.x, g.y);
    return `<g>${posMarkerSVG(px,py,15)}</g>`;
  }).join('');
  $(containerId).innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
      ${mapBaseSVG()}
      <g clip-path="url(#javaClip)">${dots}</g>
      ${posMarkers}
    </svg>
    ${hotspots}
    <div class="map-tip" id="tip-${containerId}"></div>
    <div class="map-popup" id="popup-tip-${containerId}"></div>
    <div class="map-legend">${CATS.map(c=>`<div class="row"><span class="sw" style="background:${c.color}"></span>${c.label}</div>`).join('')}</div>
    <div class="map-note">${points.length} TITIK &middot; WILAYAH SKEMATIK</div>`;
}
function showIncidentTip(containerId, i){
  const p = window['__pts_'+containerId.replace(/-/g,'_')][i];
  const el = $('tip-'+containerId); if (!el) return;
  el.style.left = p.x+'%'; el.style.top = Math.max(6,p.y)+'%';
  const cat = CATMAP[p.nama_kategori] || {label:'-'};
  const tgl = p.waktu_kejadian ? new Date(p.waktu_kejadian).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-';
  el.innerHTML = `<div class="mt-lbl">${cat.label}</div><div class="mt-name">${p.lokasi_kejadian_deskripsi || p.wilayah_mapped || '-'}</div><div class="mt-row"><span>Tanggal</span><b>${tgl}</b></div>`;
  el.style.display = 'block';
}

/* Koordinat referensi visual per WILAYAH (pengganti POS_REAL_COORDS lama yang berbasis
   pos/unit siaga). Dipakai untuk menggambar marker representatif di peta -- bukan
   koordinat presisi kantor, cukup titik acuan tengah wilayah untuk tampilan skematik. */
const WILAYAH_REAL_COORDS = {
  "Surabaya": [-7.25, 112.75],
  "Trenggalek": [-8.05, 111.71],
  "Banyuwangi": [-8.22, 114.37],
  "Jember": [-8.17, 113.70],
  "Sumenep": [-7.02, 113.85],
  "Malang": [-7.98, 112.63],
  "Bojonegoro": [-7.15, 111.88],
  "Lamongan": [-7.12, 112.42],
};
function nearestWilayahForPoint(lat, lon){
  let best = null, bestD = Infinity;
  Object.entries(WILAYAH_REAL_COORDS).forEach(([label, ref])=>{
    const d = (ref[0]-lat)**2 + (ref[1]-lon)**2;
    if (d < bestD){ bestD = d; best = label; }
  });
  return best;
}
/* ================= PETA ASLI (Leaflet + basemap ganda + overlay KML + layer toggle) =================
   Tahap 1: dipakai untuk peta Beranda ('map-beranda') & mode fullscreen-nya ('mf-map-wrap').
   Peta lain (Peta Sebaran, Zona Prioritas, Prediksi, Mini Map Picker admin) MASIH pakai
   peta SVG skematik lama (mapBaseSVG dkk di bawah) sampai tahap berikutnya dikonfirmasi. */
const BASEMAPS = {
  dark: {
    label: 'Gelap',
    layers: [
      { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_2a59_1_c973b62e3735c7452aa7b930',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19 },
    ],
  },
  light: {
    label: 'Terang',
    layers: [
      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        subdomains: 'abc', maxZoom: 19 },
    ],
  },
  terrain: {
    label: 'Satelit',
    layers: [
      { url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Maps',
        subdomains: 'abc',
        maxZoom: 19,
        maxNativeZoom: 19 },
    ],
  },
};
const DEFAULT_BASEMAP = 'dark';
const LAYER_TOGGLE_DEFS = [
  { key:'incident', label:'Operasi SAR' },
  { key:'pos', label:'Unit/Pos SAR' },
  { key:'boundary', label:'Wilayah Operasi' },
];
const DEFAULT_LAYER_VISIBLE = { incident:true, pos:true, boundary:false };
const MAP_LAYER_VISIBLE_OVERRIDES = {};
function getDefaultLayerVisible(containerId){
  return { ...DEFAULT_LAYER_VISIBLE, ...(MAP_LAYER_VISIBLE_OVERRIDES[containerId] || {}) };
}
const LAYER_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
const KML_BOUNDARY_URL = '/data/wilayah-kerja-sar-surabaya-boundary.kml';
const JATIM_CENTER = [-7.5, 112.5];
const JATIM_ZOOM = 8;
const _leafletMaps = {};
let _kmlTextPromise = null;

function getOrCreateLeafletMap(containerId){
  let entry = _leafletMaps[containerId];
  if (entry) return entry;
  const map = L.map(containerId, {
    center: JATIM_CENTER, zoom: JATIM_ZOOM, minZoom: 6, maxZoom: 19,
    attributionControl: true, zoomControl: true,
  });
  const incidentLayer = L.layerGroup();
  const posLayer = L.layerGroup();
  const boundaryLayer = L.layerGroup();
  const layerVisible = getDefaultLayerVisible(containerId);
  if (layerVisible.incident) incidentLayer.addTo(map);
  if (layerVisible.pos) posLayer.addTo(map);
  if (layerVisible.boundary) boundaryLayer.addTo(map);
  entry = {
    map, markersLayer: incidentLayer, // alias lama, tetap dipertahankan untuk kompatibilitas kode lain
    incidentLayer, posLayer, boundaryLayer,
    basemap: DEFAULT_BASEMAP, tileLayers: [],
    layerVisible,
  };
  _leafletMaps[containerId] = entry;
  setBasemap(containerId, DEFAULT_BASEMAP, {initial:true});
  addLayerControl(containerId, { basemapOnly: containerId === 'admin-map-picker' });
  loadKmlBoundaryLayer(containerId);
  return entry;
}

function setBasemap(containerId, key, opts){
  opts = opts || {};
  const entry = _leafletMaps[containerId]; if (!entry) return;
  const conf = BASEMAPS[key]; if (!conf) return;
  (entry.tileLayers || []).forEach(l => entry.map.removeLayer(l));
  entry.tileLayers = conf.layers.map(lc=>{
    const layer = L.tileLayer(lc.url, {
      attribution: lc.attribution, subdomains: lc.subdomains,
      maxZoom: lc.maxZoom, maxNativeZoom: lc.maxNativeZoom,
    }).addTo(entry.map);
    layer.setZIndex(0);
    return layer;
  });
  entry.basemap = key;
  if (!opts.initial){
    const panel = document.getElementById('layerpanel-'+containerId);
    if (panel) panel.querySelectorAll('.lp-bm-opt').forEach(b=> b.classList.toggle('active', b.dataset.bm===key));
  }
}

function addLayerControl(containerId, opts){
  opts = opts || {};
  const wrap = document.getElementById(containerId); if (!wrap) return;
  if (wrap.querySelector('.map-layer-btn')) return;
  const shiftClass = wrap.querySelector('.map-maximize-btn') ? ' shift-down' : '';
  const layerVisible = getDefaultLayerVisible(containerId);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'map-layer-btn' + shiftClass;
  btn.title = opts.basemapOnly ? 'Tema peta' : 'Layer & tema peta';
  btn.innerHTML = LAYER_ICON_SVG;
  btn.onclick = (e)=>{ e.stopPropagation(); toggleLayerPanel(containerId); };
  wrap.appendChild(btn);

  const layerSection = opts.basemapOnly ? '' : `
      <div class="lp-divider"></div>
      <div class="lp-section-title">Layer</div>
      ${LAYER_TOGGLE_DEFS.map(d=>`
        <label class="lp-layer-opt"><input type="checkbox" ${layerVisible[d.key] ? 'checked' : ''} data-layer="${d.key}" onchange="onLayerPanelToggle('${containerId}', this)">${d.label}</label>
      `).join('')}`;

  const panel = document.createElement('div');
  panel.className = 'map-layer-panel';
  panel.id = 'layerpanel-' + containerId;
  panel.innerHTML = `
    <div class="map-layer-panel-inner">
      <div class="lp-section-title">Tampilan Dasar</div>
      <div class="lp-basemap-row">
        ${Object.entries(BASEMAPS).map(([key,conf])=>`
          <div class="lp-bm-opt bm-${key} ${key===DEFAULT_BASEMAP?'active':''}" data-bm="${key}" onclick="onLayerPanelBasemap('${containerId}','${key}')">
            <div class="sw"></div><div class="lbl">${conf.label}</div>
          </div>`).join('')}
      </div>
      ${layerSection}
    </div>
  `;
  document.body.appendChild(panel);
}

function toggleLayerPanel(containerId){
  document.querySelectorAll('.map-layer-panel.open').forEach(p=>{ if (p.id !== 'layerpanel-'+containerId) p.classList.remove('open'); });
  const panel = document.getElementById('layerpanel-'+containerId);
  const wrap = document.getElementById(containerId);
  const btn = wrap ? wrap.querySelector('.map-layer-btn') : null;
  if (!panel) return;

  const willOpen = !panel.classList.contains('open');
  if (!willOpen){ panel.classList.remove('open'); return; }
  if (!btn || !wrap) return;

  // Batas panel = kotak peta itu sendiri (bukan seluruh card, apalagi seluruh layar),
  // supaya panel tidak pernah nembus keluar dari area peta yang membulat.
  const mapRect = wrap.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const panelWidth = 190;

  let left = btnRect.right - panelWidth;
  left = Math.max(mapRect.left + 6, Math.min(left, mapRect.right - panelWidth - 6));
  const top = btnRect.bottom + 6;

  panel.style.left = left + 'px';
  panel.style.top = top + 'px';
  panel.style.maxHeight = '';
  panel.classList.add('open');

  // Kalau ruang sampai batas bawah peta tidak cukup untuk tinggi panel penuh --
  // baru dibatasi & isinya bisa discroll. Kalau cukup (kondisi normal), dibiarkan apa adanya.
  const availableHeight = mapRect.bottom - top - 6;
  if (panel.offsetHeight > availableHeight){
    panel.style.maxHeight = Math.max(80, availableHeight) + 'px';
  }
}

document.addEventListener('click', (e)=>{
  if (!e.target.closest('.map-layer-panel') && !e.target.closest('.map-layer-btn')){
    document.querySelectorAll('.map-layer-panel.open').forEach(p=>p.classList.remove('open'));
  }
});// Tutup panel layer otomatis saat halaman di-scroll -- karena panel pakai
// position:fixed (dihitung relatif viewport), posisinya jadi basi begitu
// konten di baliknya bergerak. Auto-close lebih aman daripada reposisi
// live tiap event scroll (yang mahal secara performa).
window.addEventListener('scroll', ()=>{
  document.querySelectorAll('.map-layer-panel.open').forEach(p=>p.classList.remove('open'));
}, { capture: true, passive: true });

function onLayerPanelBasemap(containerId, key){ setBasemap(containerId, key); }
function onLayerPanelToggle(containerId, checkbox){
  const entry = _leafletMaps[containerId]; if (!entry) return;
  const key = checkbox.dataset.layer;
  const layerMap = { incident: entry.incidentLayer, pos: entry.posLayer, boundary: entry.boundaryLayer };
  const layer = layerMap[key]; if (!layer) return;
  entry.layerVisible[key] = checkbox.checked;
  if (checkbox.checked) entry.map.addLayer(layer); else entry.map.removeLayer(layer);
}

function loadKmlBoundaryLayer(containerId){
  const entry = _leafletMaps[containerId]; if (!entry) return;
  if (!_kmlTextPromise) _kmlTextPromise = fetch(KML_BOUNDARY_URL).then(r=>r.text());
  _kmlTextPromise.then(kmlText=>{
    omnivore.kml.parse(kmlText)
      .setStyle({ color: '#FF6A0F', weight: 2, dashArray: '6,6', fill: false, opacity: .85 })
      .addTo(entry.boundaryLayer);
  }).catch(e=> console.error('Gagal memuat overlay batas wilayah KML:', e));
}

function renderIncidentMapLeaflet(containerId, rows, opts){
  opts = opts || {};
  const entry = getOrCreateLeafletMap(containerId);
  entry.map.invalidateSize();
  entry.incidentLayer.clearLayers();
  entry.posLayer.clearLayers();
  const points = (rows||[]).filter(o=>o.lokasi_kejadian_lat!=null && o.lokasi_kejadian_lon!=null);
  points.forEach(o=>{
    const col = CATMAP[o.nama_kategori] ? CATMAP[o.nama_kategori].color : '#FF7A1A';
    L.circleMarker([o.lokasi_kejadian_lat, o.lokasi_kejadian_lon], {
      radius: 6, color: '#0A0605', weight: 1, fillColor: col, fillOpacity: .92,
    }).bindPopup(buildIncidentPopupHTML(o), { className: 'sar-leaflet-popup', maxWidth: 230, minWidth: 230 })
      .addTo(entry.incidentLayer);
  });
  WILAYAH_LIST.filter(w=>state.activeWilayah.includes(w.id)).forEach(w=>{
    const ref = WILAYAH_REAL_COORDS[w.label]; if (!ref) return;
    const icon = L.divIcon({ className: 'leaflet-pos-marker', html: '<div class="lp-dot"></div>', iconSize:[16,16], iconAnchor:[8,8] });
    L.marker(ref, {icon, zIndexOffset: 500}).bindTooltip(w.label, {direction:'top', className:'sar-pos-tooltip', offset:[0,-6]})
      .addTo(entry.posLayer);
  });
  // Legend/note overlay -- dilewati kalau container sudah punya panel setara sendiri (mis. mode fullscreen punya #mf-legend).
  if (opts.legend !== false){
    const wrap = document.getElementById(containerId);
    if (wrap){
      let legend = wrap.querySelector('.map-legend');
      if (!legend){ legend = document.createElement('div'); legend.className = 'map-legend'; wrap.appendChild(legend); }
      legend.innerHTML = CATS.map(c=>`<div class="row"><span class="sw" style="background:${c.color}"></span>${c.label}</div>`).join('');
      let note = wrap.querySelector('.map-note');
      if (!note){
        note = document.createElement('div'); note.className = 'map-note';
        // geser ke kiri kalau ada tombol maximize (top-right) supaya tidak saling menutupi/blokir klik
        if (wrap.querySelector('.map-maximize-btn')) note.style.right = '44px';
        wrap.appendChild(note);
      }
      note.textContent = `${points.length} TITIK`;
    }
  }
}

function renderMapBufferLeaflet(containerId, operasiRows){
  const entry = getOrCreateLeafletMap(containerId);
  entry.map.invalidateSize();
  entry.incidentLayer.clearLayers();
  entry.posLayer.clearLayers();
  if (entry.bufferLinesLayer){ entry.incidentLayer.removeLayer(entry.bufferLinesLayer); entry.bufferLinesLayer = null; }
  const linesLayer = L.layerGroup().addTo(entry.incidentLayer);
  entry.bufferLinesLayer = linesLayer;

  const points = (operasiRows||[]).filter(o=>o.lokasi_kejadian_lat!=null && o.lokasi_kejadian_lon!=null);
  const countPerWilayah = {};

  points.forEach(o=>{
    // Pakai wilayah_mapped ASLI dari data (bukan tebak-tebak jarak geografis) --
    // supaya kejadian selalu ditautkan ke Pos sesuai catatan resmi di database,
    // bukan ke pos yang cuma kebetulan paling dekat koordinatnya.
    const wilayahLabel = o.wilayah_mapped ? o.wilayah_mapped.split(',')[0].trim() : null;
    const ref = wilayahLabel ? WILAYAH_REAL_COORDS[wilayahLabel] : null;
    if (!ref) return; // skip kalau wilayah_mapped kosong / bukan salah satu dari Pos yang punya koordinat referensi
    countPerWilayah[wilayahLabel] = (countPerWilayah[wilayahLabel]||0) + 1;
    const col = CATMAP[o.nama_kategori] ? CATMAP[o.nama_kategori].color : '#FF7A1A';
    L.polyline([ref, [o.lokasi_kejadian_lat, o.lokasi_kejadian_lon]], { color: col, weight:1.2, opacity:.55 })
      .addTo(linesLayer);
    L.circleMarker([o.lokasi_kejadian_lat, o.lokasi_kejadian_lon], { radius:3.5, color:'#0A0605', weight:.8, fillColor:col, fillOpacity:.9 })
      .bindTooltip(o.lokasi_kejadian_deskripsi || o.wilayah_mapped || '-', { direction:'top', className:'sar-pos-tooltip' })
      .addTo(linesLayer);
  });

  WILAYAH_LIST.filter(w=>state.activeWilayah.includes(w.id)).forEach(w=>{
    const ref = WILAYAH_REAL_COORDS[w.label]; if (!ref) return;
    const icon = L.divIcon({ className:'leaflet-pos-marker', html:'<div class="lp-dot"></div>', iconSize:[16,16], iconAnchor:[8,8] });
    L.marker(ref, {icon, zIndexOffset:500}).bindTooltip(`${w.label}: ${countPerWilayah[w.label]||0} kejadian`, {direction:'top', className:'sar-pos-tooltip', offset:[0,-6]}).addTo(entry.posLayer);
  });

  const wrap = document.getElementById(containerId);
  let legend = wrap.querySelector('.map-legend');
  if (!legend){ legend = document.createElement('div'); legend.className='map-legend'; wrap.appendChild(legend); }
  legend.innerHTML = `<div class="row"><span class="sw" style="background:var(--o-90)"></span>Unit/Pos SAR</div><div class="row" style="color:var(--text-faint);">Garis = kejadian ditautkan ke pos sesuai data wilayah, warna = kategori kejadian</div>`;
}

/* Jarak great-circle sederhana (km) antara 2 koordinat -- dipakai buat label jarak di
   Peta Jarak Temu. Kolom jarak_dari_lkk_km TIDAK ADA di kejadian_sar (kolom 'jarak'
   sengaja diabaikan sesuai keputusan sebelumnya), tapi dihitung langsung dari
   latitude/longitude yang memang tersimpan -- tidak butuh kolom tambahan. */
function haversineKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* Peta Jarak Temu: LKK -> lokasi ditemukan, dengan jarak dihitung langsung dari
   koordinat (lihat haversineKm di atas). */
function renderMapJarakTemuLeaflet(containerId, operasiRows){
  const entry = getOrCreateLeafletMap(containerId);
  entry.map.invalidateSize();
  entry.incidentLayer.clearLayers();
  if (entry.jtLinesLayer){ entry.incidentLayer.removeLayer(entry.jtLinesLayer); entry.jtLinesLayer = null; }
  const wrap = document.getElementById(containerId);
  const oldEmpty = wrap.querySelector('.jt-empty-overlay');
  if (oldEmpty) oldEmpty.remove();

  const rows = (operasiRows||[]).filter(o=> o.lokasi_kejadian_lat!=null && o.lokasi_ditemukan_lat!=null);
  if (!rows.length){
    const overlay = document.createElement('div');
    overlay.className = 'jt-empty-overlay empty-state';
    overlay.style.cssText = 'position:absolute; inset:0; z-index:50; justify-content:center; background:rgba(5,3,2,.7); backdrop-filter:blur(2px);';
    overlay.innerHTML = `
      <div class="ic-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
      <div class="es-title">Belum ada titik "Ditemukan" untuk filter ini</div>
      <div class="es-sub">Koordinat lokasi ditemukan akan tampil di sini setelah operasi ditutup dan data dientri. Coba ubah filter tahun/bulan/wilayah.</div>`;
    wrap.appendChild(overlay);
    return;
  }

  // Banyak pasangan LKK <-> Lokasi Ditemukan jaraknya cuma puluhan/ratusan meter
  // (korban ditemukan persis di sekitar lokasi kejadian) -- di skala peta seluruh
  // Jatim, garis sependek itu nyaris tak kelihatan dan titik hijau (digambar
  // belakangan) menutupi total titik merah di bawahnya, jadi kelihatan cuma satu
  // titik tanpa garis. LKK digambar lebih besar sebagai "cincin" di bawah supaya
  // pasangan yang berdekatan tetap kelihatan dua titik (bukan cuma satu warna).
  const linesLayer = L.layerGroup().addTo(entry.incidentLayer);
  entry.jtLinesLayer = linesLayer;
  rows.forEach(o=>{
    const from = [o.lokasi_kejadian_lat, o.lokasi_kejadian_lon];
    const to = [o.lokasi_ditemukan_lat, o.lokasi_ditemukan_lon];
    const label = o.lokasi_kejadian_deskripsi || o.wilayah_mapped || 'Operasi #'+o.id_operasi;
    const jarakKm = haversineKm(o.lokasi_kejadian_lat, o.lokasi_kejadian_lon, o.lokasi_ditemukan_lat, o.lokasi_ditemukan_lon);
    const jarakTxt = jarakKm < 1 ? Math.round(jarakKm*1000)+' m' : jarakKm.toFixed(1)+' km';
    const tooltipHtml = `${label}<br><span style="color:#C9B8A8;">Jarak LKK &rarr; ditemukan: ${jarakTxt}</span>`;
    L.polyline([from, to], { color:'#FFC98A', weight:1.4, opacity:.55, dashArray:'5,4' })
      .bindTooltip(tooltipHtml, { direction:'top', sticky:false, className:'sar-pos-tooltip' })
      .addTo(linesLayer);
    // Tooltip DIPASANG LANGSUNG DI TITIKNYA (bukan cuma di garis) -- garis
    // dashed setebal ~1.4px susah banget di-hover persis, sementara titik
    // (radius 7 & 3.5) jauh lebih besar & jadi target hover yang wajar.
    // Sebelumnya tooltip cuma ada di garis, makanya kerasa "susah" dipencet.
    L.circleMarker(from, { radius:7, color:'#0A0605', weight:1, fillColor:'#FF5A4A', fillOpacity:.85 })
      .bindTooltip(tooltipHtml, { direction:'top', className:'sar-pos-tooltip' })
      .addTo(linesLayer);
    L.circleMarker(to, { radius:3.5, color:'#0A0605', weight:1, fillColor:'#5FBE7A', fillOpacity:1 })
      .bindTooltip(tooltipHtml, { direction:'top', className:'sar-pos-tooltip' })
      .addTo(linesLayer);
  });

  let legend = wrap.querySelector('.map-legend');
  if (!legend){ legend = document.createElement('div'); legend.className='map-legend'; wrap.appendChild(legend); }
  legend.innerHTML = `
    <div class="row"><span class="sw" style="background:#FF5A4A"></span>LKK / Lokasi Kejadian</div>
    <div class="row"><span class="sw" style="background:#5FBE7A"></span>Lokasi Ditemukan</div>`;
  let note = wrap.querySelector('.map-note');
  if (!note){ note = document.createElement('div'); note.className='map-note'; wrap.appendChild(note); }
  note.textContent = `${rows.length} pasangan titik`;
}


function heatColorGreen(t){
  const stops = [[228,245,214],[168,222,156],[95,190,122],[76,147,176],[53,114,184],[39,78,158]];
  const n = stops.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(scaled));
  const f = scaled - i;
  const a = stops[i], b = stops[i+1];
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`;
}
function predictionColor(t){
  const stops = [[76,175,80],[181,211,59],[255,235,59],[255,152,0],[229,57,53]];
  const n = stops.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * n;
  const i = Math.min(n - 1, Math.floor(scaled));
  const f = scaled - i;
  const a = stops[i], b = stops[i+1];
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`;
}
function predictionLevelLabel(t){ if (t>=0.72) return 'Sangat Tinggi'; if (t>=0.48) return 'Tinggi'; if (t>=0.28) return 'Sedang'; return 'Rendah'; }

function renderMapDensityLeaflet(containerId, operasiRows, zonaStats){
  const entry = getOrCreateLeafletMap(containerId);
  entry.map.invalidateSize();
  entry.incidentLayer.clearLayers();
  entry.posLayer.clearLayers();
  if (entry.heatLayer){ entry.incidentLayer.removeLayer(entry.heatLayer); entry.heatLayer = null; }

  const points = (operasiRows||[])
    .filter(o=>o.lokasi_kejadian_lat!=null && o.lokasi_kejadian_lon!=null)
    .map(o=>[o.lokasi_kejadian_lat, o.lokasi_kejadian_lon, 1]);

  entry.heatLayer = L.heatLayer(points, {
    radius: 32, blur: 28, maxZoom: 12, minOpacity: .25,
    gradient: { 0.2:'#4CAF50', 0.4:'#B5D33B', 0.6:'#FFEB3B', 0.8:'#FF9800', 1:'#E53935' },
  }).addTo(entry.incidentLayer);

  const maxK = Math.max(1, ...zonaStats.map(z=>z.kejadian));
  zonaStats.forEach(z=>{
    if (!z.ref) return;
    const icon = L.divIcon({ className:'zona-density-label', html:`<div class="zdl-badge">${z.kejadian}</div>`, iconSize:[19,19], iconAnchor:[9,9] });
    L.marker(z.ref, {icon, zIndexOffset:600})
      .bindTooltip(`${z.kab}: ${z.kejadian} kejadian`, {direction:'top', className:'sar-pos-tooltip', offset:[0,-10]})
      .addTo(entry.incidentLayer);
  });

  WILAYAH_LIST.filter(w=>state.activeWilayah.includes(w.id)).forEach(w=>{
    const ref = WILAYAH_REAL_COORDS[w.label]; if (!ref) return;
    const icon = L.divIcon({ className:'leaflet-pos-marker', html:'<div class="lp-dot"></div>', iconSize:[16,16], iconAnchor:[8,8] });
    L.marker(ref, {icon, zIndexOffset:500}).bindTooltip(w.label, {direction:'top', className:'sar-pos-tooltip', offset:[0,-6]})
      .addTo(entry.posLayer);
  });

  const wrap = document.getElementById(containerId);
  if (wrap){
    let legend = wrap.querySelector('.map-legend');
    if (!legend){ legend = document.createElement('div'); legend.className='map-legend zone-priority-density-legend'; wrap.appendChild(legend); }
    const scaleSteps = [0,0.25,0.5,0.75,1].map(f=>Math.round(maxK*f));
    legend.innerHTML = `
      <div class="row" style="color:var(--text-mid); margin-bottom:0;">Intensitas kejadian per wilayah</div>
      <div class="grad-scale">Rendah <div class="zone-priority-gb-bar"></div> Tinggi</div>
      <div class="zone-priority-scale-numbers">${scaleSteps.map(v=>`<span>${v.toLocaleString('id-ID')}</span>`).join('')}</div>`;
  }
  const subEl = $('zona-density-sub');
  if (subEl) subEl.innerHTML = `intensitas dihitung dari kepadatan titik kejadian riil (heatmap) &middot; angka pada label = jumlah kejadian per kelompok wilayah, mengikuti filter aktif`;
}

function renderMapBuffer(containerId, zonaStats){
  const links = zonaStats.filter(z=>z.kejadian>0).map(z=>{
    const ref = WILAYAH_REAL_COORDS[z.wilayah]; if (!ref) return '';
    const g1 = geoToPct(ref[0], ref[1]); const [sx,sy] = pt(g1.x, g1.y);
    const [ex,ey] = pt(z.x, z.y);
    const col = CATMAP[z.dominanCatId] ? CATMAP[z.dominanCatId].color : '#FF7A1A';
    const mx = (sx+ex)/2 + (sy-ey)*0.06, my = (sy+ey)/2 + (ex-sx)*0.06;
    return `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width="1.4"/>`;
  }).join('');
  const dots = zonaStats.filter(z=>z.kejadian>0).map(z=>{
    const [px,py] = pt(z.x,z.y);
    const col = CATMAP[z.dominanCatId] ? CATMAP[z.dominanCatId].color : '#FF7A1A';
    return `<circle cx="${px}" cy="${py}" r="${4+Math.min(8,z.kejadian)}" fill="${col}" fill-opacity=".85"/>`;
  }).join('');
  const posMarkers = WILAYAH_LIST.filter(w=>state.activeWilayah.includes(w.id)).map(w=>{
    const ref = WILAYAH_REAL_COORDS[w.label]; if (!ref) return '';
    const g = geoToPct(ref[0], ref[1]); const [px,py] = pt(g.x, g.y);
    return `<g>${posMarkerSVG(px,py,14)}</g>`;
  }).join('');
  $(containerId).innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
      ${mapBaseSVG()}
      <g clip-path="url(#javaClip)">${links}${dots}</g>
      ${posMarkers}
    </svg>
    ${hotspotLayerZona(zonaStats.map(z=>({x:z.x,y:z.y,label:z.kab,value:z.kejadian})), 'tip-'+containerId)}
    <div class="map-legend"><div class="row"><span class="sw" style="background:var(--o-90)"></span>Wilayah</div><div class="row" style="color:var(--text-faint);">Garis = wilayah terkait, warna = kategori dominan</div></div>`;
}

/* ================= BOOTSTRAP: load reference data ================= */
async function loadRefData(){
  const [kat, kl, sb, wil] = await Promise.all([
    Api.refNilai('kategori'), Api.refNilai('klasifikasi'),
    Api.refNilai('sumber_berita'), Api.refNilai('wilayah'),
  ]);
  CATS = kat.data.map((k,i)=>({id:k.nilai, label:toDisplayKategoriLabel(k.nilai), color: CAT_COLORS[i % CAT_COLORS.length]}));
  CATMAP = Object.fromEntries(CATS.map(c=>[c.id, c]));
  REF.klasifikasi = kl.data; REF.sumber = sb.data;
  // wilayah_mapped bisa berisi multi-nilai dipisah koma (mis. "Surabaya, Sumenep") --
  // pecah dan ambil uniknya supaya WILAYAH_LIST berisi nama wilayah tunggal.
  const wilayahSet = new Set();
  wil.data.forEach(row=>{
    (row.nilai || '').split(',').forEach(w=>{ w = w.trim(); if (w) wilayahSet.add(w); });
  });
  WILAYAH_LIST = Array.from(wilayahSet).sort().map(w=>({id:w, label:w}));
  WILAYAH_MAP = Object.fromEntries(WILAYAH_LIST.map(w=>[w.id,w]));
  state.activeCats = CATS.map(c=>c.id);
  state.activeWilayah = WILAYAH_LIST.map(w=>w.id);
}

function toggleSidebar(){
  const aside = document.getElementById('app-sidebar');
  if (!aside) return;
  const collapsed = aside.classList.toggle('collapsed');
  try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); } catch(e){}
}

/* Layar sempit (mis. jendela di-split / dashboard dibuka di setengah layar)
   otomatis membuat sidebar collapse supaya konten tidak terlalu sesak --
   preferensi manual (localStorage) tetap dipakai selama lebar layar masih
   di atas ambang batas ini. */
const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT = 1000; // px

function applySidebarResponsive(){
  const aside = document.getElementById('app-sidebar');
  if (!aside) return;
  if (window.innerWidth <= SIDEBAR_AUTO_COLLAPSE_BREAKPOINT){
    aside.classList.add('collapsed');
  } else {
    let saved = null;
    try { saved = localStorage.getItem('sidebarCollapsed'); } catch(e){}
    aside.classList.toggle('collapsed', saved === '1');
  }
}

function initSidebarToggle(){
  applySidebarResponsive();
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applySidebarResponsive, 150);
  });
}

/* Hitung ulang YEARS_AVAILABLE dari data operasi yang BENAR-BENAR ada di
   database saat ini. Dipakai baik saat load awal (bootstrap) maupun setiap
   kali ada data baru masuk (input manual / bulk import Excel) -- sebelumnya
   input manual cuma refresh daftar tahun kalau tahun FILTER yang lagi aktif
   (state.year) belum ada di YEARS_AVAILABLE, padahal yang perlu dicek adalah
   tahun dari DATA BARU yang baru disimpan, bukan tahun filter yang sedang
   dipilih -- itu sebabnya nambah data tahun baru (mis. 2027) sebelumnya tidak
   langsung muncul di filter Tahun sampai halaman di-refresh manual. Bulk
   import Excel malah sama sekali tidak refresh daftar tahun. Sekarang
   dipanggil tanpa syarat setiap selesai simpan data, jadi tahun baru apapun
   langsung muncul di filter tanpa perlu reload halaman. */
async function refreshYearsAvailable(){
  const allOps = await Api.operasi({});
  const yearsWithData = Array.from(new Set((allOps.data||[]).map(o=>o.tahun))).sort((a,b)=>a-b);

  // Tahun berjalan tetap dimunculkan di filter Tahun walau belum ada satupun
  // baris data tercatat -- supaya dashboard bisa dibuka dalam kondisi
  // "kosong" utk tahun berjalan, bukan cuma bisa lihat tahun2 lama yang sudah ada datanya.
  const currentYear = new Date().getFullYear();
  YEARS_AVAILABLE = yearsWithData.includes(currentYear)
    ? [...yearsWithData]
    : [...yearsWithData, currentYear].sort((a,b)=>a-b);

  buildTahunPanel();
  return yearsWithData;
}

async function bootstrap(){
  try {
    const [, yearsWithData] = await Promise.all([ loadRefData(), refreshYearsAvailable() ]);

    // Default tahun yang ditampilkan saat pertama buka dashboard tetap tahun
    // terakhir yang ADA datanya (bukan otomatis lompat ke tahun berjalan yang
    // masih kosong) -- supaya user tidak disambut dashboard kosong pas pertama buka.
    const latestYearWithData = yearsWithData.length ? yearsWithData[yearsWithData.length - 1] : YEARS_AVAILABLE[YEARS_AVAILABLE.length - 1];
    state.year = latestYearWithData;
    state.activeWilayah = computeDefaultActiveWilayah(state.year);
  } catch (err) {
    document.querySelector('main.content').innerHTML = `<div class="card"><div class="card-body admin-loading" style="color:#FF9086;">
      Gagal memuat data dari server API (${err.message}).<br>Pastikan Flask (python app.py) berjalan dan database sudah terisi.
    </div></div>`;
    throw err;
  }
  buildTahunPanel();
  buildBulanPanel();
  buildKategoriPanel();
  buildWilayahPanel();
  buildPeriodePrediksiPanel();
  buildAdminSelectOptions();
  await checkAuthOnLoad();
  await Promise.all([ render(), renderAdminOpsTable() ]);
}

/* ================= RENDER DISPATCH ================= */
async function render(){
  const page = state.page;
  try {
    if (page === 'beranda') await renderBeranda();
    else if (page === 'peta') await renderPeta();
    else if (page === 'tren') await renderTren();
    else if (page === 'zona') await renderZona();
    else if (page === 'prediksi') await renderPrediksi();
    else if (page === 'admin-input') await renderAdminInputPage();
  } catch (err) {
    console.error(err);
  }
}

/* ================= BERANDA ================= */
const KPI_ICONS = {
  total:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>',
  ditangani:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>',
  ok:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  meninggal:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  hilang:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
};
function renderKPI(kpi){
  const allBulan = state.activeMonths.length === 12;
  const yearLbl = formatTahunLabel(state.year);
  const sub = allBulan ? `sepanjang tahun ${yearLbl}` : `${state.activeMonths.length} bulan terpilih, tahun ${yearLbl}`;
  const items = [
  {lbl:'Total Kejadian', val:kpi.total_kejadian, sub, icon:KPI_ICONS.total},
  {lbl:'Korban Ditangani', val:kpi.korban_ditangani, sub:'seluruh kategori terpilih', icon:KPI_ICONS.ditangani},
  {lbl:'Selamat', val:kpi.selamat, sub:'berhasil diselamatkan', icon:KPI_ICONS.ok},
  {lbl:'Meninggal Dunia', val:kpi.meninggal, sub:'ditemukan tidak selamat', icon:KPI_ICONS.meninggal},
  {lbl:'Hilang', val:kpi.hilang, sub:'Hilang/Tidak Ditemukan', icon:KPI_ICONS.hilang},
  ];
  $('kpi-row').innerHTML = items.map(it=>`
    <div class="kpi">
      <div class="top"><span class="lbl">${it.icon}${it.lbl}</span></div>
      <div class="val">${(it.val||0).toLocaleString('id-ID')}</div>
      <div class="sub">${it.sub}</div>
    </div>`).join('');
}

async function renderBeranda(){
  baseOpt();
  const f = getActiveFilters();
  const [kpiRes, operasiRes, komposisiRes, bebanWilayahRes, trenRes] = await Promise.all([
    Api.kpi(f), Api.operasi(f), Api.komposisiKejadian(f), Api.bebanWilayah(f), Api.trenBulanan({tahun:f.tahun, kategori:f.kategori}),
  ]);
  const kpi = kpiRes.data;
  renderKPI(kpi);
  const zonaStats = computeZonaStats(operasiRes.data);
  renderMapDensityLeaflet('map-beranda', operasiRes.data, zonaStats);

  const komposisi = komposisiRes.data;
  destroy('donutBeranda');
  const dEl = $('chartDonutBeranda');
  if (dEl){
    charts.donutBeranda = new Chart(dEl, { type:'doughnut',
      data:{ labels:komposisi.map(k=>toDisplayKategoriLabel(k.nama_kategori)), datasets:[{ data:komposisi.map(k=>k.jumlah), backgroundColor:komposisi.map(k=>CATMAP[k.nama_kategori]?CATMAP[k.nama_kategori].color:'#FF7A1A'), borderColor:'#0A0808', borderWidth:3 }] },
      options:{ cutout:'66%', plugins:{ legend:{display:false} } } });
    renderLegendList('legend-beranda', komposisi.map(k=>({label:toDisplayKategoriLabel(k.nama_kategori), color:CATMAP[k.nama_kategori]?CATMAP[k.nama_kategori].color:'#FF7A1A', value:k.jumlah})));
  }

  destroy('bebanPos');
  const bpEl = $('chartBebanPos');
  if (bpEl){
    const ps = bebanWilayahRes.data;
    charts.bebanPos = new Chart(bpEl, { type:'bar',
      data:{ labels:ps.map(p=>p.nama_wilayah), datasets:[{ data:ps.map(p=>p.jumlah), backgroundColor:'#FF7A1A', borderRadius:3 }] },
      options:{ indexAxis:'y', scales:{ x:{grid:{color:'rgba(255,138,54,.12)'}, beginAtZero:true, title:{display:true,text:'Jumlah Operasi', color:'#C9B8A8', font:{size:11}}}, y:{grid:{display:false}, ticks:{font:{size:10}}} }, plugins:{legend:{display:false}} } });
  }

  destroy('trenBeranda');
  const tEl = $('chartTrenBeranda');
  if (tEl){
    const monthlyTotal = Array(12).fill(0);
    trenRes.data.forEach(row=>{ monthlyTotal[row.bulan-1] += row.jumlah; });
    charts.trenBeranda = new Chart(tEl, { type:'line',
      data:{ labels:MONTHS_SHORT, datasets:[{ label:'Total Kejadian', data:monthlyTotal, borderColor:'#FF7A1A', backgroundColor:(c)=>orangeGlow(c,'rgba(255,122,26,.5)'), fill:true, tension:.35, pointRadius:2, pointBackgroundColor:'#FFAB5C' }] },
      options:{ scales:{ x:{grid:{color:'rgba(255,138,54,.12)'}, offset:true}, y:{grid:{color:'rgba(255,138,54,.12)'}, beginAtZero:true} }, plugins:{legend:{display:false}} } });
  }


  const top = zonaStats[0] || {kab:'-', kejadian:0, wilayah:'-', dominanCatId:null};
  const kabNameOnly = top.kab.replace(/^Kab\.\s*|^Kota\s*/i, '').trim();
  const showWilayah = top.wilayah && top.wilayah !== kabNameOnly;
  const wilayahAgg = {};
  (operasiRes.data||[]).forEach(o=>{
    const w = o.wilayah_mapped ? o.wilayah_mapped.split(',')[0].trim() : null;
    if (!w) return;
    wilayahAgg[w] ??= {jumlah:0, catCount:{}};
    wilayahAgg[w].jumlah++;
    wilayahAgg[w].catCount[o.nama_kategori] = (wilayahAgg[w].catCount[o.nama_kategori]||0) + 1;
  });
  const topWilayahEntry = Object.entries(wilayahAgg).sort((a,b)=>b[1].jumlah-a[1].jumlah)[0];
  let zonaTxt;
  if (topWilayahEntry){
    const [wName, wData] = topWilayahEntry;
    let domCat = null, domN = -1;
    Object.entries(wData.catCount).forEach(([k,v])=>{ if (v > domN){ domN = v; domCat = k; } });
    const domLabelZona = domCat != null && CATMAP[domCat] ? CATMAP[domCat].label.toLowerCase() : null;
    zonaTxt = `Unit siaga wilayah ${wName} menangani operasi terbanyak pada periode terpilih dengan ${wData.jumlah} operasi${domLabelZona ? ', didominasi ' + domLabelZona : ''}. Prioritaskan penguatan personel dan peralatan di unit ini.`;
  } else {
    zonaTxt = 'Belum ada operasi tercatat pada periode dan filter yang dipilih.';
  }
  const successRate = kpi.korban_ditangani ? Math.round((kpi.selamat/kpi.korban_ditangani)*100) : 0;
  const keberhasilanTxt = kpi.korban_ditangani
    ? `${successRate}% korban berhasil diselamatkan (${kpi.selamat.toLocaleString('id-ID')} dari ${kpi.korban_ditangani.toLocaleString('id-ID')} korban yang ditangani), ${kpi.meninggal.toLocaleString('id-ID')} meninggal dunia, dan ${kpi.hilang.toLocaleString('id-ID')} belum ditemukan.`
    : 'Belum ada korban tercatat pada periode dan filter yang dipilih.';

  const totalKomposisi = komposisi.reduce((a,k)=>a+k.jumlah,0);
  const topKomposisi = totalKomposisi ? [...komposisi].sort((a,b)=>b.jumlah-a.jumlah)[0] : null;
  const kategoriTxt = topKomposisi
    ? `${toDisplayKategoriLabel(topKomposisi.nama_kategori)} adalah jenis kejadian paling sering pada periode ini, mencakup ${Math.round((topKomposisi.jumlah/totalKomposisi)*100)}% dari seluruh operasi SAR sesuai filter aktif.`
    : 'Belum ada data kejadian pada periode dan filter yang dipilih.';

  $('insight-panel').innerHTML = `
    <div class="insight crit"><div class="tag">Zona Kritis</div><div class="txt">${zonaTxt}</div></div>
    <div class="insight pos"><div class="tag">Tingkat Keberhasilan</div><div class="txt">${keberhasilanTxt}</div></div>
    <div class="insight info"><div class="tag">Kategori Dominan</div><div class="txt">${kategoriTxt}</div></div>`;
}

/* ================= PETA ================= */
async function renderPeta(){
  const f = getActiveFilters();
  const [kpiRes, operasiRes] = await Promise.all([Api.kpi(f), Api.operasi(f)]);
  renderIncidentMapLeaflet('map-peta', operasiRes.data);
  const zonaStats = computeZonaStats(operasiRes.data);
  const items = [
    {label:'Total Titik Kejadian', value:kpiRes.data.total_kejadian, unit:'kejadian'},
    {label:'Wilayah Cakupan Aktif', value:state.activeWilayah.length, unit:'wilayah'},
    {label:'Wilayah Terdampak', value:zonaStats.filter(z=>z.kejadian>0).length, unit:'kelompok wilayah'},
  ];
  $('peta-stats').innerHTML = items.map(it=>`
    <div class="stat-card"><div class="n">${it.value.toLocaleString('id-ID')}</div><div class="meta"><div class="l">${it.label}</div><div class="u">${it.unit}</div></div></div>`).join('');
}

/* ================= TREN & STATISTIK ================= */
function bucketRentangLapor(minutes){
  if (minutes < 15) return 0;
  if (minutes < 60) return 1;
  if (minutes < 180) return 2;
  return 3;
}
async function renderTren(){
  baseOpt();
  const f = getActiveFilters();
  const [operasiRes, trenRes, statusHasilRes, waktuKejRes, durasiRes, topKlasRes] = await Promise.all([
    Api.operasi(f),
    Api.trenBulanan({tahun:f.tahun, kategori:f.kategori}),
    Api.statusHasil(f), Api.waktuKejadian(f), Api.durasiOperasi(f),
    Api.topKlasifikasi({tahun:f.tahun, bulan:f.bulan, kategori: f.kategori.length === CATS.length ? [] : f.kategori, limit:5}),
  ]);
  const operasi = operasiRes.data;
  const line = 'rgba(255,138,54,.12)';

  destroy('trenKategori');
  const tkEl = $('chartTrenKategori');
  if (tkEl){
    const byCatMonth = {};
    trenRes.data.forEach(row=>{ (byCatMonth[row.nama_kategori] ??= Array(12).fill(0))[row.bulan-1] = row.jumlah; });
    charts.trenKategori = new Chart(tkEl, { type:'line',
      data:{ labels:MONTHS_SHORT, datasets: state.activeCats.map(cid=>({ label:CATMAP[cid].label, data: byCatMonth[cid] || Array(12).fill(0), borderColor:CATMAP[cid].color, backgroundColor:CATMAP[cid].color, borderWidth:1.6, pointRadius:0, tension:.3 })) },
      options:{ scales:{ x:{grid:{color:line}}, y:{grid:{color:line}, beginAtZero:true} }, plugins:{legend:{position:'bottom', labels:{boxWidth:9,font:{size:10}}}} } });
  }

  destroy('yoy');
  const yoyEl = $('chartYoY');
  if (yoyEl){
    const yoyResults = await Promise.all(YEARS_AVAILABLE.map(y => Api.kpi({tahun:[y], kategori:f.kategori, wilayah:f.wilayah})));
    $('yoy-sub').textContent = `${formatTahunLabel(YEARS_AVAILABLE[0])}–${formatTahunLabel(YEARS_AVAILABLE[YEARS_AVAILABLE.length-1])}`;
    charts.yoy = new Chart(yoyEl, { type:'line',
      data:{ labels:YEARS_AVAILABLE.map(formatTahunLabel), datasets:[{ label:'Total Kejadian/Tahun', data:yoyResults.map(r=>r.data.total_kejadian), borderColor:'#FF7A1A', backgroundColor:(c)=>orangeGlow(c,'rgba(255,122,26,.55)'), fill:true, tension:.3, pointBackgroundColor:'#FFAB5C', pointRadius:5 }] },
      options:{ scales:{ x:{grid:{color:line}}, y:{grid:{color:line}} }, plugins:{legend:{display:false}} } });
  }

  destroy('jam');
  const jEl = $('chartJam');
  if (jEl){
    const tod = waktuKejRes.data;
    charts.jam = new Chart(jEl, { type:'bar',
      data:{ labels:[['Pagi','(06–12)'],['Siang','(12–18)'],['Malam','(18–00)'],['Dini Hari','(00–06)']], datasets:[{ data:[tod.pagi,tod.siang,tod.malam,tod.dini], backgroundColor:['#FFE066','#FFB020','#FF7A1A','#D6480F'], borderRadius:3 }] },
      options:{ scales:{ x:{grid:{display:false}, ticks:{font:{size:10}, maxRotation:0, minRotation:0}}, y:{grid:{color:line}, beginAtZero:true} }, plugins:{legend:{display:false}} } });
  }

  destroy('jamLapor');
  const jlEl = $('chartJamLapor');
  if (jlEl){
    const bucket = {pagi:0, siang:0, malam:0, dini:0};
    operasi.forEach(o=>{
      if (!o.waktu_lapor) return;
      const h = new Date(o.waktu_lapor).getHours();
      if (h < 6) bucket.dini++; else if (h < 12) bucket.pagi++; else if (h < 18) bucket.siang++; else bucket.malam++;
    });
    charts.jamLapor = new Chart(jlEl, { type:'bar',
      data:{ labels:[['Pagi','(06–12)'],['Siang','(12–18)'],['Malam','(18–00)'],['Dini Hari','(00–06)']], datasets:[{ data:[bucket.pagi,bucket.siang,bucket.malam,bucket.dini], backgroundColor:['#FFE066','#FFB020','#FF7A1A','#D6480F'], borderRadius:3 }] },
          options:{ scales:{ x:{grid:{display:false}, ticks:{font:{size:9.5}, maxRotation:0, minRotation:0}}, y:{grid:{color:line}, beginAtZero:true} }, plugins:{legend:{display:false}} } });  }

  destroy('rentangLapor');
  const rlEl = $('chartRentangLapor');
  if (rlEl){
    const buckets = [0,0,0,0];
    operasi.forEach(o=>{
      if (!o.waktu_lapor || !o.waktu_kejadian) return;
      const diffMin = (new Date(o.waktu_lapor) - new Date(o.waktu_kejadian)) / 60000;
      if (diffMin >= 0) buckets[bucketRentangLapor(diffMin)]++;
    });
    charts.rentangLapor = new Chart(rlEl, { type:'bar',
      data:{ labels:['<15 menit','15–60 menit','1–3 jam','>3 jam'], datasets:[{ data:buckets, backgroundColor:['#FFE066','#FFB020','#FF7A1A','#D6480F'], borderRadius:3 }] },
      options:{ scales:{ x:{grid:{display:false}, ticks:{font:{size:9.5}, maxRotation:0, minRotation:0}}, y:{grid:{color:line}, beginAtZero:true} }, plugins:{legend:{display:false}} } });
  }

  destroy('durasiOperasi');
  const doEl = $('chartDurasiOperasi');
  if (doEl){
    const dist = durasiRes.data;
    const labels = ['<1 hari','1-3 hari','3-7 hari','>7 hari'];
    charts.durasiOperasi = new Chart(doEl, { type:'bar',
      data:{ labels, datasets:[{ data:labels.map(l=>dist[l]||0), backgroundColor:['#FFE066','#FFB020','#FF7A1A','#D6480F'], borderRadius:3 }] },
      options:{ layout:{padding:{top:16}}, scales:{ x:{grid:{display:false}, ticks:{font:{size:9.5}}}, y:{grid:{color:line}, beginAtZero:true} }, plugins:{legend:{display:false}, barValueLabels:{enabled:true}} } });
  }

  destroy('tempuhDurasi');
  const tdEl = $('chartTempuhDurasi');
  if (tdEl){
    const allCatIds = CATS.map(c=>c.id);
    const byCat = {};
    allCatIds.forEach(cid=> byCat[cid] = {tempuh:[], durasi:[]});
    operasi.forEach(o=>{
      if (!byCat[o.nama_kategori]) return;
      if (o.waktu_tempuh_menit != null) byCat[o.nama_kategori].tempuh.push(o.waktu_tempuh_menit);
      if (o.durasi_operasi_hari != null) byCat[o.nama_kategori].durasi.push(o.durasi_operasi_hari);
    });
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    charts.tempuhDurasi = new Chart(tdEl, { type:'bar',
      data:{ labels: allCatIds.map(cid=>CATMAP[cid].label),
        datasets:[
          { type:'bar', label:'Waktu Tempuh (menit)', data: allCatIds.map(cid=>Math.round(avg(byCat[cid].tempuh))), backgroundColor:'#FF7A1A', yAxisID:'y', borderRadius:3, order:2 },
          { type:'line', label:'Durasi Operasi (hari)', data: allCatIds.map(cid=>+avg(byCat[cid].durasi).toFixed(1)), borderColor:'#FFC98A', backgroundColor:'#FFC98A', yAxisID:'y1', tension:.3, pointRadius:3, order:1 },
        ] },
      options:{ scales:{
          x:{grid:{display:false}, ticks:{font:{size:9.5}, autoSkip:false, maxRotation:0, minRotation:0, callback:function(val){ const label = this.getLabelForValue(val); return label.length > 14 ? label.match(/.{1,14}(\s|$)/g) : label; }}},
          y:{position:'left', grid:{color:line}, title:{display:true, text:'menit', color:'#8B7A6B', font:{size:9}}},
          y1:{position:'right', grid:{display:false}, title:{display:true, text:'hari', color:'#8B7A6B', font:{size:9}}},
        }, plugins:{legend:{position:'bottom', labels:{boxWidth:9,font:{size:10}}}} } });
  }

  destroy('topKlasifikasi');
  const tkEl2 = $('chartTopKlasifikasi');
  if (tkEl2){
    const filteredCat = f.kategori.length === CATS.length ? [] : f.kategori;
    $('top-klasifikasi-sub').textContent = filteredCat.length ? `kategori terpilih (${filteredCat.length})` : 'seluruh kategori';
    const rows = topKlasRes.data;
    charts.topKlasifikasi = new Chart(tkEl2, { type:'bar',
      data:{ labels: rows.map(r=>r.nama_klasifikasi), datasets:[{ data: rows.map(r=>r.jumlah), backgroundColor: rows.map(r=>CATMAP[r.nama_kategori]?CATMAP[r.nama_kategori].color:'#FF7A1A'), borderRadius:3 }] },
      options:{ indexAxis:'y', layout:{padding:{right:36}}, scales:{ x:{grid:{color:line}, beginAtZero:true, title:{display:true, text:'Jumlah Kejadian', color:'#C9B8A8', font:{size:11}}}, y:{grid:{display:false}} }, plugins:{legend:{display:false}, barValueLabels:{enabled:true}} } });
  }
  destroy('status');
  const sEl = $('chartStatus');
  if (sEl){
    const sh = statusHasilRes.data;
    charts.status = new Chart(sEl, { type:'doughnut',
      data:{ labels:['Hidup','Meninggal Dunia','Hilang / Tidak Ditemukan'], datasets:[{ data:[sh.selamat, sh.meninggal, sh.hilang], backgroundColor:['#5FBE7A','#FF5A4A','#F0B34E'], borderColor:'#0A0808', borderWidth:3 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:'62%' } });
  }
  const sh = statusHasilRes.data;
  renderLegendList('legend-hasil', [
    {label:'Hidup', color:'#5FBE7A', value:sh.selamat},
    {label:'Meninggal Dunia', color:'#FF5A4A', value:sh.meninggal},
    {label:'Hilang / Tidak Ditemukan', color:'#F0B34E', value:sh.hilang},
  ]);
}

/* ================= ZONA PRIORITAS ================= */
function generateRekomendasiZona(z){
  const domLabel = z.dominanCatId != null && CATMAP[z.dominanCatId] ? CATMAP[z.dominanCatId].label : null;
  let base;
  if (!domLabel) {
    base = `Jenis kejadian di wilayah ini bervariasi, belum ada kategori yang menonjol.`;
  } else if (domLabel.includes('Kapal')) {
    base = `Kejadian terbanyak berupa kecelakaan kapal/laut. Perlu patroli laut dan kesiapan tim SAR di jalur pelayaran ${z.kab}.`;
  } else if (domLabel.includes('Pesawat')) {
    base = `Kejadian terbanyak berupa kecelakaan pesawat/penerbangan. Perlu koordinasi kesiapsiagaan dengan pihak bandara setempat.`;
  } else if (domLabel.includes('Bencana')) {
    base = `Kejadian terbanyak berupa bencana alam. Perlu jalur evakuasi dan kesiapsiagaan bencana di wilayah ${z.kab}.`;
  } else if (domLabel.includes('Membahayakan')) {
    base = `Kejadian terbanyak berupa kondisi yang membahayakan keselamatan warga. Perlu koordinasi dengan Dinas Perhubungan dan kepolisian setempat.`;
  } else {
    base = `Kejadian terbanyak berupa ${domLabel.toLowerCase()}. Perlu koordinasi penanganan untuk jenis kejadian ini di wilayah ${z.wilayah}.`;
  }
  const urgency = z.kejadian >= 20 ? ' Jumlah kejadian tergolong tinggi — pertimbangkan penambahan unit siaga.'
    : z.kejadian >= 10 ? ' Jumlah kejadian tergolong sedang — pastikan personel dan peralatan tetap siap.'
    : '';
  return base + urgency;
}

async function renderZona(){
  const f = getActiveFilters();
  const operasiRes = await Api.operasi(f);
  const zonaStats = computeZonaStats(operasiRes.data);
  renderMapBufferLeaflet('map-buffer', operasiRes.data);
  renderMapJarakTemuLeaflet('map-jaraktemu', operasiRes.data);

  const list = zonaStats.filter(z=>z.kejadian>0).slice(0, 10);
  const maxK = Math.max(1, ...list.map(z=>z.kejadian));
  if (!list.length){
    $('zona-list').innerHTML = `<div class="admin-empty-hint">Tidak ada kejadian pada filter aktif.</div>`;
    return;
  }
  $('zona-list').innerHTML = list.map((z,i)=>{
    return `<div class="rank-item">
      <div class="no">${String(i+1).padStart(2,'0')}</div>
      <div class="info"><div class="kab">${z.kab}</div><div class="pos">${z.wilayah}</div></div>
      <div class="metric"><span class="n">${z.kejadian}</span><span class="unit">kejadian</span><div class="bar-bg"><div class="bar-fg" style="width:${Math.round((z.kejadian/maxK)*100)}%"></div></div></div>
      <div class="rek">${generateRekomendasiZona(z)}</div>
    </div>`;
  }).join('');
}

/* ================= PREDIKSI SEBARAN LOKASI ================= */
function buildPeriodePrediksiPanel(periodeKeys){
  const items = (periodeKeys||[]).map(key=>{
    const [y,m] = key.split('-');
    const label = MONTHS_SHORT[parseInt(m,10)-1] + ' ' + y;
    return `<label class="ms-opt"><input type="radio" name="rb_periode_prediksi" value="${key}" ${predMonthKey===key?'checked':''} onchange="onPeriodePrediksiToggle(this)">${label}</label>`;
  }).join('');
  $('panel-periode-prediksi').innerHTML = `<div class="ms-list">${items}</div>`;
}
function periodeLabel(key){
  if (!key) return '';
  const [y,m] = key.split('-');
  return MONTHS_SHORT[parseInt(m,10)-1] + ' ' + y;
}
function onPeriodePrediksiToggle(el){
  predMonthKey = el.value;
  $('btn-periode-prediksi-text').textContent = 'Periode: ' + periodeLabel(predMonthKey);
  $('panel-periode-prediksi').classList.remove('open');
  render();
}

let PREDICTION_ZONES_CACHE = null;


function renderMapPrediksiChoropleth(containerId, geojson, dataForPeriode, kabupatenDiLuarScope){
  const wrap = document.getElementById(containerId); if (!wrap) return;
  const entry = getOrCreateLeafletMap(containerId);
  entry.map.invalidateSize();
  if (entry.choroplethLayer){ entry.map.removeLayer(entry.choroplethLayer); entry.choroplethLayer = null; }
  const oldNote = wrap.querySelector('.map-note'); if (oldNote) oldNote.remove();
  let legend = wrap.querySelector('.map-legend');

  if (!predMonthKey){
    if (legend) legend.remove();
    const note = document.createElement('div'); note.className = 'map-note';
    note.textContent = 'Pilih periode prediksi →';
    wrap.appendChild(note);
    return;
  }

  entry.choroplethLayer = L.geoJson(geojson, {
    style: (feature)=>{
      const nama = feature.properties.NAME_2;
      const d = (dataForPeriode||{})[nama];
      if (!d) return { fillOpacity: 0, weight: 0 };
      return { fillColor: WARNA_LEVEL[d.level], weight: 1, color: '#1a1a1a', fillOpacity: 0.8 };
    },
    onEachFeature: (feature, layer)=>{
      const nama = feature.properties.NAME_2;
      const d = (dataForPeriode||{})[nama];
      if (!d) return;
      layer.bindTooltip(`<b>${nama}</b><br>Potensi: ${d.level}`, {direction:'center', className:'sar-pred-tooltip'});
      layer.on('mouseover', function(){
        entry.choroplethLayer.eachLayer(l=>{ if (l !== this) l.closeTooltip(); });
      });
    }
  }).addTo(entry.map);

  if (!legend){ legend = document.createElement('div'); legend.className='map-legend'; wrap.appendChild(legend); }
  legend.innerHTML = `
    <div class="row"><span class="sw" style="background:${WARNA_LEVEL['Rendah']}"></span>Rendah</div>
    <div class="row"><span class="sw" style="background:${WARNA_LEVEL['Sedang']}"></span>Sedang</div>
    <div class="row"><span class="sw" style="background:${WARNA_LEVEL['Tinggi']}"></span>Tinggi</div>`;

  const note = document.createElement('div'); note.className = 'map-note';
  note.textContent = `Periode: ${periodeLabel(predMonthKey)}`;
  wrap.appendChild(note);
}

async function renderPrediksi(){
  baseOpt();
  const [prediksiRes, geojson] = await Promise.all([fetchPrediksiZonaRawan(), fetchKabkotaGeoJSON()]);
  const periodeKeys = Object.keys(prediksiRes.prediksi || {}).sort();
  if (!predMonthKey && periodeKeys.length) predMonthKey = periodeKeys[0];
  buildPeriodePrediksiPanel(periodeKeys);
  $('btn-periode-prediksi-text').textContent = predMonthKey ? ('Periode: ' + periodeLabel(predMonthKey)) : 'Periode Prediksi';
  const dataForPeriode = predMonthKey ? (prediksiRes.prediksi || {})[predMonthKey] || {} : {};
  const kabupatenDiLuarScope = (prediksiRes.metadata || {}).kabupaten_di_luar_scope || [];
  renderMapPrediksiChoropleth('map-prediksi-spasial', geojson, dataForPeriode, kabupatenDiLuarScope);

  const f = getActiveFilters();
  const yearsForHist = YEARS_AVAILABLE.slice(-3);
  const trenPerYear = await Promise.all(yearsForHist.map(y => Api.trenBulanan({tahun:[y], kategori:f.kategori})));
  const currentRealYear = new Date().getFullYear();
  const completeYears = yearsForHist.filter(y => y < currentRealYear);
  const baselineYear = completeYears.length ? completeYears[completeYears.length - 1] : yearsForHist[yearsForHist.length - 1];
  const baselineIdx = yearsForHist.indexOf(baselineYear);

  const latestYearTotals = {};
  (trenPerYear[baselineIdx >= 0 ? baselineIdx : trenPerYear.length-1]?.data || []).forEach(row=>{
    latestYearTotals[row.nama_kategori] = (latestYearTotals[row.nama_kategori]||0) + row.jumlah;
  });

  let domKey = state.activeCats[0], domVal = -1;
  state.activeCats.forEach(cid=>{ const v = latestYearTotals[cid]||0; if (v>domVal){domVal=v; domKey=cid;} });
  const topKabEntry = Object.entries(dataForPeriode).sort((a,b)=> b[1].skor - a[1].skor)[0];
  const topKabNama = topKabEntry ? topKabEntry[0] : null;
  const topKabLevel = topKabEntry ? topKabEntry[1].level : null;
  const domLabel = domKey!=null && CATMAP[domKey] ? CATMAP[domKey].label : null;

  const insightTxt = (domLabel && topKabNama)
    ? `Pada periode <b>${periodeLabel(predMonthKey)}</b>, <b>${domLabel}</b> diperkirakan tetap menjadi jenis kejadian paling banyak terjadi, dengan wilayah paling rawan adalah <b>${topKabNama}</b> (potensi ${topKabLevel.toLowerCase()}). Disarankan penguatan kesiapsiagaan personel dan peralatan SAR di wilayah tersebut.`
    : 'Data prediksi untuk periode ini belum cukup untuk memberikan insight kesiapsiagaan.';

  $('alert-card').innerHTML = `
      <div>
        <div class="tag">Peringatan Kesiapsiagaan</div>
        <div class="txt">${insightTxt}</div>
      </div>`;
  $('alert-card').style.borderLeftColor = topKabLevel ? WARNA_LEVEL[topKabLevel] : 'var(--o-90)';

  const rankSorted = Object.entries(dataForPeriode).sort((a,b)=> b[1].skor - a[1].skor).slice(0, 8);
  const maxSkor = Math.max(0.001, ...rankSorted.map(([,d])=>d.skor));
  const rankListEl = $('prediksi-rank-list');
  if (rankListEl){
    rankListEl.innerHTML = rankSorted.length ? rankSorted.map(([kab, d], i)=>`
      <div class="rank-item">
        <div class="no">${String(i+1).padStart(2,'0')}</div>
        <div class="info"><div class="kab">${kab}</div><div class="pos">Potensi ${d.level}</div></div>
        <div class="metric"><span class="n">${d.skor.toFixed(2)}</span><span class="unit">skor kerawanan</span><div class="bar-bg"><div class="bar-fg" style="width:${Math.round((d.skor/maxSkor)*100)}%; background:${WARNA_LEVEL[d.level]}"></div></div></div>
      </div>`).join('') : `<div class="admin-empty-hint">Data prediksi belum tersedia untuk periode ini.</div>`;
  }
  }

/* ================= ADMIN: INPUT DATA OPERASI =================
   Dua mode input, sesuai tab yang aktif:
     1. "Input Manual Per Kejadian" -- form satuan. Field-nya field kolom
        kejadian_sar langsung: S/MD/H disimpan sebagai angka agregat (kolom
        s_org/md_org/h_org), BUKAN baris per-individu korban -- skema
        kejadian_sar memang cuma punya kolom agregat, tidak ada tabel korban
        terpisah (lihat catatan skema di routes/public_routes.py & admin_routes.py).
     2. "Upload File Excel (Bulk Import)" -- drag & drop / file picker, file
        dikirim APA ADANYA ke server (POST /admin/operasi/bulk/preview) yang
        mem-parsing format laporan asli & memvalidasinya dengan aturan yang
        SAMA dengan input manual (lihat services/excel_import_service.py &
        normalize_payload() di admin_routes.py). Parsing TIDAK dilakukan di
        browser -- lihat catatan di bagian "ADMIN: UPLOAD EXCEL" di bawah.
   ================================================================= */

let adminActiveTab = 'manual';
let adminFormInitialized = false;

function switchAdminTab(tab){
  adminActiveTab = tab;
  ['manual', 'excel', 'data', 'admins'].forEach(t => {
    $(`admin-tab-btn-${t}`).classList.toggle('active', tab === t);
    $(`admin-tab-btn-${t}`).setAttribute('aria-selected', tab === t);
    $(`admin-tab-${t}`).classList.toggle('active', tab === t);
  });
  if (tab === 'manual') initAdminMapPicker();
  else if (tab === 'admins') renderAdminAccountsTab();
}

/* Kategori & Klasifikasi: dropdown (bukan lagi text+datalist), diisi dari
   ADMIN_KATEGORI_OPTIONS / ADMIN_KLASIFIKASI_OPTIONS (daftar standar) DITAMBAH
   nilai apa pun yang sudah ada di database tapi belum ada di daftar standar
   (mis. hasil ketikan bebas dari versi form sebelum ini) -- supaya tidak ada
   data lama yang jadi "hilang" dari pilihan dropdown. */
function buildAdminSelectOptions(){
  const selKat = $('admin-f-kategori'), selKl = $('admin-f-klasifikasi'), dlSumber = $('admin-dl-sumber');
  if (selKat){
    const extra = CATS.map(c => c.id).filter(id => !ADMIN_KATEGORI_OPTIONS.includes(id));
    const opts = ADMIN_KATEGORI_OPTIONS.concat(extra);
    selKat.innerHTML = '<option value="">-- Pilih Kategori --</option>' +
      opts.map(id => `<option value="${id}">${toDisplayKategoriLabel(id)}</option>`).join('');
  }
  if (selKl){
    const knownVals = (REF.klasifikasi || []).map(k => k.nilai);
    const extra = knownVals.filter(v => !ADMIN_KLASIFIKASI_OPTIONS.includes(v));
    const opts = ADMIN_KLASIFIKASI_OPTIONS.concat(extra);
    selKl.innerHTML = '<option value="">-- Pilih Klasifikasi (opsional) --</option>' +
      opts.map(v => `<option value="${v}">${v}</option>`).join('');
  }
  if (dlSumber) dlSumber.innerHTML = (REF.sumber || []).map(s => `<option value="${s.nilai}">`).join('');
  buildAdminWilayahCheckboxes();
}

/* Klasifikasi "Lainnya": munculkan input teks bebas saat dipilih, supaya
   kejadian yang klasifikasinya belum ada di daftar standar (mis. "Tsunami")
   tetap bisa dicatat tanpa mengubah daftar dropdown. Nilai akhir yang
   disimpan ke kolom kategori_kejadian yang SAMA (bukan kolom baru) berformat
   "Lainnya (<isian>)" -- lihat getKlasifikasiValue()/parseKlasifikasiField(). */
function onAdminKlasifikasiChange(){
  const isLainnya = $('admin-f-klasifikasi').value === 'Lainnya';
  $('admin-f-klasifikasi-lainnya').style.display = isLainnya ? '' : 'none';
  if (!isLainnya) $('admin-f-klasifikasi-lainnya').value = '';
}
function getKlasifikasiValue(){
  const sel = ($('admin-f-klasifikasi').value || '').trim();
  if (sel === 'Lainnya'){
    const custom = ($('admin-f-klasifikasi-lainnya').value || '').trim();
    return custom ? `Lainnya (${custom})` : 'Lainnya';
  }
  return sel || null;
}
/* Kebalikan dari getKlasifikasiValue() -- dipanggil saat memuat data lama ke
   form edit, supaya nilai "Lainnya (Tsunami)" hasil simpanan sebelumnya
   kembali terpecah jadi pilihan "Lainnya" + isian teks "Tsunami". */
function applyKlasifikasiField(rawValue){
  const val = rawValue || '';
  const m = val.match(/^Lainnya\s*\(([\s\S]*)\)$/i);
  if (m){
    setAdminSelectValue('admin-f-klasifikasi', 'Lainnya');
    $('admin-f-klasifikasi-lainnya').value = m[1].trim();
  } else {
    setAdminSelectValue('admin-f-klasifikasi', val);
    $('admin-f-klasifikasi-lainnya').value = '';
  }
  onAdminKlasifikasiChange();
}

/* Jarak (Km / Nm): dua kolom angka terpisah di form, digabung jadi satu teks
   ("44 Km" / "44 Km / 23.7 Nm") saat disimpan ke kolom `jarak` -- kolom ini
   sudah ada & sudah dipakai bulk-import Excel dengan format yang sama (lihat
   combine_val_unit() di services/excel_import_service.py), jadi data manual
   & data impor tetap konsisten satu format. */
function getJarakValue(){
  const km = ($('admin-f-jarak-km').value || '').trim();
  const nm = ($('admin-f-jarak-nm').value || '').trim();
  const parts = [];
  if (km) parts.push(`${km} Km`);
  if (nm) parts.push(`${nm} Nm`);
  return parts.length ? parts.join(' / ') : null;
}
/* Kebalikan dari getJarakValue() -- parsing lunak karena data historis
   formatnya tidak seragam (mis. "44 Km", "4.97 Nm.", "148 Km.", atau "- -"
   untuk baris tanpa data). Angka yang tidak cocok pola manapun cukup
   ditinggalkan kosong di form, admin bisa isi ulang manual. */
function applyJarakField(rawValue){
  $('admin-f-jarak-km').value = '';
  $('admin-f-jarak-nm').value = '';
  if (!rawValue) return;
  String(rawValue).split('/').forEach(part => {
    const m = part.trim().match(/([\d.]+)\s*(km|nm)/i);
    if (!m) return;
    const num = m[1], unit = m[2].toLowerCase();
    if (unit === 'km') $('admin-f-jarak-km').value = num;
    else if (unit === 'nm') $('admin-f-jarak-nm').value = num;
  });
}

/* Set value ke <select>, dan kalau value-nya tidak ada di antara <option>
   yang ada (mis. sedang mengedit baris lama dengan nilai kategori/klasifikasi
   yang unik/tidak standar), tambahkan sebagai opsi ekstra dulu -- supaya
   data lama tetap tampil apa adanya, bukan diam-diam berubah jadi kosong. */
function setAdminSelectValue(selectId, value){
  const el = $(selectId); if (!el) return;
  if (value && !Array.from(el.options).some(o => o.value === value)){
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = `${value} (nilai lama)`;
    el.appendChild(opt);
  }
  el.value = value || '';
}
function buildAdminWilayahCheckboxes(){
  const grid = $('admin-wilayah-checkgrid'); if (!grid) return;
  grid.innerHTML = WILAYAH_LIST.map(w => `
    <label class="admin-checkbox-opt"><input type="checkbox" value="${w.id}" class="admin-wilayah-cb">${w.label}</label>
  `).join('') || '<div class="admin-empty-hint">Belum ada data wilayah.</div>';
}
function getSelectedAdminWilayah(){
  const checked = Array.from(document.querySelectorAll('.admin-wilayah-cb:checked')).map(cb => cb.value);
  const extra = ($('admin-f-wilayah-lain').value || '').split(',').map(s => s.trim()).filter(Boolean);
  return Array.from(new Set([...checked, ...extra]));
}
function setSelectedAdminWilayah(wilayahMappedStr){
  const parts = (wilayahMappedStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const known = new Set(WILAYAH_LIST.map(w => w.id));
  document.querySelectorAll('.admin-wilayah-cb').forEach(cb => { cb.checked = parts.includes(cb.value); });
  $('admin-f-wilayah-lain').value = parts.filter(p => !known.has(p)).join(', ');
}

/* Status Operasi TIDAK diinput manual -- dihitung otomatis dari kelengkapan
   Waktu Berangkat / Waktu Tiba: "Tidak Dilaksanakan" HANYA kalau dua-duanya
   kosong (aturan yang sama dipakai di seluruh data historis, lihat
   normalize_payload() di routes/admin_routes.py). Backend menghitung ulang
   nilai yang sama secara independen, jadi indikator ini murni bantuan
   visual, bukan sumber kebenaran. */
function updateStatusIndicator(){
  const el = $('admin-status-indicator'); if (!el) return;
  const berangkat = $('admin-f-waktu-berangkat').value;
  const tiba = $('admin-f-waktu-tiba').value;
  const dilaksanakan = !!(berangkat || tiba);
  el.textContent = 'Status akan tercatat sebagai: ' + (dilaksanakan ? 'Dilaksanakan' : 'Tidak Dilaksanakan');
  el.className = 'admin-status-indicator ' + (dilaksanakan ? 'is-dilaksanakan' : 'is-tidak-dilaksanakan');
}

function validateKorbanVsPob(){
  const hint = $('admin-korban-hint'); if (!hint) return;
  const pobRaw = $('admin-f-pob').value;
  const pob = pobRaw === '' ? null : parseInt(pobRaw, 10);
  const s = parseInt($('admin-f-s').value || '0', 10);
  const md = parseInt($('admin-f-md').value || '0', 10);
  const h = parseInt($('admin-f-h').value || '0', 10);
  const total = s + md + h;
  if (pob != null && total > pob){
    hint.textContent = `Total korban (${total}) melebihi POB (${pob}).`;
    hint.style.color = '#FF9086';
  } else {
    hint.textContent = 'Total korban (S + MD + H) tidak boleh melebihi POB.';
    hint.style.color = '';
  }
}

/* ---- Mini map picker (Leaflet asli, dengan marker draggable) ---- */
function initAdminMapPicker(){
  const el = $('admin-map-picker'); if (!el) return;
  const entry = getOrCreateLeafletMap('admin-map-picker');
  setTimeout(() => entry.map.invalidateSize(), 60);
  entry.markersLayer.clearLayers();

  entry.map.off('click', onAdminMapClick);
  entry.map.on('click', onAdminMapClick);

  let note = el.querySelector('.map-note');
  if (!note){ note = document.createElement('div'); note.className = 'map-note'; el.appendChild(note); }
  note.textContent = 'Klik peta (atau geser pin) untuk isi koordinat';

  const latVal = parseFloat($('admin-f-lat').value), lonVal = parseFloat($('admin-f-lon').value);
  if (!isNaN(latVal) && !isNaN(lonVal)){
    placeAdminMapMarker(latVal, lonVal, {pan:true});
  }
}
function placeAdminMapMarker(lat, lon, opts){
  opts = opts || {};
  const entry = getOrCreateLeafletMap('admin-map-picker');
  entry.markersLayer.clearLayers();
  const icon = L.divIcon({ className:'leaflet-pos-marker', html:'<div class="lp-dot"></div>', iconSize:[16,16], iconAnchor:[8,8] });
  L.marker([lat, lon], {icon, draggable:true, zIndexOffset:700})
    .on('dragend', function(e){
      const pos = e.target.getLatLng();
      $('admin-f-lat').value = pos.lat.toFixed(6);
      $('admin-f-lon').value = pos.lng.toFixed(6);
    })
    .addTo(entry.markersLayer);
  if (opts.pan) entry.map.panTo([lat, lon]);
}
function onAdminMapClick(e){
  const { lat, lng } = e.latlng;
  $('admin-f-lat').value = lat.toFixed(6);
  $('admin-f-lon').value = lng.toFixed(6);
  placeAdminMapMarker(lat, lng);
}
function onAdminLatLonInput(){
  const lat = parseFloat($('admin-f-lat').value), lon = parseFloat($('admin-f-lon').value);
  if (!isNaN(lat) && !isNaN(lon)) placeAdminMapMarker(lat, lon, {pan:true});
}

let editingOpId = null;
function toLocalInput(dtStr){
  if (!dtStr) return '';
  const d = new Date(dtStr);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function resetAdminForm(){
  editingOpId = null;
  $('admin-form-title').textContent = 'Form Kejadian Baru';
  $('admin-f-id').value = '';
  $('admin-f-waktu-kejadian').value = '';
  $('admin-f-kategori').value = '';
  $('admin-f-klasifikasi').value = '';
  $('admin-f-klasifikasi-lainnya').value = '';
  onAdminKlasifikasiChange();
  $('admin-f-jenis').value = '';
  $('admin-f-lkk').value = '';
  $('admin-f-lat').value = '';
  $('admin-f-lon').value = '';
  document.querySelectorAll('.admin-wilayah-cb').forEach(cb => cb.checked = false);
  $('admin-f-wilayah-lain').value = '';
  $('admin-f-pob').value = '';
  $('admin-f-s').value = 0;
  $('admin-f-md').value = 0;
  $('admin-f-h').value = 0;
  $('admin-f-sumber').value = '';
  $('admin-f-tgl-lapor').value = '';
  $('admin-f-waktu-berangkat').value = '';
  $('admin-f-waktu-tiba').value = '';
  $('admin-f-waktu-selesai').value = '';
  $('admin-f-waktu-siap').value = '';
  $('admin-f-waktu-tempuh').value = '';
  $('admin-f-jarak-km').value = '';
  $('admin-f-jarak-nm').value = '';
  $('admin-f-biaya').value = '';
  $('admin-f-lokasi-ditemukan').value = '';
  $('admin-f-lat-ditemukan').value = '';
  $('admin-f-lon-ditemukan').value = '';
  $('admin-f-instansi').value = '';
  $('admin-f-peralatan').value = '';
  $('admin-f-kendala').value = '';
  $('admin-f-lain').value = '';
  $('admin-form-error').style.display = 'none';
  validateKorbanVsPob();
  updateStatusIndicator();
  const entry = _leafletMaps['admin-map-picker'];
  if (entry) entry.markersLayer.clearLayers();
  initAdminMapPicker();
}

async function loadAdminOpToForm(id){
  const res = await Api.adminOperasiDetail(id);
  if (!res.success){ showAdminToast(res.message || 'Gagal memuat data operasi.', true); return; }
  const op = res.data;
  editingOpId = id;
  switchAdminTab('manual');
  $('admin-form-title').textContent = 'Edit Kejadian #' + id;
  $('admin-f-id').value = op.id_operasi;
  $('admin-f-waktu-kejadian').value = toLocalInput(op.waktu_kejadian);
  setAdminSelectValue('admin-f-kategori', op.kategori || '');
  applyKlasifikasiField(op.kategori_kejadian || '');
  $('admin-f-jenis').value = op.jenis_kecelakaan || '';
  $('admin-f-lkk').value = op.posisi_koordinat_area || '';
  $('admin-f-lat').value = op.latitude_lkk != null ? op.latitude_lkk : '';
  $('admin-f-lon').value = op.longitude_lkk != null ? op.longitude_lkk : '';
  setSelectedAdminWilayah(op.wilayah_mapped);
  $('admin-f-pob').value = op.pob != null ? op.pob : '';
  $('admin-f-s').value = op.s_org || 0;
  $('admin-f-md').value = op.md_org || 0;
  $('admin-f-h').value = op.h_org || 0;
  $('admin-f-sumber').value = op.sumber_berita || '';
  $('admin-f-tgl-lapor').value = toLocalInput(op.waktu_lapor);
  $('admin-f-waktu-berangkat').value = toLocalInput(op.waktu_berangkat);
  $('admin-f-waktu-tiba').value = toLocalInput(op.waktu_tiba);
  $('admin-f-waktu-selesai').value = toLocalInput(op.waktu_selesai);
  $('admin-f-waktu-siap').value = op.waktu_siap != null ? op.waktu_siap : '';
  $('admin-f-waktu-tempuh').value = op.waktu_tempuh_menit != null ? op.waktu_tempuh_menit : '';
  applyJarakField(op.jarak || '');
  $('admin-f-biaya').value = op.biaya_rp || '';
  $('admin-f-lokasi-ditemukan').value = op.lokasi_ditemukan || '';
  $('admin-f-lat-ditemukan').value = op.latitude_ditemukan != null ? op.latitude_ditemukan : '';
  $('admin-f-lon-ditemukan').value = op.longitude_ditemukan != null ? op.longitude_ditemukan : '';
  $('admin-f-instansi').value = op.instansi_jml_person || '';
  $('admin-f-peralatan').value = op.peralatan || '';
  $('admin-f-kendala').value = op.kendala_pelaksanaan_ops_sar || '';
  $('admin-f-lain').value = op.lainlain || '';

  $('admin-form-error').style.display = 'none';
  validateKorbanVsPob();
  updateStatusIndicator();
  initAdminMapPicker();
  document.querySelector('main.content').scrollTo({top:0, behavior:'smooth'});
}

async function deleteAdminOp(id){
  if (!confirm('Hapus data kejadian #' + id + '? Tindakan ini tidak dapat dibatalkan.')) return;
  try {
    const res = await Api.adminOperasiDelete(id);
    if (!res.success){ showAdminToast(res.message || 'Gagal menghapus data.', true); return; }
    showAdminToast('Data kejadian berhasil dihapus.');
    if (editingOpId === id) resetAdminForm();
    renderAdminOpsTable();
    if (state.page === 'beranda') render();
  } catch (err) {
    showAdminToast(err.message, true);
  }
}

function validateAdminForm(){
  const val = id => $(id).value;
  const errors = [];
  if (!val('admin-f-waktu-kejadian')) errors.push('Waktu Kejadian wajib diisi.');
  if (!val('admin-f-kategori').trim()) errors.push('Kategori Kejadian wajib diisi.');
  if (!val('admin-f-jenis').trim()) errors.push('Jenis Kecelakaan wajib diisi.');

  const lat = parseFloat(val('admin-f-lat')), lon = parseFloat(val('admin-f-lon'));
  if (val('admin-f-lat') === '' || isNaN(lat)) errors.push('Latitude wajib diisi.');
  else if (lat < -90 || lat > 90) errors.push('Koordinat tidak valid (Latitude harus -90 s.d. 90).');
  if (val('admin-f-lon') === '' || isNaN(lon)) errors.push('Longitude wajib diisi.');
  else if (lon < -180 || lon > 180) errors.push('Koordinat tidak valid (Longitude harus -180 s.d. 180).');

  if (!getSelectedAdminWilayah().length) errors.push('Wilayah Terdampak wajib diisi (pilih minimal satu, atau isi kolom "wilayah lainnya").');

  if (val('admin-f-klasifikasi') === 'Lainnya' && !val('admin-f-klasifikasi-lainnya').trim()) {
    errors.push('Isi kolom klasifikasi kustom untuk "Lainnya", atau pilih klasifikasi lain.');
  }

  const pobRaw = val('admin-f-pob');
  const pob = pobRaw === '' ? null : parseInt(pobRaw, 10);
  const s = parseInt(val('admin-f-s') || '0', 10);
  const md = parseInt(val('admin-f-md') || '0', 10);
  const h = parseInt(val('admin-f-h') || '0', 10);
  if (pob != null && (s + md + h) > pob) errors.push('Jumlah Selamat + Meninggal Dunia + Hilang tidak boleh melebihi POB.');

  const waktuBerangkat = val('admin-f-waktu-berangkat');
  const waktuTiba = val('admin-f-waktu-tiba');
  const waktuSelesai = val('admin-f-waktu-selesai');
  if (waktuSelesai && !waktuBerangkat) errors.push('Waktu Berangkat wajib diisi jika Waktu Selesai sudah diisi.');
  if (waktuBerangkat && waktuSelesai && new Date(waktuSelesai) < new Date(waktuBerangkat)) errors.push('Waktu Selesai tidak boleh lebih awal dari Waktu Berangkat.');

  const kejadianDT = val('admin-f-waktu-kejadian') ? new Date(val('admin-f-waktu-kejadian')) : null;
  if (kejadianDT && waktuSelesai && new Date(waktuSelesai) < kejadianDT) errors.push('Waktu Selesai tidak boleh lebih awal dari Waktu Kejadian.');
  const tglLapor = val('admin-f-tgl-lapor');
  if (kejadianDT && tglLapor && new Date(tglLapor) < kejadianDT) errors.push('Waktu Lapor tidak boleh lebih awal dari Waktu Kejadian.');

  if (!tglLapor) errors.push('Waktu Laporan Diterima wajib diisi.');

  /* Status Operasi otomatis "Dilaksanakan" begitu Waktu Berangkat ATAU Waktu
     Tiba diisi (logika sama dengan updateStatusIndicator() & backend
     normalize_payload()) -- kalau sudah berstatus Dilaksanakan, Waktu Siap &
     Waktu Tempuh wajib diisi juga. Kalau statusnya masih Tidak Dilaksanakan
     (dua-duanya kosong), field ini boleh tetap kosong -- match ~3 baris
     historis "Tidak Dilaksanakan" yang memang tidak punya nilai ini sama
     sekali (lihat catatan di admin_routes.py normalize_payload()). */
  const dilaksanakan = !!(waktuBerangkat || waktuTiba);
  if (dilaksanakan){
    if (!val('admin-f-waktu-siap')) errors.push('Waktu Siap wajib diisi karena operasi ini akan tercatat berstatus Dilaksanakan.');
    if (!val('admin-f-waktu-tempuh')) errors.push('Waktu Tempuh wajib diisi karena operasi ini akan tercatat berstatus Dilaksanakan.');
  }

  return errors;
}

function collectAdminFormPayload(){
  const val = id => $(id).value;
  const num = (id) => val(id) === '' ? null : Number(val(id));
  const intVal = (id) => val(id) === '' ? null : parseInt(val(id), 10);
  const dt = (id) => val(id) ? val(id).replace('T', ' ') + ':00' : null;

  return {
    waktu_kejadian: dt('admin-f-waktu-kejadian'),
    kategori: val('admin-f-kategori').trim() || null,
    kategori_kejadian: getKlasifikasiValue(),
    jenis_kecelakaan: val('admin-f-jenis').trim() || null,
    posisi_koordinat_area: val('admin-f-lkk').trim() || null,
    latitude_lkk: num('admin-f-lat'),
    longitude_lkk: num('admin-f-lon'),
    wilayah_mapped: getSelectedAdminWilayah().join(', ') || null,
    sumber_berita: val('admin-f-sumber').trim() || null,
    waktu_lapor: dt('admin-f-tgl-lapor'),
    waktu_berangkat: dt('admin-f-waktu-berangkat'),
    waktu_tiba: dt('admin-f-waktu-tiba'),
    waktu_selesai: dt('admin-f-waktu-selesai'),
    waktu_siap: num('admin-f-waktu-siap'),
    waktu_tempuh_menit: num('admin-f-waktu-tempuh'),
    jarak: getJarakValue(),
    pob: intVal('admin-f-pob'),
    s_org: intVal('admin-f-s') || 0,
    md_org: intVal('admin-f-md') || 0,
    h_org: intVal('admin-f-h') || 0,
    lokasi_ditemukan: val('admin-f-lokasi-ditemukan').trim() || null,
    latitude_ditemukan: num('admin-f-lat-ditemukan'),
    longitude_ditemukan: num('admin-f-lon-ditemukan'),
    kendala_pelaksanaan_ops_sar: val('admin-f-kendala').trim() || null,
    instansi_jml_person: val('admin-f-instansi').trim() || null,
    peralatan: val('admin-f-peralatan').trim() || null,
    biaya_rp: val('admin-f-biaya').trim() || null,
    lainlain: val('admin-f-lain').trim() || null,
  };
}

function onSubmitAdminForm(){
  const errors = validateAdminForm();
  const errBox = $('admin-form-error');
  if (errors.length){
    errBox.style.display = 'block';
    errBox.innerHTML = errors.map(e => `<div>&bull; ${e}</div>`).join('');
    errBox.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  errBox.style.display = 'none';
  $('admin-confirm-modal').classList.add('open');
}
function closeAdminConfirm(){ $('admin-confirm-modal').classList.remove('open'); }

async function confirmSaveAdminForm(){
  const btn = $('admin-confirm-btn');
  btn.disabled = true;
  const payload = collectAdminFormPayload();
  try {
    const res = editingOpId ? await Api.adminOperasiUpdate(editingOpId, payload) : await Api.adminOperasiCreate(payload);
    if (!res.success){
      showAdminToast(res.message || 'Gagal menyimpan data.', true);
      closeAdminConfirm();
      return;
    }
    closeAdminConfirm();
    showAdminToast('Data kejadian berhasil disimpan.');
    resetAdminForm();
    await renderAdminOpsTable();
    await refreshYearsAvailable();
    if (state.page === 'beranda') render();
  } catch (err) {
    showAdminToast(err.message, true);
    closeAdminConfirm();
  } finally {
    btn.disabled = false;
  }
}

function showAdminToast(msg, isError){
  const t = $('admin-toast'); if (!t) return;
  t.textContent = msg;
  t.classList.toggle('error', !!isError);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* Pencarian & pagination tabel "Data Tersimpan" -- sebelumnya selalu ambil 1000
   baris sekaligus tanpa cara menyaring, makin lama makin berat & susah cari satu
   kejadian spesifik. Sekarang query ke server per-halaman + filter teks bebas
   (?q=) yang dicocokkan ke kategori/klasifikasi/wilayah/lokasi/ID di backend. */
let adminOpsQuery = '';
let adminOpsPage = 1;
const ADMIN_OPS_LIMIT = 50;

function onAdminOpsSearchInput(el){
  adminOpsQuery = el.value;
  adminOpsPage = 1;
  clearTimeout(window._adminOpsSearchDebounce);
  window._adminOpsSearchDebounce = setTimeout(renderAdminOpsTable, 300);
}
function goAdminOpsPage(delta){
  adminOpsPage = Math.max(1, adminOpsPage + delta);
  renderAdminOpsTable();
}

async function renderAdminOpsTable(){
  const tbody = $('admin-ops-tbody'); if (!tbody) return;
  if (!auth.isLoggedIn){ tbody.innerHTML = '<tr><td colspan="7" class="admin-empty-hint">Login sebagai admin untuk melihat data.</td></tr>'; return; }
  tbody.innerHTML = '<tr><td colspan="7" class="admin-loading">Memuat...</td></tr>';
  try {
    const res = await Api.adminOperasiList({ q: adminOpsQuery, page: adminOpsPage, limit: ADMIN_OPS_LIMIT });
    const { rows = [], total = 0, page = 1, total_halaman = 1 } = res.data || {};
    const fmtDate = s => { if (!s) return '-'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'}); };
    tbody.innerHTML = rows.map(o => `
      <tr>
        <td>#${o.id_operasi}</td>
        <td>${fmtDate(o.waktu_kejadian)}</td>
        <td>${o.nama_kategori || '-'}</td>
        <td>${o.lokasi_kejadian_deskripsi || '-'}</td>
        <td>${o.wilayah_mapped || '-'}</td>
        <td><span class="admin-status-pill admin-status-${(o.status_operasi || '').replace(/\s+/g, '-').toLowerCase()}">${o.status_operasi || '-'}</span></td>
        <td>
          <button class="admin-table-action" onclick="loadAdminOpToForm(${o.id_operasi})">Edit</button>
          <button class="admin-table-action admin-table-action-danger" onclick="deleteAdminOp(${o.id_operasi})">Hapus</button>
        </td>
      </tr>`).join('') || `<tr><td colspan="7" class="admin-empty-hint">${adminOpsQuery ? 'Tidak ada kejadian yang cocok dengan pencarian.' : 'Belum ada data kejadian.'}</td></tr>`;

    const pagEl = $('admin-ops-pagination');
    if (pagEl){
      const start = total ? (page - 1) * ADMIN_OPS_LIMIT + 1 : 0;
      const end = Math.min(page * ADMIN_OPS_LIMIT, total);
      pagEl.innerHTML = `
        <span class="admin-empty-hint" style="padding:0;">Menampilkan ${start}-${end} dari ${total} kejadian</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="admin-btn-small" ${page<=1?'disabled':''} onclick="goAdminOpsPage(-1)">&larr; Sebelumnya</button>
          <span class="admin-empty-hint" style="padding:0;">Halaman ${page} / ${total_halaman}</span>
          <button class="admin-btn-small" ${page>=total_halaman?'disabled':''} onclick="goAdminOpsPage(1)">Berikutnya &rarr;</button>
        </div>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-empty-hint" style="color:#FF9086;">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

/* ================= ADMIN: KELOLA AKUN ADMIN ================= */
async function renderAdminAccountsTab(){
  const tbody = $('admin-accounts-tbody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Memuat...</td></tr>';
  try {
    const res = await Api.adminList();
    const rows = res.data || [];
    const fmtDate = s => { const d = new Date(s); return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'}); };
    tbody.innerHTML = rows.map(a => `
      <tr>
        <td>${a.username}</td>
        <td>${a.nama_lengkap || '-'}</td>
        <td><span class="admin-status-pill ${a.status === 'aktif' ? 'admin-status-dilaksanakan' : 'admin-status-tidak-dilaksanakan'}">${a.status}</span></td>
        <td>${fmtDate(a.created_at)}</td>
        <td>
          ${a.id_admin === auth.id_admin ? '' : `<button class="admin-table-action ${a.status === 'aktif' ? 'admin-table-action-danger' : ''}" onclick="onToggleAdminStatus(${a.id_admin}, '${a.status === 'aktif' ? 'nonaktif' : 'aktif'}')">${a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>`}
        </td>
      </tr>`).join('') || '<tr><td colspan="5" class="admin-empty-hint">Belum ada akun admin.</td></tr>';
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty-hint" style="color:#FF9086;">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

async function onToggleAdminStatus(id, newStatus){
  const label = newStatus === 'aktif' ? 'mengaktifkan' : 'menonaktifkan';
  if (!confirm(`Yakin ingin ${label} akun admin ini?`)) return;
  try {
    const res = await Api.adminSetStatus(id, newStatus);
    if (!res.success){ showAdminToast(res.message || 'Gagal memperbarui status.', true); return; }
    showAdminToast('Status akun berhasil diperbarui.');
    renderAdminAccountsTab();
  } catch (err) {
    showAdminToast(err.message, true);
  }
}

async function onCreateAdmin(){
  const username = $('newadmin-f-username').value.trim();
  const nama_lengkap = $('newadmin-f-nama').value.trim();
  const password = $('newadmin-f-password').value;
  const errBox = $('newadmin-form-error');
  errBox.style.display = 'none';
  try {
    const res = await Api.adminCreate({ username, nama_lengkap, password });
    if (!res.success){
      errBox.textContent = res.message || 'Gagal membuat akun admin.';
      errBox.style.display = 'block';
      return;
    }
    showAdminToast(`Akun admin "${username}" berhasil dibuat.`);
    $('newadmin-f-username').value = '';
    $('newadmin-f-nama').value = '';
    $('newadmin-f-password').value = '';
    renderAdminAccountsTab();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
  }
}

async function onChangeOwnPassword(){
  const passwordLama = $('chpw-f-lama').value;
  const passwordBaru = $('chpw-f-baru').value;
  const konfirmasi = $('chpw-f-konfirmasi').value;
  const errBox = $('chpw-form-error');
  errBox.style.display = 'none';

  const errors = [];
  if (!passwordLama) errors.push('Password lama wajib diisi.');
  if (!passwordBaru) errors.push('Password baru wajib diisi.');
  else if (passwordBaru.length < 8) errors.push('Password baru minimal 8 karakter.');
  if (passwordBaru && konfirmasi !== passwordBaru) errors.push('Konfirmasi password baru tidak cocok.');
  if (errors.length){
    errBox.innerHTML = errors.map(e => `&bull; ${e}`).join('<br>');
    errBox.style.display = 'block';
    return;
  }

  try {
    const res = await Api.adminChangePassword(passwordLama, passwordBaru, konfirmasi);
    if (!res.success){
      errBox.textContent = res.message || 'Gagal mengganti password.';
      errBox.style.display = 'block';
      return;
    }
    showAdminToast('Password berhasil diganti.');
    $('chpw-f-lama').value = '';
    $('chpw-f-baru').value = '';
    $('chpw-f-konfirmasi').value = '';
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
  }
}

async function renderAdminInputPage(){
  if (!adminFormInitialized){
    resetAdminForm();
    adminFormInitialized = true;
  } else if (adminActiveTab === 'manual') {
    initAdminMapPicker();
  }
  updateStatusIndicator();
  validateKorbanVsPob();
  renderAdminOpsTable();
}


/* ================= ADMIN: UPLOAD EXCEL (BULK IMPORT) =================
   Alur: pilih/drop file -> "Proses & Validasi" mengirim file APA ADANYA
   (multipart/form-data, plus "Tahun Laporan" kalau diisi) ke
   POST /api/admin/operasi/bulk/preview. Parsing format laporan asli
   (multi-sheet per bulan, baris kategori + baris kejadian bernomor + baris
   lanjutan teks, konversi koordinat DMS/Radial->desimal, standardisasi
   waktu, dsb) dilakukan SEPENUHNYA DI SERVER oleh
   services/excel_import_service.py -- porting langsung dari script ETL yang
   sudah ditulis & diuji sendiri oleh pengguna. Setiap baris hasil parse
   sudah divalidasi dengan normalize_payload() yang SAMA dipakai input
   manual, dan hasilnya (baris + status + pesan error per baris) dikirim
   balik untuk pratinjau di sini.

   Kenapa TIDAK diparsing di browser (lagi)? Percobaan awal memakai
   pencocokan nama kolom header sederhana (SheetJS) -- ternyata format
   sumbernya sama sekali tidak seperti itu (lihat komentar di
   excel_import_service.py). Melakukan parsing ulang di JavaScript berarti
   menduplikasi logika regex & konversi koordinat yang cukup rumit, dengan
   risiko hasil beda halus dari versi Python yang sudah teruji -- jadi
   logika itu dipakai langsung, bukan ditulis ulang.

   Setelah pratinjau tampil, "Impor ke Database" mengirim ULANG hanya
   baris yang valid (payload apa adanya, dari hasil preview) ke
   POST /api/admin/operasi/bulk, yang memvalidasi sekali lagi lalu
   menyimpan per-baris dalam transaksi (SAVEPOINT per baris). */

let excelSelectedFile = null;
let excelPreviewRows = [];   // hasil /operasi/bulk/preview: [{row, sheet, source_row, payload, errors}, ...]

function onExcelDragOver(e){ e.preventDefault(); $('excel-dropzone').classList.add('dragover'); }
function onExcelDragLeave(e){ e.preventDefault(); $('excel-dropzone').classList.remove('dragover'); }
function onExcelDrop(e){
  e.preventDefault();
  $('excel-dropzone').classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length) onExcelFileChosen(e.dataTransfer.files);
}
function onExcelFileChosen(fileList){
  if (!fileList || !fileList.length) return;
  const file = fileList[0];
  if (!/\.xlsx$/i.test(file.name)){ showAdminToast('Format file tidak didukung. Gunakan file .xlsx (Excel).', true); return; }
  if (file.size > 20 * 1024 * 1024){ showAdminToast('Ukuran file melebihi 20MB.', true); return; }
  excelSelectedFile = file;
  $('excel-file-name').textContent = file.name;
  $('excel-file-meta').textContent = `${(file.size / 1024).toFixed(0)} KB`;
  $('excel-file-card').style.display = 'flex';
  $('excel-dropzone').style.display = 'none';
  $('excel-process-btn').disabled = false;
  $('excel-import-btn').style.display = 'none';
  $('excel-result-area').style.display = 'none';
}
function clearExcelFile(){
  excelSelectedFile = null;
  excelPreviewRows = [];
  $('excel-file-input').value = '';
  $('excel-file-card').style.display = 'none';
  $('excel-dropzone').style.display = 'flex';
  $('excel-process-btn').disabled = true;
  $('excel-import-btn').style.display = 'none';
  $('excel-result-area').style.display = 'none';
}

async function onProcessExcelFile(){
  if (!excelSelectedFile){ showAdminToast('Pilih file terlebih dahulu.', true); return; }
  const btn = $('excel-process-btn');
  btn.disabled = true; btn.textContent = 'Memproses di server...';
  try {
    const tahun = $('excel-f-tahun').value || null;
    const res = await Api.adminOperasiBulkPreview(excelSelectedFile, tahun);
    if (!res.success){
      showAdminToast(res.message || 'Gagal memproses file.', true);
      $('excel-result-area').style.display = 'none';
      return;
    }

    const d = res.data;
    excelPreviewRows = d.rows || [];

    $('excel-summary-chips').innerHTML = `
      <span class="admin-summary-chip excel-summary-chip">Total kejadian terbaca: <b>${d.total}</b></span>
      <span class="admin-summary-chip excel-summary-chip ok">Valid: <b>${d.valid}</b></span>
      <span class="admin-summary-chip excel-summary-chip ${d.invalid ? 'err' : ''}">Tidak valid: <b>${d.invalid}</b></span>
    `;

    const previewRows = excelPreviewRows.slice(0, 25);
    const cols = ['waktu_kejadian', 'kategori', 'kategori_kejadian', 'jenis_kecelakaan', 'latitude_lkk', 'longitude_lkk', 'wilayah_mapped', 'pob', 's_org', 'md_org', 'h_org'];
    const theadEl = document.querySelector('#excel-preview-table thead');
    const tbodyEl = document.querySelector('#excel-preview-table tbody');
    theadEl.innerHTML = '<tr>' + ['#', 'Sheet', 'Status'].concat(cols).map(c => `<th>${c}</th>`).join('') + '</tr>';
    tbodyEl.innerHTML = previewRows.map(r => `
      <tr>
        <td>${r.row}</td>
        <td>${r.sheet || '-'} ${r.source_row ? `(baris ${r.source_row})` : ''}</td>
        <td>${r.errors.length ? '<span class="admin-status-pill" style="color:#FF9086; background:rgba(255,90,74,.14);">Invalid</span>' : '<span class="admin-status-pill admin-status-dilaksanakan">Valid</span>'}</td>
        ${cols.map(c => `<td>${(r.payload[c] != null && r.payload[c] !== '') ? r.payload[c] : '-'}</td>`).join('')}
      </tr>`).join('') || '<tr><td colspan="' + (cols.length + 3) + '" class="admin-empty-hint">Tidak ada baris.</td></tr>';

    const invalidResults = excelPreviewRows.filter(r => r.errors.length);
    if (invalidResults.length){
      $('excel-error-box').style.display = 'block';
      $('excel-error-box').innerHTML = '<b>Baris tidak valid (maks. 25 ditampilkan, koreksi manual lewat tab "Input Manual"):</b><br>' +
        invalidResults.slice(0, 25).map(r => `&bull; ${r.sheet || 'Sheet ?'} baris ${r.source_row || '?'} (kejadian #${r.row}): ${r.errors.join(' ')}`).join('<br>');
    } else {
      $('excel-error-box').style.display = 'none';
    }

    $('excel-result-area').style.display = 'block';
    $('excel-import-btn').style.display = d.valid ? 'inline-block' : 'none';
    $('excel-import-result').style.display = 'none';
  } catch (err) {
    showAdminToast('Gagal memproses file: ' + err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Proses & Validasi';
  }
}

async function onImportExcelRows(){
  const validRows = excelPreviewRows.filter(r => !r.errors.length).map(r => r.payload);
  if (!validRows.length){ showAdminToast('Tidak ada baris valid untuk diimpor.', true); return; }
  if (!confirm(`Impor ${validRows.length} baris data ke database?`)) return;
  const btn = $('excel-import-btn');
  btn.disabled = true; btn.textContent = 'Mengimpor...';
  try {
    const res = await Api.adminOperasiBulkImport(validRows);
    if (!res.success){ showAdminToast(res.message || 'Gagal mengimpor data.', true); return; }
    const d = res.data;
    $('excel-import-result').style.display = 'block';
    $('excel-import-result').innerHTML = `
      <div class="alert-card" style="border-left-color:var(--safe);">
        <div>
          <div class="tag" style="color:var(--safe);">Impor Selesai</div>
          <div class="txt">${d.berhasil} dari ${d.total} baris berhasil disimpan.${d.gagal ? ` ${d.gagal} baris gagal (lihat detail di konsol browser).` : ''}</div>
        </div>
      </div>`;
    if (d.gagal) console.warn('Baris gagal impor:', d.detail_gagal);
    showAdminToast(`Impor selesai: ${d.berhasil} berhasil, ${d.gagal} gagal.`);
    $('excel-import-btn').style.display = 'none';
    await renderAdminOpsTable();
    await refreshYearsAvailable();
    if (state.page === 'beranda') render();
  } catch (err) {
    showAdminToast(err.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Impor ke Database';
  }
}


/* ================= FULLSCREEN MAP (generik: peta / jaraktemu) ================= */
let fsMapKind = null; // 'peta' atau 'jaraktemu'

function clearFsMapLayers(){
  const entry = _leafletMaps['mf-map-wrap'];
  if (!entry) return;
  entry.markersLayer.clearLayers();
  ['heatLayer','bufferLinesLayer','jtLinesLayer'].forEach(k=>{
    if (entry[k]){ entry.map.removeLayer(entry[k]); entry[k] = null; }
  });
  const wrap = $('mf-map-wrap');
  const oldEmpty = wrap.querySelector('.jt-empty-overlay'); if (oldEmpty) oldEmpty.remove();
}

async function openMapFullscreen(kind){
  fsMapKind = kind;
  $('map-fullscreen-overlay').classList.add('open');
  const mfPanel = $('mf-year-filter-inline');

  if (kind === 'peta'){
    $('mf-title-text').textContent = 'Peta Sebaran Kejadian SAR';
    if (mfPanel) mfPanel.style.display = '';
    const yearSel = $('mf-year-select');
    const allOpt = `<option value="all" ${state.year===null?'selected':''}>Semua Tahun</option>`;
    yearSel.innerHTML = allOpt + YEARS_AVAILABLE.map(y=>`<option value="${y}" ${y===state.year?'selected':''}>${formatTahunLabel(y)}</option>`).join('');
    await renderFsPeta(state.year);
  } else if (kind === 'jaraktemu'){
    $('mf-title-text').textContent = 'Peta Jarak Temu';
    if (mfPanel) mfPanel.style.display = 'none';
    await renderFsJarakTemu();
  }
}
function closeMapFullscreen(){ $('map-fullscreen-overlay').classList.remove('open'); }

async function onMfYearChange(sel){
  if (fsMapKind === 'peta') {
    const val = sel.value === 'all' ? null : parseInt(sel.value, 10);
    await renderFsPeta(val);
  }
}

async function renderFsPeta(year){
  clearFsMapLayers();
  const f = getActiveFilters(); f.tahun = year != null ? [year] : [];
  const res = await Api.operasi(f);
  renderIncidentMapLeaflet('mf-map-wrap', res.data, {legend: false});
  $('mf-legend').innerHTML = `<div class="row" style="color:var(--text-mid); margin-bottom:6px; font-weight:700;">Total ${res.data.length} operasi (tahun ${formatTahunLabel(year)})</div>` +
    CATS.map(c=>`<div class="row"><span class="sw" style="background:${c.color}"></span>${c.label}</div>`).join('');
}

async function renderFsJarakTemu(){
  clearFsMapLayers();
  const f = getActiveFilters();
  const res = await Api.operasi(f);
  renderMapJarakTemuLeaflet('mf-map-wrap', res.data);
  const wrap = $('mf-map-wrap');
  const legend = wrap.querySelector('.map-legend');
  if (legend){ $('mf-legend').innerHTML = legend.innerHTML; legend.remove(); }
  const note = wrap.querySelector('.map-note');
  if (note) note.remove();
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', initSidebarToggle);
document.addEventListener('DOMContentLoaded', bootstrap);