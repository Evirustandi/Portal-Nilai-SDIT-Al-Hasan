// ============================================================
// firebase-admin.js — CMS Admin SDIT Al-Hasan + Firebase
// Menggantikan seluruh sistem localStorage dengan Firestore
// ============================================================

import { initializeApp }          from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
                                   from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection, doc,
  addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────────────────
// ✏️ GANTI DENGAN CONFIG FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBc6Xx8f2Y0NsZ3eMphEzadbDP4K4rFt1w",
  authDomain: "sdital-hasan.firebaseapp.com",
  projectId: "sdital-hasan",
  storageBucket: "sdital-hasan.firebasestorage.app",
  messagingSenderId: "499840534324",
  appId: "1:499840534324:web:78b53daa11443fc258c761",
  measurementId: "G-81YC02102W"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── GLOBAL STATE ──────────────────────────────────────────
let ME           = null;
let DATA_NILAI   = [];
let unsubscribes = [];   // simpan listener agar bisa di-unsubscribe

const MAPEL = [
  'Pendidikan Agama Islam', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Matematika', 'Ilmu Pengetahuan Alam (IPA)', 'Ilmu Pengetahuan Sosial (IPS)',
  'Seni Budaya & Prakarya', 'Pendidikan Jasmani, Olahraga & Kesehatan',
  'Bahasa Inggris', 'Bahasa Sunda', 'Pendidikan Al-Quran'
];

// ── HELPERS UI ────────────────────────────────────────────
function UID()  { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function EH(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function OK(m)  {
  const n = document.createElement('div');
  n.className = 'fixed top-5 right-5 z-50 bg-green-100 text-green-800 border border-green-300 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade';
  n.textContent = m; document.body.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}
function ERR(m) {
  const n = document.createElement('div');
  n.className = 'fixed top-5 right-5 z-50 bg-red-100 text-red-800 border border-red-300 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade';
  n.textContent = m; document.body.appendChild(n);
  setTimeout(() => n.remove(), 4000);
}
window.closeForm = function(id)  {
  const el = document.getElementById(id);
  if (el) { el.innerHTML = ''; el.style.display = 'none'; }
};
window.openForm = function(id)   { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

// ── AUTH FIREBASE ─────────────────────────────────────────
// Login menggunakan Firebase Authentication (Email/Password)
// Email user disimpan di Firestore collection "users" dengan field: email, role, nama, aktif
// Di Firebase Console → Authentication → Add User untuk membuat akun

window.doLogin = async function() {
  const email = document.getElementById('l-user').value.trim();
  const pass  = document.getElementById('l-pass').value;
  if (!email || !pass) return;

  try {
    // Coba login dengan email langsung
    // Jika username bukan email, tambahkan domain default
    const emailToUse = email.includes('@') ? email : email + '@sdit-alhasan.sch.id';
    await signInWithEmailAndPassword(auth, emailToUse, pass);
    // onAuthStateChanged akan handle sisanya
  } catch (e) {
    document.getElementById('login-err')?.classList.remove('hidden');
    console.error('Login error:', e.code);
  }
};

window.doLogout = async function() {
  unsubscribes.forEach(u => u());
  unsubscribes = [];
  await signOut(auth);
};

// Pantau status login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Ambil data profil dari Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().aktif !== false) {
      ME = { uid: user.uid, email: user.email, ...userDoc.data() };
      startApp();
    } else {
      // User tidak ada di Firestore atau dinonaktifkan
      await signOut(auth);
      ERR('Akun Anda tidak aktif atau tidak terdaftar.');
    }
  } else {
    // Belum login — tampilkan login screen
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app')?.classList.add('hidden');
    ME = null;
  }
});

function startApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app')?.classList.remove('hidden');

  // Update UI sidebar
  const isAdmin = ME?.role === 'admin';
  document.getElementById('sb-av').textContent   = (ME?.nama || 'A')[0].toUpperCase();
  document.getElementById('sb-name').textContent = ME?.nama || 'Admin';
  document.getElementById('sb-role').textContent = isAdmin ? 'Administrator' : 'Guru';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  // Load semua data dengan realtime listener
  setupListeners();
  P(isAdmin ? 'beranda' : 'nilai');
}

// ── REALTIME LISTENERS (onSnapshot) ──────────────────────
// Data otomatis terupdate di semua tab/device tanpa refresh

function setupListeners() {
  // Bersihkan listener lama
  unsubscribes.forEach(u => u());
  unsubscribes = [];

  const collections = ['berita', 'galeri', 'guru', 'program', 'spmb'];

  collections.forEach(col => {
    const q = query(collection(db, col), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      window['CMS_' + col.toUpperCase()] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Re-render halaman yang sedang aktif
      const activePage = document.querySelector('.page-view.active')?.id?.replace('page-', '');
      if (activePage === col) renderPage(col);
      if (activePage === 'beranda') renderStat();
    }, err => console.error('Listener error:', col, err));
    unsubscribes.push(unsub);
  });

  // Listener untuk siswa/nilai
  const siswaUnsub = onSnapshot(collection(db, 'siswa'), (snap) => {
    DATA_NILAI = snap.docs.map(d => ({ nisn: d.id, ...d.data() }));
    window.DATA_NILAI = DATA_NILAI;
    const activePage = document.querySelector('.page-view.active')?.id?.replace('page-', '');
    if (activePage === 'nilai') loadNilaiDropdown();
    if (activePage === 'beranda') renderStat();
  }, err => console.error('Listener error: siswa', err));
  unsubscribes.push(siswaUnsub);
}

