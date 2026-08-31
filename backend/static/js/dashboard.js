/* =====================================================================
   SAR Dashboard — frontend logic
   Semua data numerik berasal dari API backend Flask (lihat js/api.js).
   Peta memakai transformasi affine sederhana (lat/lon asli -> persen
   kanvas 800x400) yang dikalibrasi dari koordinat referensi 8 Pos/Unit
   Siaga -- peta tetap skematik/ilustratif, bukan proyeksi presisi.
   ===================================================================== */

const MONTHS_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const CAT_COLORS = ['#FFE066','#FFB020','#FF7A1A','#D6480F','#7A2E0E'];
const KATEGORI_LABEL_OVERRIDES = {
  'BENCANA': 'Bencana',
  'KECELAKAAN DGN PENANGANAN KHUSUS': 'Kecelakaan dengan Penanganan Khusus',
  'KECELAKAAN KAPAL': 'Kecelakaan Kapal',
  'KECELAKAAN PESAWAT UDARA': 'Kecelakaan Pesawat Udara',
  'KONDISI YANG MEMBAHAYAKAN JIWA MANUSIA': 'Kondisi yang Membahayakan Jiwa Manusia',
};
function toDisplayKategoriLabel(raw){
  if (!raw) return raw;
  if (KATEGORI_LABEL_OVERRIDES[raw]) return KATEGORI_LABEL_OVERRIDES[raw];
  return String(raw).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function $(id){ return document.getElementById(id); }

/* Tahun kalender berjalan belum tentu punya data 12 bulan penuh -- tandai dengan
   asterisk di semua tempat yang menampilkan tahun sebagai teks ke user (BUKAN untuk
   logika filter/kalkulasi, hanya tampilan). */
function isPartialYear(year){
  return year === new Date().getFullYear();
}
function formatTahunLabel(year){
  if (year == null) return 'Semua Tahun';
  return isPartialYear(year) ? year + '*' : String(year);
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
let auth = { isLoggedIn:false, username:null, nama_lengkap:null };
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

async function doExport(fmt){
  $('export-panel').classList.remove('open');
  try {
    if (fmt === 'csv') await exportCSV();
    else if (fmt === 'xlsx') await exportXLSX();
    else if (fmt === 'image') await exportImage();
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
    auth = { isLoggedIn:true, username: res.data.username, nama_lengkap: res.data.nama_lengkap };
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
  auth = { isLoggedIn:false, username:null, nama_lengkap:null };
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
      auth = { isLoggedIn:true, username: res.data.username, nama_lengkap: res.data.nama_lengkap };
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

/* Peta Jarak Temu: kolom jarak_dari_lkk_km TIDAK ADA di kejadian_sar (kolom 'jarak'
   sengaja diabaikan sesuai keputusan sebelumnya). Garis LKK -> lokasi ditemukan tetap
   digambar dari koordinat yang tersedia, tapi label jarak dihilangkan karena nilainya
   tidak ada di skema saat ini. */
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

  const linesLayer = L.layerGroup().addTo(entry.incidentLayer);
  entry.jtLinesLayer = linesLayer;
  rows.forEach(o=>{
    const from = [o.lokasi_kejadian_lat, o.lokasi_kejadian_lon];
    const to = [o.lokasi_ditemukan_lat, o.lokasi_ditemukan_lon];
    const label = o.lokasi_kejadian_deskripsi || o.wilayah_mapped || 'Operasi #'+o.id_operasi;
    L.polyline([from, to], { color:'#FFC98A', weight:1.4, opacity:.55, dashArray:'5,4' })
      .bindTooltip(`${label}`, { direction:'top', sticky:false, className:'sar-pos-tooltip' })
      .addTo(linesLayer);
    L.circleMarker(from, { radius:5, color:'#0A0605', weight:1, fillColor:'#FF5A4A', fillOpacity:.9 }).addTo(linesLayer);
    L.circleMarker(to, { radius:5, color:'#0A0605', weight:1, fillColor:'#5FBE7A', fillOpacity:.9 }).addTo(linesLayer);
  });

  let legend = wrap.querySelector('.map-legend');
  if (!legend){ legend = document.createElement('div'); legend.className='map-legend'; wrap.appendChild(legend); }
  legend.innerHTML = `
    <div class="row"><span class="sw" style="background:#FF5A4A"></span>LKK / Lokasi Kejadian</div>
    <div class="row"><span class="sw" style="background:#5FBE7A"></span>Lokasi Ditemukan</div>
    <div class="row" style="color:var(--text-faint);">jarak tidak tersedia di data saat ini</div>`;
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

async function bootstrap(){
  try {
    const [, allOps] = await Promise.all([ loadRefData(), Api.operasi({}) ]);
    const years = Array.from(new Set((allOps.data||[]).map(o=>o.tahun))).sort((a,b)=>a-b);
    YEARS_AVAILABLE = years.length ? years : [new Date().getFullYear()];

    // Tahun berjalan (2026 dst) tetap dimunculkan di filter Tahun walau belum ada
    // satupun baris data tercatat -- supaya dashboard bisa dibuka dalam kondisi
    // "kosong" utk tahun berjalan, bukan cuma bisa lihat tahun2 lama yang sudah ada datanya.
    const currentYear = new Date().getFullYear();
    if (!YEARS_AVAILABLE.includes(currentYear)) {
      YEARS_AVAILABLE.push(currentYear);
      YEARS_AVAILABLE.sort((a,b)=>a-b);
    }

    // Default tahun yang ditampilkan saat pertama buka dashboard tetap tahun
    // terakhir yang ADA datanya (bukan otomatis lompat ke tahun berjalan yang
    // masih kosong) -- supaya user tidak disambut dashboard kosong pas pertama buka.
    const latestYearWithData = years.length ? years[years.length - 1] : YEARS_AVAILABLE[YEARS_AVAILABLE.length - 1];
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
  korban:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>',
  ok:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
};
function renderKPI(kpi){
  const allBulan = state.activeMonths.length === 12;
  const yearLbl = formatTahunLabel(state.year);
  const sub = allBulan ? `sepanjang tahun ${yearLbl}` : `${state.activeMonths.length} bulan terpilih, tahun ${yearLbl}`;
  const items = [
    {lbl:'Total Kejadian', val:kpi.total_kejadian, sub, icon:KPI_ICONS.total},
    {lbl:'Korban Ditangani', val:kpi.korban_ditangani, sub:'seluruh kategori terpilih', icon:KPI_ICONS.korban},
    {lbl:'Selamat', val:kpi.selamat, sub:'berhasil diselamatkan', icon:KPI_ICONS.ok},
    {lbl:'Meninggal Dunia', val:kpi.meninggal, sub:'ditemukan tidak selamat', icon:KPI_ICONS.korban},
    {lbl:'Hilang', val:kpi.hilang, sub:'Hilang/Tidak Ditemukan', icon:KPI_ICONS.korban},
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
    base = `Pantau perkembangan kejadian di wilayah ini secara berkala.`;
  } else if (domLabel.includes('Kapal')) {
    base = `Perkuat patroli laut & pelatihan potensi SAR di jalur pelayaran ${z.kab}.`;
  } else if (domLabel.includes('Pesawat')) {
    base = `Koordinasikan kesiapsiagaan bandara & jalur penerbangan setempat.`;
  } else if (domLabel.includes('Bencana')) {
    base = `Tingkatkan kesiapsiagaan bencana & jalur evakuasi di wilayah ${z.kab}.`;
  } else if (domLabel.includes('Membahayakan')) {
    base = `Sinergi dengan Dishub & kepolisian untuk penanganan kondisi membahayakan manusia.`;
  } else {
    base = `Perkuat koordinasi penanganan khusus di wilayah ${z.wilayah}.`;
  }
  const urgency = z.kejadian >= 20 ? ' Prioritas tinggi — pertimbangkan penambahan unit siaga.'
    : z.kejadian >= 10 ? ' Prioritas sedang — evaluasi kesiapan personel & alat.'
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
      <div class="metric"><span class="n">${z.kejadian}</span><div class="bar-bg"><div class="bar-fg" style="width:${Math.round((z.kejadian/maxK)*100)}%"></div></div></div>
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

/* Proyeksi spasial per wilayah -- konsisten dengan logika chart "Estimasi Volume
   Kesiapsiagaan" di renderPrediksi() (baseline musiman + growth rate tahun-ke-tahun),
   tapi dihitung TERPISAH per kelompok wilayah (ZONA_DEF), bukan cuma total gabungan.
   predMonthIdx (dropdown "Periode Prediksi") ikut menentukan bulan mana yang
   diproyeksikan -- sebelumnya nilai ini tidak berpengaruh sama sekali ke peta. */

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

  /* Kategori dominan tetap dihitung dari tahun kalender yang sudah lengkap (bukan tahun
     berjalan yang masih parsial), dipakai di alert-card kesiapsiagaan di bawah. */
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
    <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
    <div>
      <div class="tag">Peringatan Kesiapsiagaan</div>
      <div class="txt">${insightTxt}</div>
    </div>`;
}

/* ================= ADMIN: INPUT DATA OPERASI =================
   Skema kejadian_sar tidak punya tabel relasional korban/instansi/peralatan --
   hanya kolom agregat s_org/md_org/h_org dan teks bebas instansi_jml_person/peralatan.
   Form korban dipertahankan sebagai multi-row per-individu di UI (untuk kemudahan
   input jumlah per status), tapi saat disimpan hanya JUMLAHNYA per status yang
   dikirim ke backend (s_org/md_org/h_org), bukan datanya (nama/usia/dll -- karena
   kolom itu tidak ada di kejadian_sar). Instansi & peralatan diinput sebagai
   ringkasan teks bebas (instansi_jml_person, peralatan), bukan lagi checkbox/dropdown
   dari tabel referensi yang sudah tidak ada. */
function buildAdminSelectOptions(){
  const katEl = $('admin-f-kategori'), klEl = $('admin-f-klasifikasi'), sumberEl = $('admin-f-sumber'), posEl = $('admin-f-pos');
  if (katEl) katEl.innerHTML = CATS.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
  if (klEl) klEl.innerHTML = '<option value="">- Tidak dipilih -</option>' + (REF.klasifikasi||[]).map(k=>`<option value="${k.nilai}">${k.nilai}</option>`).join('');
  if (sumberEl) sumberEl.innerHTML = '<option value="">- Tidak dipilih -</option>' + (REF.sumber||[]).map(s=>`<option value="${s.nilai}">${s.nilai}</option>`).join('');
  if (posEl) posEl.innerHTML = WILAYAH_LIST.map(w=>`<option value="${w.id}">${w.label}</option>`).join('');
  buildPeralatanCheckboxes();
}
function buildPeralatanCheckboxes(){
  // Tabel ref_peralatan sudah tidak ada -- peralatan sekarang kolom teks bebas
  // (lihat #admin-f-peralatan-teks di HTML), grid checkbox lama dinonaktifkan.
  const grid = $('admin-peralatan-grid'); if (!grid) return;
  grid.innerHTML = '<div class="admin-empty-hint">Input peralatan sekarang berupa teks bebas (lihat kolom di atas), bukan checkbox tabel referensi.</div>';
}
/* Status Operasi TIDAK diinput manual -- dihitung otomatis dari kelengkapan
   Waktu Berangkat & Waktu Selesai (mencerminkan kolom status_operasi
   di database), sama seperti "Lokasi Ditemukan" hanya tampil saat keduanya terisi. */
function updateStatusIndicator(){
  const berangkat = $('admin-f-waktu-berangkat').value;
  const selesai = $('admin-f-waktu-selesai').value;
  const dilaksanakan = !!(berangkat && selesai);
  const el = $('admin-status-indicator');
  el.textContent = 'Status akan tercatat sebagai: ' + (dilaksanakan ? 'Dilaksanakan' : 'Tidak Dilaksanakan');
  el.className = 'admin-status-indicator ' + (dilaksanakan ? 'is-dilaksanakan' : 'is-tidak-dilaksanakan');
  $('admin-section-f').style.display = dilaksanakan ? 'block' : 'none';
}

/* ---- Korban: form multi-row per-individu DIPERTAHANKAN di UI untuk kemudahan
   input, tapi backend baru cuma menyimpan agregat s_org/md_org/h_org -- summary
   di bawah dihitung dari baris-baris ini dan itulah yang benar-benar dikirim
   ke server (lihat collectAdminFormPayload). */
let korbanRows = [];
let korbanRowSeq = 0;
function addKorbanRow(data){
  const id = ++korbanRowSeq;
  korbanRows.push({ id, nama:'', jenis_kelamin:'L', usia:'', pekerjaan:'', alamat_desa:'', alamat_kecamatan:'', alamat_kabupaten:'', status:'Selamat', ...(data||{}) });
  renderKorbanRows();
}
function removeKorbanRow(id){
  korbanRows = korbanRows.filter(r=>r.id!==id);
  renderKorbanRows();
}
function updateKorbanField(id, field, value){
  const row = korbanRows.find(r=>r.id===id);
  if (row) row[field] = value;
  if (field === 'status') recomputeKorbanSummary();
}
function recomputeKorbanSummary(){
  const s = {Selamat:0, 'Meninggal Dunia':0, Hilang:0};
  korbanRows.forEach(r=>{ if (s[r.status] !== undefined) s[r.status]++; });
  $('admin-korban-sum-selamat').textContent = s['Selamat'];
  $('admin-korban-sum-meninggal').textContent = s['Meninggal Dunia'];
  $('admin-korban-sum-hilang').textContent = s['Hilang'];
}
function renderKorbanRows(){
  const el = $('admin-korban-list');
  if (!korbanRows.length){ el.innerHTML = '<div class="admin-empty-hint">Belum ada data korban ditambahkan.</div>'; recomputeKorbanSummary(); return; }
  el.innerHTML = korbanRows.map(r=>`
    <div class="admin-multi-row">
      <div class="admin-field" style="flex:1.4;"><label>Nama</label><input class="admin-input" value="${r.nama||''}" oninput="updateKorbanField(${r.id},'nama',this.value)"></div>
      <div class="admin-field" style="flex:.7;"><label>J. Kelamin</label><select class="admin-input" onchange="updateKorbanField(${r.id},'jenis_kelamin',this.value)"><option value="L" ${r.jenis_kelamin==='L'?'selected':''}>L</option><option value="P" ${r.jenis_kelamin==='P'?'selected':''}>P</option></select></div>
      <div class="admin-field" style="flex:.6;"><label>Usia</label><input type="number" min="0" class="admin-input" value="${r.usia||''}" oninput="updateKorbanField(${r.id},'usia',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Pekerjaan</label><input class="admin-input" value="${r.pekerjaan||''}" oninput="updateKorbanField(${r.id},'pekerjaan',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Desa</label><input class="admin-input" value="${r.alamat_desa||''}" oninput="updateKorbanField(${r.id},'alamat_desa',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Kecamatan</label><input class="admin-input" value="${r.alamat_kecamatan||''}" oninput="updateKorbanField(${r.id},'alamat_kecamatan',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Kabupaten</label><input class="admin-input" value="${r.alamat_kabupaten||''}" oninput="updateKorbanField(${r.id},'alamat_kabupaten',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Status</label><select class="admin-input" onchange="updateKorbanField(${r.id},'status',this.value)">
        <option value="Selamat" ${r.status==='Selamat'?'selected':''}>Selamat</option>
        <option value="Meninggal Dunia" ${r.status==='Meninggal Dunia'?'selected':''}>Meninggal Dunia</option>
        <option value="Hilang" ${r.status==='Hilang'?'selected':''}>Hilang</option>
      </select></div>
      <button type="button" class="admin-table-action admin-table-action-danger" onclick="removeKorbanRow(${r.id})">Hapus</button>
    </div>`).join('');
  recomputeKorbanSummary();
}

/* ---- Instansi: input teks bebas (pengganti multi-select tabel referensi yang
   tidak ada lagi). Disimpan sebagai ringkasan string "Nama(jumlah), Nama2(jumlah2)"
   ke kolom instansi_jml_person, sesuai keputusan form terstruktur -> teks ringkasan. */
let instansiRows = [];
let instansiRowSeq = 0;
function addInstansiRow(data){
  const id = ++instansiRowSeq;
  instansiRows.push({ id, nama_instansi:'', jumlah_personel:1, ...(data||{}) });
  renderInstansiRows();
}
function removeInstansiRow(id){ instansiRows = instansiRows.filter(r=>r.id!==id); renderInstansiRows(); }
function updateInstansiField(id, field, value){ const row = instansiRows.find(r=>r.id===id); if (row) row[field] = value; }
function renderInstansiRows(){
  const el = $('admin-instansi-list');
  if (!instansiRows.length){ el.innerHTML = '<div class="admin-empty-hint">Belum ada instansi ditambahkan.</div>'; return; }
  el.innerHTML = instansiRows.map(r=>`
    <div class="admin-multi-row">
      <div class="admin-field" style="flex:2;"><label>Instansi</label><input class="admin-input" value="${r.nama_instansi||''}" oninput="updateInstansiField(${r.id},'nama_instansi',this.value)"></div>
      <div class="admin-field" style="flex:1;"><label>Jumlah Personel</label><input type="number" min="0" class="admin-input" value="${r.jumlah_personel}" oninput="updateInstansiField(${r.id},'jumlah_personel',this.value)"></div>
      <button type="button" class="admin-table-action admin-table-action-danger" onclick="removeInstansiRow(${r.id})">Hapus</button>
    </div>`).join('');
}

/* ---- Mini map picker (Leaflet asli, dengan marker draggable) ---- */
function initAdminMapPicker(){
  const el = $('admin-map-picker'); if (!el) return;
  const entry = getOrCreateLeafletMap('admin-map-picker');
  entry.map.invalidateSize();
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
  $('admin-form-title').textContent = 'Form Operasi Baru';
  $('admin-f-id').value = '';
  $('admin-f-kategori').value = CATS[0] ? CATS[0].id : '';
  $('admin-f-klasifikasi').value = '';
  $('admin-f-objek').value = '';
  $('admin-f-waktu-kejadian').value = '';
  $('admin-f-tgl-lapor').value = '';
  $('admin-f-sumber').value = '';
  $('admin-f-nama-pelapor').value = '';
  $('admin-f-instansi-pelapor').value = '';
  $('admin-f-hp-pelapor').value = '';
  $('admin-f-narasi').value = '';
  $('admin-f-lkk').value = '';
  $('admin-f-lat').value = '';
  $('admin-f-lon').value = '';
  $('admin-f-radial').value = '';
  $('admin-f-pos').value = WILAYAH_LIST[0] ? WILAYAH_LIST[0].id : '';
  $('admin-f-waktu-berangkat').value = '';
  $('admin-f-waktu-tiba').value = '';
  $('admin-f-waktu-selesai').value = '';
  $('admin-f-waktu-siap').value = '';
  $('admin-f-waktu-tempuh').value = '';
  $('admin-f-jarak-laut').value = '';
  $('admin-f-jarak-darat').value = '';
  $('admin-f-pob').value = 0;
  $('admin-f-kendala').value = '';
  $('admin-f-lat-ditemukan').value = '';
  $('admin-f-lon-ditemukan').value = '';
  $('admin-f-lokasi-ditemukan').value = '';
  $('admin-f-jarak-lkk').value = '';
  $('admin-f-biaya').value = '';
  $('admin-f-lain').value = '';
  korbanRows = []; renderKorbanRows();
  instansiRows = []; renderInstansiRows();
  document.querySelectorAll('#admin-peralatan-grid input').forEach(cb=>cb.checked=false);
  $('admin-form-error').style.display = 'none';
  updateStatusIndicator();
  initAdminMapPicker();
}

async function loadAdminOpToForm(id){
  const res = await Api.adminOperasiDetail(id);
  if (!res.success){ showAdminToast(res.message || 'Gagal memuat data operasi.', true); return; }
  const op = res.data;
  editingOpId = id;
  $('admin-form-title').textContent = 'Edit Operasi #' + id;
  $('admin-f-id').value = op.id_operasi;
  $('admin-f-kategori').value = op.nama_kategori || '';
  $('admin-f-klasifikasi').value = op.nama_klasifikasi || '';
  $('admin-f-objek').value = op.lokasi_kejadian_deskripsi || '';
  $('admin-f-waktu-kejadian').value = toLocalInput(op.waktu_kejadian);
  $('admin-f-tgl-lapor').value = toLocalInput(op.waktu_lapor);
  $('admin-f-sumber').value = op.sumber_berita || '';
  $('admin-f-narasi').value = op.narasi_kejadian || '';
  $('admin-f-lkk').value = op.lokasi_kejadian_deskripsi || '';
  $('admin-f-lat').value = op.lokasi_kejadian_lat != null ? op.lokasi_kejadian_lat : '';
  $('admin-f-lon').value = op.lokasi_kejadian_lon != null ? op.lokasi_kejadian_lon : '';
  $('admin-f-pos').value = op.wilayah_mapped || '';
  $('admin-f-waktu-berangkat').value = toLocalInput(op.waktu_berangkat);
  $('admin-f-waktu-tiba').value = toLocalInput(op.waktu_tiba);
  $('admin-f-waktu-siap').value = op.waktu_siap != null ? op.waktu_siap : '';
  $('admin-f-waktu-tempuh').value = op.waktu_tempuh_menit != null ? op.waktu_tempuh_menit : '';
  $('admin-f-pob').value = op.pob != null ? op.pob : 0;
  $('admin-f-waktu-selesai').value = toLocalInput(op.waktu_selesai);
  $('admin-f-lat-ditemukan').value = op.lokasi_ditemukan_lat != null ? op.lokasi_ditemukan_lat : '';
  $('admin-f-lon-ditemukan').value = op.lokasi_ditemukan_lon != null ? op.lokasi_ditemukan_lon : '';
  $('admin-f-lokasi-ditemukan').value = op.lokasi_ditemukan_deskripsi || '';

  // Isi ulang baris korban dari agregat sederhana (jumlah_selamat/meninggal/hilang)
  // sebagai baris tanpa nama -- placeholder sampai form disederhanakan jadi
  // input angka langsung.
  korbanRows = []; korbanRowSeq = 0;
  const jumlahSelamat = op.jumlah_selamat || 0, jumlahMeninggal = op.jumlah_meninggal || 0, jumlahHilang = op.jumlah_hilang || 0;
  for (let i=0;i<jumlahSelamat;i++) addKorbanRow({status:'Selamat'});
  for (let i=0;i<jumlahMeninggal;i++) addKorbanRow({status:'Meninggal Dunia'});
  for (let i=0;i<jumlahHilang;i++) addKorbanRow({status:'Hilang'});
  if (!jumlahSelamat && !jumlahMeninggal && !jumlahHilang) renderKorbanRows();

  instansiRows = []; instansiRowSeq = 0;
  renderInstansiRows();

  $('admin-form-error').style.display = 'none';
  updateStatusIndicator();
  initAdminMapPicker();
  document.querySelector('main.content').scrollTo({top:0, behavior:'smooth'});
}

async function deleteAdminOp(id){
  if (!confirm('Hapus data operasi #' + id + '? Tindakan ini tidak dapat dibatalkan.')) return;
  try {
    const res = await Api.adminOperasiDelete(id);
    if (!res.success){ showAdminToast(res.message || 'Gagal menghapus data.', true); return; }
    showAdminToast('Data operasi berhasil dihapus.');
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
  if (!val('admin-f-kategori')) errors.push('Kategori Kejadian wajib diisi.');
  if (!val('admin-f-waktu-kejadian')) errors.push('Waktu Kejadian wajib diisi.');
  if (!val('admin-f-lkk').trim()) errors.push('Deskripsi Lokasi Kejadian/LKK wajib diisi.');
  const lat = parseFloat(val('admin-f-lat')), lon = parseFloat(val('admin-f-lon'));
  if (val('admin-f-lat') === '' || isNaN(lat)) errors.push('Latitude wajib diisi.');
  else if (lat < -90 || lat > 90) errors.push('Koordinat tidak valid (Latitude harus -90 s.d. 90).');
  if (val('admin-f-lon') === '' || isNaN(lon)) errors.push('Longitude wajib diisi.');
  else if (lon < -180 || lon > 180) errors.push('Koordinat tidak valid (Longitude harus -180 s.d. 180).');
  if (!val('admin-f-pos')) errors.push('Wilayah wajib diisi.');

  const pob = parseInt(val('admin-f-pob') || '0', 10);
  const s = {Selamat:0, 'Meninggal Dunia':0, Hilang:0};
  korbanRows.forEach(r=>{ if (s[r.status] !== undefined) s[r.status]++; });
  const total = s['Selamat'] + s['Meninggal Dunia'] + s['Hilang'];
  if (pob && total > pob) errors.push('Jumlah korban (Selamat + Meninggal Dunia + Hilang) tidak boleh melebihi POB.');

  const waktuBerangkat = val('admin-f-waktu-berangkat');
  const waktuSelesai = val('admin-f-waktu-selesai');
  if (waktuSelesai && !waktuBerangkat) errors.push('Waktu Berangkat wajib diisi jika Waktu Selesai sudah diisi.');
  if (waktuBerangkat && waktuSelesai && new Date(waktuSelesai) < new Date(waktuBerangkat)) errors.push('Waktu Selesai tidak boleh lebih awal dari Waktu Berangkat.');

  const kejadianDT = val('admin-f-waktu-kejadian') ? new Date(val('admin-f-waktu-kejadian')) : null;
  if (kejadianDT && waktuSelesai && new Date(waktuSelesai) < kejadianDT) errors.push('Waktu Selesai tidak boleh lebih awal dari Waktu Kejadian.');
  const tglLapor = val('admin-f-tgl-lapor');
  if (kejadianDT && tglLapor && new Date(tglLapor) < kejadianDT) errors.push('Waktu Laporan tidak boleh lebih awal dari Waktu Kejadian.');

  return errors;
}

function collectAdminFormPayload(){
  const val = id => $(id).value;
  const num = (id) => val(id) === '' ? null : Number(val(id));
  const intVal = (id) => val(id) === '' ? null : parseInt(val(id), 10);
  const dt = (id) => val(id) ? val(id).replace('T',' ') + ':00' : null;

  const s = {Selamat:0, 'Meninggal Dunia':0, Hilang:0};
  korbanRows.forEach(r=>{ if (s[r.status] !== undefined) s[r.status]++; });

  // Ringkasan teks instansi, format "Nama(jumlah), Nama2(jumlah2)" -- sesuai
  // pola yang sudah ada di data historis kejadian_sar.
  const instansiRingkasan = instansiRows
    .filter(r=>r.nama_instansi && r.nama_instansi.trim())
    .map(r=>`${r.nama_instansi.trim()}(${parseInt(r.jumlah_personel||0,10)})`)
    .join(', ');

  return {
    waktu_kejadian: dt('admin-f-waktu-kejadian'),
    kategori: val('admin-f-kategori') || null,
    kategori_kejadian: val('admin-f-klasifikasi') || null,
    posisi_koordinat_area: val('admin-f-lkk') || null,
    jenis_kecelakaan: val('admin-f-narasi') || null,
    latitude_lkk: num('admin-f-lat'),
    longitude_lkk: num('admin-f-lon'),
    wilayah_mapped: val('admin-f-pos') || null,
    sumber_berita: val('admin-f-sumber') || null,
    waktu_lapor: dt('admin-f-tgl-lapor'),
    waktu_berangkat: dt('admin-f-waktu-berangkat'),
    waktu_tiba: dt('admin-f-waktu-tiba'),
    waktu_selesai: dt('admin-f-waktu-selesai'),
    waktu_siap: num('admin-f-waktu-siap'),
    waktu_tempuh_menit: num('admin-f-waktu-tempuh'),
    pob: intVal('admin-f-pob'),
    s_org: s['Selamat'],
    md_org: s['Meninggal Dunia'],
    h_org: s['Hilang'],
    lokasi_ditemukan: val('admin-f-lokasi-ditemukan') || null,
    latitude_ditemukan: num('admin-f-lat-ditemukan'),
    longitude_ditemukan: num('admin-f-lon-ditemukan'),
    instansi_jml_person: instansiRingkasan || null,
  };
}

function onSubmitAdminForm(){
  const errors = validateAdminForm();
  const errBox = $('admin-form-error');
  if (errors.length){
    errBox.style.display = 'block';
    errBox.innerHTML = errors.map(e=>`<div>&bull; ${e}</div>`).join('');
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
    showAdminToast('Data operasi berhasil disimpan.');
    resetAdminForm();
    await renderAdminOpsTable();
    if (YEARS_AVAILABLE.length === 0 || !YEARS_AVAILABLE.includes(state.year)) {
      const allOps = await Api.operasi({});
      YEARS_AVAILABLE = Array.from(new Set(allOps.data.map(o=>o.tahun))).sort((a,b)=>a-b);
      buildTahunPanel();
    }
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
  setTimeout(()=> t.classList.remove('show'), 3200);
}

async function renderAdminOpsTable(){
  const tbody = $('admin-ops-tbody'); if (!tbody) return;
  if (!auth.isLoggedIn){ tbody.innerHTML = '<tr><td colspan="6" class="admin-empty-hint">Login sebagai admin untuk melihat data.</td></tr>'; return; }
  tbody.innerHTML = '<tr><td colspan="6" class="admin-loading">Memuat...</td></tr>';
  try {
    const res = await Api.adminOperasiList();
    const rows = res.data || [];
    const fmtDate = s => { if (!s) return '-'; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}); };
    tbody.innerHTML = rows.map(o=>`
      <tr>
        <td>#${o.id_operasi}</td>
        <td>${fmtDate(o.waktu_kejadian)}</td>
        <td>${o.nama_kategori || '-'}</td>
        <td>${o.lokasi_kejadian_deskripsi || '-'}</td>
        <td><span class="admin-status-pill admin-status-${(o.status_operasi||'').replace(/\s+/g,'-').toLowerCase()}">${o.status_operasi||'-'}</span></td>
        <td>
          <button class="admin-table-action" onclick="loadAdminOpToForm(${o.id_operasi})">Edit</button>
          <button class="admin-table-action admin-table-action-danger" onclick="deleteAdminOp(${o.id_operasi})">Hapus</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" class="admin-empty-hint">Belum ada data operasi.</td></tr>';
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty-hint" style="color:#FF9086;">Gagal memuat data: ${err.message}</td></tr>`;
  }
}
async function renderAdminInputPage(){
  if (!$('admin-f-id').value && !editingOpId && korbanRows.length === 0 && instansiRows.length === 0){
    resetAdminForm();
  }
  renderAdminOpsTable();
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
document.addEventListener('DOMContentLoaded', bootstrap);