// ── NAVIGASI ──────────────────────────────────────────────
window.P = function(page) {
  const adminPages = ['berita', 'galeri', 'guru', 'program', 'spmb', 'users', 'export'];
  if (ME?.role !== 'admin' && adminPages.includes(page)) {
    ERR('Akses ditolak untuk akun Guru.'); return;
  }

  // Sembunyikan semua halaman dengan menghapus class 'active', bukan pakai 'hidden'
  // karena Tailwind .hidden pakai !important yang mengalahkan CSS custom .page-view.active
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  // Perbaiki selector: nav-btn (bukan nav-item)
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  // Tambahkan highlight ke tombol nav yang sesuai (data-target, bukan data-page)
  document.querySelectorAll(`.nav-btn[data-target="${page}"]`).forEach(el => el.classList.add('active'));

  renderPage(page);
};

function renderPage(page) {
  switch(page) {
    case 'beranda'  : renderStat();          break;
    case 'berita'   : renderBerita();        break;
    case 'galeri'   : renderGaleri();        break;
    case 'guru'     : renderGuru();          break;
    case 'program'  : renderProgram();       break;
    case 'spmb'     : renderSpmb();          break;
    case 'nilai'    : loadNilaiDropdown();   break;
    case 'users'    : renderUsers();         break;
  }
}

// ── STAT BERANDA ──────────────────────────────────────────
function renderStat() {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('s-berita',  (window.CMS_BERITA  || []).length);
  setEl('s-galeri',  (window.CMS_GALERI  || []).length);
  setEl('s-guru',    (window.CMS_GURU    || []).length);
  setEl('s-program', (window.CMS_PROGRAM || []).length);
  setEl('s-spmb',    (window.CMS_SPMB    || []).length);
  setEl('s-siswa',   DATA_NILAI.length);

  // Preview berita terbaru di beranda
  const el = document.getElementById('preview-berita');
  if (!el) return;
  const data = (window.CMS_BERITA || []).slice(0, 3);
  if (!data.length) { el.innerHTML = '<div class="text-center text-gray-400 py-8">Belum ada berita.</div>'; return; }
  el.innerHTML = '<table class="w-full text-sm"><thead><tr class="text-left text-xs text-gray-400 uppercase">' +
    '<th class="pb-2">Judul</th><th class="pb-2">Tanggal</th><th class="pb-2">Kategori</th></tr></thead><tbody>' +
    data.map(b => `<tr class="border-t border-gray-100">
      <td class="py-2">${b.judul}</td>
      <td class="py-2 text-gray-400">${b.tgl||''}</td>
      <td class="py-2"><span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">${b.kategori||''}</span></td>
    </tr>`).join('') + '</tbody></table>';
}

// ══════════════════════════════════════════════════════════
// BERITA — Firestore CRUD
// ══════════════════════════════════════════════════════════
window.formBerita = function(id) {
  const item = id ? (window.CMS_BERITA||[]).find(x => x.id === id) : null;
  const cats  = ['Pengumuman','Prestasi','Penting','Kegiatan'];
  const emojis= ['📋','🏆','📝','📣','🎉','📚','🌟','⚠️'];
  const el = document.getElementById('form-berita-area');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
      <h4 class="text-sm font-bold text-navy-900 mb-4">${id?'Edit':'Tambah'} Berita</h4>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Judul</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-navy-500" id="bf-j" value="${item?.judul||''}" placeholder="Judul berita"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
          <input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-navy-500" id="bf-t" value="${item?.tgl||new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Kategori</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="bf-k">
            ${cats.map(c=>`<option${item?.kategori===c?' selected':''}>${c}</option>`).join('')}
          </select></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Emoji</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="bf-e">
            ${emojis.map(e=>`<option value="${e}"${item?.emoji===e?' selected':''}>${e}</option>`).join('')}
          </select></div>
      </div>
      <div class="mb-4"><label class="block text-xs font-semibold text-gray-500 mb-1">Isi / Deskripsi</label>
        <textarea class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none min-h-20 resize-y" id="bf-i">${item?.isi||''}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">URL Gambar (opsional)</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="bf-img" value="${item?.imageUrl||''}" placeholder="https://...jpg / png">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">URL File (opsional)</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="bf-file" value="${item?.fileUrl||''}" placeholder="https://...pdf / dokumen">
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="saveBerita('${id||''}')" class="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">${id?'Simpan Perubahan':'Simpan'}</button>
        <button onclick="closeForm('form-berita-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
      </div>
    </div>`;
};

window.saveBerita = async function(id) {
  const judul = document.getElementById('bf-j')?.value.trim();
  if (!judul) { ERR('Judul wajib diisi!'); return; }
  const isi = document.getElementById('bf-i').value;
  const data = {
    judul, tgl: document.getElementById('bf-t').value,
    kategori: document.getElementById('bf-k').value,
    emoji: document.getElementById('bf-e').value,
    isi,
    ringkasan: isi.substring(0, 160),
    imageUrl: document.getElementById('bf-img')?.value.trim() || '',
    fileUrl: document.getElementById('bf-file')?.value.trim() || '',
    updatedAt: serverTimestamp()
  };
  try {
    if (id) {
      await updateDoc(doc(db, 'berita', id), data);
    } else {
      await addDoc(collection(db, 'berita'), { ...data, createdAt: serverTimestamp() });
    }
    closeForm('form-berita-area');
    OK('Berita disimpan!');
  } catch(e) { ERR('Gagal menyimpan: ' + e.message); }
};

window.delBerita = async function(id) {
  if (!confirm('Hapus berita ini?')) return;
  try { await deleteDoc(doc(db, 'berita', id)); OK('Berita dihapus.'); }
  catch(e) { ERR('Gagal menghapus.'); }
};

function renderBerita() {
  const el = document.getElementById('tbl-berita-body');
  if (!el) return;
  const data = window.CMS_BERITA || [];
  if (!data.length) { el.innerHTML = '<tr><td colspan="6" class="text-center text-gray-400 py-10">Belum ada berita. Klik + Tambah Berita.</td></tr>'; return; }
  el.innerHTML = data.map((b, i) => `<tr>
    <td>${i+1}</td>
    <td><span class="text-xl mr-2">${EH(b.emoji||'📋')}</span><span class="font-medium text-navy-900">${EH(b.judul||'')}</span><div class="text-xs text-gray-400 mt-0.5">${EH((b.isi||'').substring(0,60))}...</div></td>
    <td><span class="badge badge-blue">${EH(b.kategori||'')}</span></td>
    <td class="text-gray-400">${EH(b.tgl||'')}</td>
    <td><span class="badge badge-green">Aktif</span></td>
    <td class="text-right"><div class="flex gap-2 justify-end">
      <button onclick="formBerita('${b.id}')" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">Edit</button>
      <button onclick="delBerita('${b.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Hapus</button>
    </div></td></tr>`).join('');
}

// ══════════════════════════════════════════════════════════
// GALERI — Firestore CRUD
// ══════════════════════════════════════════════════════════
window.formGaleri = function(id) {
  const item = id ? (window.CMS_GALERI||[]).find(x => x.id === id) : null;
  const el = document.getElementById('form-galeri-area');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
      <h4 class="text-sm font-bold text-navy-900 mb-4">${id?'Edit':'Tambah'} Foto Galeri</h4>
      <div class="mb-3"><label class="block text-xs font-semibold text-gray-500 mb-1">Keterangan Foto</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gf-c" value="${item?.caption||''}" placeholder="Keterangan foto kegiatan"></div>
      <div class="mb-3"><label class="block text-xs font-semibold text-gray-500 mb-1">URL / Path Foto</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gf-u" value="${item?.url||''}" placeholder="foto/upacara.jpg atau https://..."
          oninput="const p=document.getElementById('gf-p');if(this.value){p.src=fixGDriveUrl(this.value);p.classList.remove('hidden');}else p.classList.add('hidden')">
      </div>
      <img id="gf-p" src="${item?fixGDriveUrl(item.url||''):''}" class="${item?'':'hidden'} w-full max-h-40 object-cover rounded-xl mb-3" onerror="this.classList.add('hidden')">
      <div class="flex gap-2">
        <button onclick="saveGaleri('${id||''}')" class="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">${id?'Simpan':'Simpan'}</button>
        <button onclick="closeForm('form-galeri-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
      </div>
    </div>`;
};

window.saveGaleri = async function(id) {
  const url = document.getElementById('gf-u')?.value.trim();
  const cap = document.getElementById('gf-c')?.value.trim();
  if (!url || !cap) { ERR('URL dan keterangan wajib!'); return; }
  const data = { url, caption: cap, updatedAt: serverTimestamp() };
  try {
    if (id) { await updateDoc(doc(db, 'galeri', id), data); }
    else { await addDoc(collection(db, 'galeri'), { ...data, createdAt: serverTimestamp() }); }
    closeForm('form-galeri-area'); OK('Foto disimpan!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

window.delGaleri = async function(id) {
  if (!confirm('Hapus foto?')) return;
  try { await deleteDoc(doc(db, 'galeri', id)); OK('Foto dihapus.'); }
  catch(e) { ERR('Gagal menghapus.'); }
};

function renderGaleri() {
  const el = document.getElementById('grid-galeri');
  if (!el) return;
  const data = window.CMS_GALERI || [];
  if (!data.length) { el.innerHTML = '<div class="col-span-4 text-center text-gray-400 py-10">Belum ada foto galeri.</div>'; return; }
  el.innerHTML = data.map(g => `
    <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition group">
      <div class="relative h-40 bg-gray-100 overflow-hidden">
        <img src="${fixGDriveUrl(g.url)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.style.background='#f3f4f6'">
      </div>
      <div class="p-3">
        <p class="text-sm font-medium text-navy-900 truncate mb-2">${EH(g.caption||'')}</p>
        <div class="flex gap-2">
          <button onclick="formGaleri('${g.id}')" class="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">Edit</button>
          <button onclick="delGaleri('${g.id}')" class="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Hapus</button>
        </div>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// GURU — Firestore CRUD
// ══════════════════════════════════════════════════════════
window.formGuru = function(id) {
  const item = id ? (window.CMS_GURU||[]).find(x => x.id === id) : null;
  const el = document.getElementById('form-guru-area');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
      <h4 class="text-sm font-bold text-navy-900 mb-4">${id?'Edit':'Tambah'} Guru / Staf</h4>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gg-n" value="${item?.nama||''}" placeholder="Nama + gelar"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Jabatan</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gg-j" value="${item?.jabatan||''}" placeholder="Kepala Sekolah, Guru Kelas..."></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Inisial Avatar</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gg-i" value="${item?.inisial||''}" placeholder="RS" maxlength="3"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gg-s">
            ${['Aktif','Cuti','Tidak Aktif'].map(s=>`<option${item?.status===s?' selected':''}>${s}</option>`).join('')}
          </select></div>
      </div>
      <div class="mb-4"><label class="block text-xs font-semibold text-gray-500 mb-1">Bidang Studi (opsional)</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="gg-m" value="${item?.mapel||''}" placeholder="Matematika, B. Indonesia, dll"></div>
      <div class="flex gap-2">
        <button onclick="saveGuru('${id||''}')" class="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">${id?'Simpan':'Simpan'}</button>
        <button onclick="closeForm('form-guru-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
      </div>
    </div>`;
};

window.saveGuru = async function(id) {
  const n = document.getElementById('gg-n')?.value.trim();
  const j = document.getElementById('gg-j')?.value.trim();
  if (!n || !j) { ERR('Nama dan jabatan wajib!'); return; }
  const ini = document.getElementById('gg-i').value.trim() || n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const data = { nama:n, jabatan:j, inisial:ini, status:document.getElementById('gg-s').value, mapel:document.getElementById('gg-m').value, updatedAt:serverTimestamp() };
  try {
    if (id) { await updateDoc(doc(db, 'guru', id), data); }
    else { await addDoc(collection(db, 'guru'), { ...data, createdAt:serverTimestamp() }); }
    closeForm('form-guru-area'); OK('Data guru disimpan!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

window.delGuru = async function(id) {
  if (!confirm('Hapus data guru?')) return;
  try { await deleteDoc(doc(db, 'guru', id)); OK('Data guru dihapus.'); }
  catch(e) { ERR('Gagal menghapus.'); }
};

function renderGuru() {
  const el = document.getElementById('grid-guru');
  if (!el) return;
  const data = window.CMS_GURU || [];
  if (!data.length) { el.innerHTML = '<div class="col-span-4 text-center text-gray-400 py-10">Belum ada data guru.</div>'; return; }
  const badge = s => s==='Aktif'?'bg-green-100 text-green-700':s==='Cuti'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700';
  el.innerHTML = data.map(g => `
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center hover:shadow-md transition">
      <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-extrabold text-navy-900 mb-3">${EH(g.inisial||'?')}</div>
      <h3 class="font-bold text-navy-900 text-sm leading-tight">${EH(g.nama||'')}</h3>
      <p class="text-xs text-gray-400 mt-1 mb-1">${EH(g.jabatan||'')}</p>
      <p class="text-xs text-gray-400 mb-3">${EH(g.mapel||'')}</p>
      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badge(g.status)}">${EH(g.status||'')}</span>
      <div class="flex gap-2 mt-4 w-full">
        <button onclick="formGuru('${g.id}')" class="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">Edit</button>
        <button onclick="delGuru('${g.id}')" class="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Hapus</button>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// PROGRAM — Firestore CRUD
// ══════════════════════════════════════════════════════════
window.formProgram = function(id) {
  const item = id ? (window.CMS_PROGRAM||[]).find(x => x.id === id) : null;
  const selectedIkon = item?.ikon || item?.emoji || '📚';
  const selectedDesc = item?.deskripsi || item?.desc || '';
  const el = document.getElementById('form-program-area');
  if (!el) return;
  el.style.display = 'block';
  const ikonList = ['📚','🏆','🎨','🏃','🔬','🎵','🌱','🕌','💻','⚽','🎭','🌍'];
  el.innerHTML = `
    <div class="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-5">
      <h4 class="text-sm font-bold text-navy-900 mb-4">${id?'Edit':'Tambah'} Program</h4>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Nama Program</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="pf-n" value="${item?.nama||''}" placeholder="Nama program sekolah"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Ikon</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="pf-i">
            ${ikonList.map(k=>`<option value="${k}"${selectedIkon===k?' selected':''}>${k}</option>`).join('')}
          </select></div>
      </div>
      <div class="mb-3"><label class="block text-xs font-semibold text-gray-500 mb-1">Deskripsi</label>
        <textarea class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none min-h-16 resize-y" id="pf-d">${selectedDesc}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">URL Gambar (opsional)</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="pf-img" value="${item?.imageUrl||''}" placeholder="https://...jpg / png"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">URL File (opsional)</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="pf-file" value="${item?.fileUrl||''}" placeholder="https://...pdf / dokumen"></div>
      </div>
      <div class="mb-4"><label class="block text-xs font-semibold text-gray-500 mb-1">Tags (pisahkan dengan koma)</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="pf-t" value="${(item?.tags||[]).join(', ')}" placeholder="Akademik, Seni, Olahraga"></div>
      <div class="flex gap-2">
        <button onclick="saveProgram('${id||''}')" class="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">Simpan</button>
        <button onclick="closeForm('form-program-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
      </div>
    </div>`;
};

window.saveProgram = async function(id) {
  const nama = document.getElementById('pf-n')?.value.trim();
  if (!nama) { ERR('Nama program wajib!'); return; }
  const tags = (document.getElementById('pf-t')?.value||'').split(',').map(t=>t.trim()).filter(Boolean);
  const ikon = document.getElementById('pf-i').value;
  const deskripsi = document.getElementById('pf-d').value;
  const data = {
    nama,
    ikon,
    emoji: ikon, // kompatibilitas data lama
    deskripsi,
    desc: deskripsi, // kompatibilitas data lama
    imageUrl: document.getElementById('pf-img')?.value.trim() || '',
    fileUrl: document.getElementById('pf-file')?.value.trim() || '',
    tags,
    updatedAt: serverTimestamp()
  };
  try {
    if (id) { await updateDoc(doc(db, 'program', id), data); }
    else { await addDoc(collection(db, 'program'), { ...data, createdAt: serverTimestamp() }); }
    closeForm('form-program-area'); OK('Program disimpan!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

window.delProgram = async function(id) {
  if (!confirm('Hapus program ini?')) return;
  try { await deleteDoc(doc(db, 'program', id)); OK('Program dihapus.'); }
  catch(e) { ERR('Gagal menghapus.'); }
};

// ══════════════════════════════════════════════════════════
// SPMB — Firestore CRUD
// ══════════════════════════════════════════════════════════
window.formSpmb = function(id) {
  const item = id ? (window.CMS_SPMB||[]).find(x => x.id === id) : null;
  const el = document.getElementById('form-spmb-area');
  if (!el) return;
  el.style.display = 'block';
  const noPend = item?.noPendaftaran || ('SPMB-' + Date.now().toString().slice(-6));
  el.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
      <h4 class="text-sm font-bold text-navy-900 mb-4">${id?'Edit':'Tambah'} Data Pendaftar</h4>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">No. Pendaftaran</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-gray-50" id="sf-no" value="${noPend}" readonly></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Tanggal Daftar</label>
          <input type="date" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="sf-tgl" value="${item?.tglDaftar||new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Nama Anak</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="sf-na" value="${item?.namaAnak||''}" placeholder="Nama lengkap calon siswa"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Nama Orang Tua / Wali</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="sf-no2" value="${item?.namaOrtu||''}" placeholder="Nama orang tua"></div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">No. WhatsApp</label>
          <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="sf-wa" value="${item?.noWa||''}" placeholder="08123456789"></div>
        <div><label class="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="sf-st">
            ${['Menunggu','Diterima','Ditolak'].map(s=>`<option${item?.status===s?' selected':''}>${s}</option>`).join('')}
          </select></div>
      </div>
      <div class="flex gap-2">
        <button onclick="saveSpmb('${id||''}')" class="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">Simpan</button>
        <button onclick="closeForm('form-spmb-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
      </div>
    </div>`;
};

window.saveSpmb = async function(id) {
  const namaAnak = document.getElementById('sf-na')?.value.trim();
  if (!namaAnak) { ERR('Nama anak wajib diisi!'); return; }
  const data = {
    noPendaftaran: document.getElementById('sf-no').value,
    namaAnak,
    namaOrtu: document.getElementById('sf-no2').value,
    noWa: document.getElementById('sf-wa').value,
    status: document.getElementById('sf-st').value,
    tglDaftar: document.getElementById('sf-tgl').value,
    updatedAt: serverTimestamp()
  };
  try {
    if (id) { await updateDoc(doc(db, 'spmb', id), data); }
    else { await addDoc(collection(db, 'spmb'), { ...data, createdAt: serverTimestamp() }); }
    closeForm('form-spmb-area'); OK('Data pendaftar disimpan!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

window.delSpmb = async function(id) {
  if (!confirm('Hapus data pendaftar ini?')) return;
  try { await deleteDoc(doc(db, 'spmb', id)); OK('Data dihapus.'); }
  catch(e) { ERR('Gagal menghapus.'); }
};

// ══════════════════════════════════════════════════════════
// KELOLA USER — Tambah User
// ══════════════════════════════════════════════════════════
window.formTambahUser = function() {
  const el = document.getElementById('form-users-area');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <h3 class="text-base font-extrabold text-navy-900 mb-5">Tambah User Baru</h3>
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 mb-5">
      💡 User dibuat melalui <strong>Firebase Console → Authentication → Add User</strong>. 
      Isi form ini untuk menyimpan profil user di database.
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div><label class="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="uf-nama" placeholder="Nama lengkap user"></div>
      <div><label class="block text-xs font-semibold text-gray-500 mb-1">Email (sesuai Firebase Auth)</label>
        <input type="email" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="uf-email" placeholder="guru@sdit-alhasan.sch.id"></div>
      <div><label class="block text-xs font-semibold text-gray-500 mb-1">UID (dari Firebase Auth)</label>
        <input class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none font-mono text-xs" id="uf-uid" placeholder="UID dari Firebase Console"></div>
      <div><label class="block text-xs font-semibold text-gray-500 mb-1">Peran</label>
        <select class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="uf-role">
          <option value="guru">Guru</option>
          <option value="admin">Admin</option>
        </select></div>
    </div>
    <div class="flex gap-2">
      <button onclick="saveTambahUser()" class="bg-navy-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800">Simpan User</button>
      <button onclick="closeForm('form-users-area')" class="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
    </div>`;
};

window.saveTambahUser = async function() {
  const uid   = document.getElementById('uf-uid')?.value.trim();
  const nama  = document.getElementById('uf-nama')?.value.trim();
  const email = document.getElementById('uf-email')?.value.trim();
  const role  = document.getElementById('uf-role')?.value;
  if (!uid || !nama || !email) { ERR('UID, Nama, dan Email wajib diisi!'); return; }
  try {
    await setDoc(doc(db, 'users', uid), { nama, email, role, aktif: true, createdAt: serverTimestamp() });
    closeForm('form-users-area');
    renderUsers();
    OK('User berhasil ditambahkan!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

function renderProgram() {
  const el = document.getElementById('tbl-program-body');
  if (!el) return;
  const data = window.CMS_PROGRAM || [];
  const tot = document.getElementById('s-prog-tot'); if (tot) tot.textContent = data.length;
  if (!data.length) { el.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-10">Belum ada program.</td></tr>'; return; }
  el.innerHTML = data.map(p => `<tr>
    <td><span class="text-2xl mr-2">${EH(p.ikon||p.emoji||'📚')}</span><span class="font-medium text-navy-900">${EH(p.nama||'')}</span></td>
    <td class="text-gray-500">${(p.tags||[]).map(t=>`<span class="badge badge-blue mr-1">${EH(t)}</span>`).join('')}</td>
    <td><span class="badge badge-green">Aktif</span></td>
    <td class="text-right"><div class="flex gap-2 justify-end">
      <button onclick="formProgram('${p.id}')" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">Edit</button>
      <button onclick="delProgram('${p.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Hapus</button>
    </div></td></tr>`).join('');
}

function renderSpmb() {
  const el = document.getElementById('tbl-spmb-body');
  if (!el) return;
  const data = window.CMS_SPMB || [];
  if (!data.length) { el.innerHTML = '<tr><td colspan="7" class="text-center text-gray-400 py-10">Belum ada data pendaftar.</td></tr>'; return; }
  const badge = s => s==='Diterima'?'badge-green':s==='Menunggu'?'badge-yellow':'badge-red';
  el.innerHTML = data.map(s => `<tr>
    <td class="font-mono text-xs">${EH(s.noPendaftaran||'-')}</td>
    <td class="font-medium text-navy-900">${EH(s.namaAnak||'')}</td>
    <td class="text-gray-500">${EH(s.namaOrtu||'')}</td>
    <td><a href="https://wa.me/${(s.noWa||'').replace(/\D/g,'')}" target="_blank" class="text-accent hover:underline">${EH(s.noWa||'')}</a></td>
    <td><span class="badge ${badge(s.status)}">${EH(s.status||'Menunggu')}</span></td>
    <td class="text-gray-400">${EH(s.tglDaftar||'')}</td>
    <td class="text-right"><div class="flex gap-2 justify-end">
      <button onclick="formSpmb('${s.id}')" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">Edit</button>
      <button onclick="delSpmb('${s.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">Hapus</button>
    </div></td></tr>`).join('');
}

// ══════════════════════════════════════════════════════════
// NILAI SISWA — Firestore (NISN sebagai document ID)
// Struktur: siswa/{nisn} = { nama, kelas, tglLahir, nilai:{sts1:[],sts2:[],...} }
// ══════════════════════════════════════════════════════════
window.loadNilaiDropdown = function() {
  const sel = document.getElementById('nv-siswa');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    DATA_NILAI.map(s => `<option value="${s.nisn}">${s.nama} (${s.nisn}) - Kelas ${s.kelas}</option>`).join('');
};

window.loadFormNilai = function() {
  const nisn = document.getElementById('nv-siswa')?.value;
  const ul   = document.getElementById('nv-ul')?.value;
  const el   = document.getElementById('nv-form');
  if (!el) return;
  if (!nisn) { el.innerHTML = '<p class="text-gray-400 text-sm">Pilih siswa terlebih dahulu.</p>'; return; }

  const siswa    = DATA_NILAI.find(s => s.nisn === nisn);
  const existing = siswa?.nilai?.[ul] || [];

  el.innerHTML = `<div class="border-t border-gray-100 pt-4 mt-4">
    <p class="text-sm text-gray-500 mb-3">Nilai <strong>${ul?.toUpperCase()}</strong> untuk: <strong>${siswa?.nama||nisn}</strong></p>
    <div class="grid grid-cols-2 gap-3 mb-4">
      ${MAPEL.map((m,i) => {
        const ex = existing.find(n => n.mapel === m);
        return `<div><label class="block text-xs font-semibold text-gray-400 mb-1">${m}</label>
          <input type="number" min="0" max="100" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" id="nv-${i}" value="${ex?.nilai||''}" placeholder="0-100"></div>`;
      }).join('')}
    </div>
    <button onclick="saveNilai()" class="bg-navy-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800">💾 Simpan Nilai</button>
  </div>`;
};

window.saveNilai = async function() {
  const nisn  = document.getElementById('nv-siswa')?.value;
  const ul    = document.getElementById('nv-ul')?.value;
  if (!nisn) { ERR('Pilih siswa dulu!'); return; }

  const arr = [];
  MAPEL.forEach((m,i) => {
    const v = parseInt(document.getElementById('nv-' + i)?.value);
    if (!isNaN(v)) arr.push({ mapel: m, nilai: v, kkm: 70 });
  });

  try {
    // NISN sebagai document ID agar mudah dicari
    const siswaRef = doc(db, 'siswa', nisn);
    const siswaSnap = await getDoc(siswaRef);
    const existingData = siswaSnap.exists() ? siswaSnap.data() : {};
    const nilaiLama = existingData.nilai || {};
    nilaiLama[ul] = arr;

    await setDoc(siswaRef, { ...existingData, nilai: nilaiLama, updatedAt: serverTimestamp() }, { merge: true });
    OK(`Nilai ${ul?.toUpperCase()} disimpan! (${arr.length} mapel)`);
  } catch(e) { ERR('Gagal menyimpan nilai: ' + e.message); }
};

// ── Upload Nilai via Excel/CSV ─────────────────────────────
const EXCEL_COL_MAP = {
  'MTK':'Matematika','PKN':'Pendidikan Pancasila','B.INDO':'Bahasa Indonesia',
  'PJOK':'Pendidikan Jasmani, Olahraga & Kesehatan','SBdP':'Seni Budaya & Prakarya',
  'PAI':'Pendidikan Agama Islam','B.INGGRIS':'Bahasa Inggris',
  'B. SUNDA':'Bahasa Sunda','AL-QURAN':'Pendidikan Al-Quran',
  'IPAS':'Ilmu Pengetahuan Alam (IPA)','B. ARAB':'Bahasa Arab',
  'KITAB FIQIH':'Kitab Fiqih','KITAB TAUHID':'Kitab Tauhid','KITAB AKHLAK':'Kitab Akhlak'
};

window.prosesFile = function(file) {
  if (!file) return;
  if (file.name.match(/\.xlsx?$/i)) prosesExcel(file);
  else prosesCSV(file);
};

function prosesExcel(file) {
  if (typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => bacaExcel(file);
    s.onerror = () => ERR('Gagal load library Excel. Coba konversi ke CSV.');
    document.head.appendChild(s);
  } else { bacaExcel(file); }
}

async function bacaExcel(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type:'array' });
      let ok=0, gagal=0, preview='';
      const batch = [];

      for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval:null });
        for (const row of rows) {
          let nisn = String(row['NISN']||row['nisn']||'').replace(/\.0+$/,'').trim();
          if (nisn && !isNaN(nisn) && parseFloat(nisn) > 1e7) nisn = String(parseInt(parseFloat(nisn)));
          const nama = String(row['Nama']||row['NAMA']||'').trim();
          if (!nisn || nisn==='null' || !nama || nama==='null') { gagal++; continue; }

          const nilaiArr = [];
          Object.entries(EXCEL_COL_MAP).forEach(([col, mapel]) => {
            if (row[col] !== null && row[col] !== undefined) {
              const v = parseInt(parseFloat(row[col]));
              if (!isNaN(v) && v >= 0) nilaiArr.push({ mapel, nilai:v, kkm:70 });
            }
          });

          batch.push({ nisn, nama, kelas:sheetName, tglLahir:'2016-01-01', ulangan:'sts2', nilaiArr });
          ok++;
          if (preview.split('<tr>').length <= 11)
            preview += `<tr><td class="py-1 pr-4"><code class="text-xs">${nisn}</code></td><td class="py-1 pr-4">${nama}</td><td class="py-1 pr-4">${sheetName}</td><td class="py-1"><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${nilaiArr.length} mapel</span></td></tr>`;
        }
      }

      // Simpan ke Firestore dalam batch
      let saved = 0;
      for (const s of batch) {
        try {
          const ref = doc(db, 'siswa', s.nisn);
          const snap = await getDoc(ref);
          const existing = snap.exists() ? snap.data() : {};
          const nilai = existing.nilai || { sts1:[], sas1:[], sts2:[], sas2:[] };
          nilai[s.ulangan] = s.nilaiArr;
          await setDoc(ref, { nisn:s.nisn, nama:s.nama, kelas:s.kelas, tglLahir:s.tglLahir, nilai, updatedAt:serverTimestamp() }, { merge:true });
          saved++;
        } catch(err) { console.error('Error simpan', s.nisn, err); }
      }

      const el = document.getElementById('csv-result');
      if (el) el.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 mb-4">
          ✅ Diproses: <strong>${ok}</strong> siswa${gagal?` | ❌ Gagal: ${gagal}`:''} — Tersimpan ke Firebase: <strong>${saved}</strong>
        </div>` + (preview ? `<div class="overflow-auto"><table class="text-sm"><thead><tr class="text-xs text-gray-400 uppercase">
          <th class="pb-2 pr-4">NISN</th><th class="pb-2 pr-4">Nama</th><th class="pb-2 pr-4">Kelas</th><th class="pb-2">Mapel</th></tr></thead>
          <tbody>${preview}</tbody></table></div>` : '');
      OK(`Upload selesai: ${saved} siswa tersimpan ke Firebase!`);
    } catch(err) { ERR('Error: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}

function prosesCSV(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.replace(/\r/g,'').split('\n').filter(l=>l.trim());
    if (lines.length < 2) { ERR('File CSV kosong atau format salah!'); return; }
    let ok=0, gagal=0;
    for (let i=1; i<lines.length; i++) {
      const cols = lines[i].split(',').map(c=>c.trim());
      const [nisn,nama,kelas,tgl,ul,...vals] = cols;
      if (!nisn||!ul) { gagal++; continue; }
      const nilaiArr = MAPEL.map((m,j) => ({ mapel:m, nilai:parseInt(vals[j])||0, kkm:70 })).filter(n=>!isNaN(n.nilai));
      try {
        const ref = doc(db,'siswa',nisn);
        const snap = await getDoc(ref);
        const ex = snap.exists() ? snap.data() : {};
        const nilai = ex.nilai || {sts1:[],sas1:[],sts2:[],sas2:[]};
        nilai[ul] = nilaiArr;
        await setDoc(ref, { nisn, nama, kelas, tglLahir:tgl||'2016-01-01', nilai, updatedAt:serverTimestamp() }, { merge:true });
        ok++;
      } catch(err) { gagal++; }
    }
    OK(`CSV selesai: ${ok} berhasil, ${gagal} gagal.`);
  };
  reader.readAsText(file);
}

window.unduhTemplate = function() {
  const hdr = 'NISN,Nama,Kelas,TglLahir,Ulangan,' + MAPEL.join(',') + '\n';
  const ex  = '3177667971,Nama Siswa,3A,2017-05-25,sts2,' + MAPEL.map(()=>'75').join(',') + '\n';
  const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([hdr+ex],{type:'text/csv'})), download:'template-nilai.csv' });
  a.click(); OK('Template CSV diunduh!');
};

window.exportNilai = function() {
  const hdr = 'NISN,Nama,Kelas,TglLahir,Ulangan,' + MAPEL.join(',') + '\n';
  let rows = '';
  DATA_NILAI.forEach(s => {
    ['sts1','sas1','sts2','sas2'].forEach(ul => {
      if (s.nilai?.[ul]?.length) {
        const cols = [s.nisn,s.nama,s.kelas,s.tglLahir,ul];
        MAPEL.forEach(m => { const n=s.nilai[ul].find(x=>x.mapel===m); cols.push(n?.nilai||''); });
        rows += cols.join(',') + '\n';
      }
    });
  });
  const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([hdr+rows],{type:'text/csv'})), download:'nilai-export.csv' });
  a.click(); OK('Nilai diunduh!');
};

// ══════════════════════════════════════════════════════════
// KELOLA USER — Firestore (users collection)
// Users login menggunakan Firebase Auth (Email/Password)
// Data profil (nama, role) disimpan di Firestore users/{uid}
// ══════════════════════════════════════════════════════════
async function renderUsers() {
  // Perbaikan: ID di HTML adalah 'tbl-users-body', bukan 'tbl-users'
  const el = document.getElementById('tbl-users-body');
  if (!el) return;
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    const badge = r => r==='admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
    const active = a => a!==false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    // Render hanya <tr> rows karena <table> sudah ada di HTML
    el.innerHTML = users.map(u=>`<tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-3 pl-4 font-medium">${EH(u.nama||'-')}</td>
        <td class="py-3 text-gray-400">${EH(u.email||'-')}</td>
        <td class="py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${badge(u.role)}">${u.role==='admin'?'Admin':'Guru'}</span></td>
        <td class="py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${active(u.aktif)}">${u.aktif!==false?'Aktif':'Nonaktif'}</span></td>
        <td class="py-3 flex gap-2">
          <button onclick="toggleUser('${u.id}',${u.aktif!==false})" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 font-medium">${u.aktif!==false?'Nonaktifkan':'Aktifkan'}</button>
        </td></tr>`).join('');
  } catch(e) { el.innerHTML = '<div class="text-red-500 p-4 text-sm">Gagal memuat users: ' + e.message + '</div>'; }
}

window.toggleUser = async function(uid, currentlyActive) {
  if (uid === ME?.uid) { ERR('Tidak bisa menonaktifkan akun sendiri!'); return; }
  try {
    await updateDoc(doc(db, 'users', uid), { aktif: !currentlyActive });
    OK('Status user diperbarui!');
    renderUsers();
  } catch(e) { ERR('Gagal: ' + e.message); }
};

// ── Akun Saya ──────────────────────────────────────────────
window.saveAkun = async function() {
  if (!ME?.uid) return;
  const nama = document.getElementById('ak-nama')?.value.trim();
  const p1   = document.getElementById('ak-p1')?.value;
  const p2   = document.getElementById('ak-p2')?.value;
  if (p1 && p1 !== p2) { ERR('Password tidak sama!'); return; }
  if (p1 && p1.length < 6) { ERR('Password minimal 6 karakter!'); return; }
  try {
    if (nama) await updateDoc(doc(db, 'users', ME.uid), { nama, updatedAt: serverTimestamp() });
    OK('Profil diperbarui!');
  } catch(e) { ERR('Gagal: ' + e.message); }
};

// ── Export data.js (Backup) ────────────────────────────────
window.exportDataJS = async function() {
  try {
    // Ambil semua data dari Firestore
    const [beritaSnap, galeriSnap, guruSnap, programSnap, spmbSnap] = await Promise.all([
      getDocs(query(collection(db,'berita'), orderBy('createdAt','desc'))),
      getDocs(query(collection(db,'galeri'), orderBy('createdAt','desc'))),
      getDocs(query(collection(db,'guru'),   orderBy('createdAt','desc'))),
      getDocs(query(collection(db,'program'),orderBy('createdAt','desc'))),
      getDocs(query(collection(db,'spmb'),   orderBy('createdAt','desc'))),
    ]);

    const toArr = snap => snap.docs.map(d => {
      const data = d.data();
      // Hapus Timestamp Firestore agar bisa di-JSON
      delete data.createdAt; delete data.updatedAt;
      return { id: d.id, ...data };
    });

    const js = `// data.js — Backup dari Firebase Firestore
// Tanggal: ${new Date().toLocaleString('id-ID')}
// File ini digunakan sebagai fallback jika Firebase tidak tersedia.

var CMS_BERITA  = ${JSON.stringify(toArr(beritaSnap),  null, 2)};
var CMS_GALERI  = ${JSON.stringify(toArr(galeriSnap),  null, 2)};
var CMS_GURU    = ${JSON.stringify(toArr(guruSnap),    null, 2)};
var CMS_PROGRAM = ${JSON.stringify(toArr(programSnap), null, 2)};
var CMS_SPMB    = ${JSON.stringify(toArr(spmbSnap),    null, 2)};
var DATA_NILAI  = ${JSON.stringify(DATA_NILAI, null, 2)};
`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([js],{type:'text/javascript'})),
      download: 'data.js'
    });
    a.click();
    OK('Backup data.js berhasil diunduh dari Firebase!');
  } catch(e) { ERR('Gagal export: ' + e.message); }
};

// ── Helper: Google Drive URL fix ───────────────────────────
window.fixGDriveUrl = function(url) {
  if (!url) return url;
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` : url;
};

// ── INIT ───────────────────────────────────────────────────
// onAuthStateChanged sudah handle semua init
console.log('firebase-admin.js loaded ✓');
