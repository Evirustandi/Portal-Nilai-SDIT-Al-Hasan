/**
 * cms-integration-firebase.js — SDIT Al-Hasan
 * Website membaca data dari Firestore secara realtime.
 * Gantikan cms-integration.js lama dengan file ini.
 */

import { initializeApp }   from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot }
                            from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✏️ GANTI DENGAN CONFIG FIREBASE ANDA (sama dengan firebase-admin.js)
const firebaseConfig = {
  apiKey: "AIzaSyBc6Xx8f2Y0NsZ3eMphEzadbDP4K4rFt1w",
  authDomain: "sdital-hasan.firebaseapp.com",
  projectId: "sdital-hasan",
  storageBucket: "sdital-hasan.firebasestorage.app",
  messagingSenderId: "499840534324",
  appId: "1:499840534324:web:78b53daa11443fc258c761",
  measurementId: "G-81YC02102W"
};

const app = initializeApp(firebaseConfig, 'website');
const db  = getFirestore(app);

// ── REALTIME LISTENER ─────────────────────────────────────
// Setiap perubahan di Firebase langsung terefleksi di website

document.addEventListener('DOMContentLoaded', () => {

  // Berita
  onSnapshot(
    query(collection(db, 'berita'), orderBy('createdAt', 'desc')),
    snap => {
      window.CMS_BERITA = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderBerita();
    },
    err => console.warn('Firestore berita error, pakai data.js fallback:', err)
  );

  // Galeri
  onSnapshot(
    query(collection(db, 'galeri'), orderBy('createdAt', 'desc')),
    snap => {
      window.CMS_GALERI = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderGaleri();
    },
    err => console.warn('Firestore galeri error:', err)
  );

  // Guru
  onSnapshot(
    query(collection(db, 'guru'), orderBy('createdAt', 'desc')),
    snap => {
      window.CMS_GURU = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderGuru();
    },
    err => console.warn('Firestore guru error:', err)
  );

  // Program
  onSnapshot(
    query(collection(db, 'program'), orderBy('createdAt', 'desc')),
    snap => {
      window.CMS_PROGRAM = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderProgram();
    },
    err => console.warn('Firestore program error:', err)
  );

  // Siswa/Nilai (untuk portal nilai)
  onSnapshot(
    collection(db, 'siswa'),
    snap => {
      window.DATA_NILAI = snap.docs.map(d => ({ nisn:d.id, ...d.data() }));
    },
    err => console.warn('Firestore siswa error:', err)
  );
});

// ── RENDER FUNCTIONS ──────────────────────────────────────

function fixGDriveUrl(url) {
  if (!url) return url;
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` : url;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTgl(str) {
  if (!str) return '';
  const bln = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const p = str.split('-');
  return p.length < 3 ? str : `${p[2]} ${bln[+p[1]]||p[1]} ${p[0]}`;
}

// Berita
function renderBerita() {
  const data = window.CMS_BERITA || [];
  if (!data.length) return;

  const bgMap    = { Prestasi:'#FFF8E8', Penting:'#F0F4FF', Kegiatan:'#FFF0F5', Pengumuman:'#E8F5EC' };
  const badgeMap = { Prestasi:'badge-prestasi', Penting:'badge-penting', Kegiatan:'badge-info', Pengumuman:'badge-info' };

  const makeCard = b => `
    <div class="berita-kartu">
      <div class="berita-img" style="background:${bgMap[b.kategori]||'#E8F5EC'}">${escapeHtml(b.emoji||'📋')}</div>
      <div class="berita-body">
        <span class="berita-badge ${badgeMap[b.kategori]||'badge-info'}">${escapeHtml(b.kategori||'')}</span>
        <div class="berita-tgl">${escapeHtml(formatTgl(b.tgl))}</div>
        <div class="berita-judul">${escapeHtml(b.judul||'')}</div>
        ${b.isi?`<div class="berita-isi">${escapeHtml(b.isi.substring(0,90))}${b.isi.length>90?'...':''}</div>`:''}
      </div>
    </div>`;

  // Beranda — preview 3 berita
  const elBeranda = document.getElementById('cms-berita');
  if (elBeranda) elBeranda.innerHTML = data.slice(0,3).map(makeCard).join('');

  // Halaman berita — semua
  const elFull = document.getElementById('cms-berita-full');
  if (elFull) elFull.innerHTML = data.map(makeCard).join('');

  // Preview di sidebar beranda (jika ada)
  const elPreview = document.getElementById('cms-berita-preview');
  if (elPreview) {
    elPreview.innerHTML = data.slice(0,3).map(b => `
      <div style="background:white;border:1px solid var(--border,#DDE4F0);border-radius:12px;overflow:hidden;cursor:pointer">
        <div style="height:80px;background:${bgMap[b.kategori]||'#E8F5EC'};display:flex;align-items:center;justify-content:center;font-size:28px">${escapeHtml(b.emoji||'📋')}</div>
        <div style="padding:.7rem .9rem">
          <div style="font-size:10px;color:#8A9BB5;margin-bottom:3px">${formatTgl(b.tgl)}</div>
          <div style="font-size:13px;font-weight:600;line-height:1.4">${escapeHtml(b.judul||'')}</div>
        </div>
      </div>`).join('');
  }
}

// Galeri
function renderGaleri() {
  const data = window.CMS_GALERI || [];
  if (!data.length) return;

  const makeItem = g => `
    <div class="galeri-item">
      <img src="${fixGDriveUrl(g.url)}" alt="${escapeHtml(g.caption)}" loading="lazy"
        onerror="this.closest('.galeri-item').style.display='none'">
      <div class="galeri-caption-overlay">${escapeHtml(g.caption||'')}</div>
    </div>`;

  const makeBerandaItem = g => `
    <div class="rounded-[2rem] aspect-[4/3] overflow-hidden shadow-sm bg-gray-100">
      <img src="${fixGDriveUrl(g.url)}" alt="${escapeHtml(g.caption||'')}" class="w-full h-full object-cover"
        onerror="this.closest('div').style.display='none'">
    </div>`;

  // Beranda galeri (4 foto)
  const elBeranda = document.getElementById('cms-galeri-beranda');
  if (elBeranda) elBeranda.innerHTML = data.slice(0,4).map(makeBerandaItem).join('');

  // Halaman galeri — semua
  const elFull = document.getElementById('cms-galeri-full');
  if (elFull) elFull.innerHTML = data.map(makeItem).join('');

  // cms-galeri (kompatibilitas lama)
  const elLama = document.getElementById('cms-galeri');
  if (elLama) elLama.innerHTML = data.map(makeItem).join('');
}

// Guru / Staf
function renderGuru() {
  const data = (window.CMS_GURU || []).filter(g => g.status === 'Aktif');
  if (!data.length) return;

  const makeKartu = g => `
    <div class="staf-kartu">
      <div class="staf-avatar">${escapeHtml(g.inisial||g.nama?.[0]||'?')}</div>
      <div class="staf-nama">${escapeHtml(g.nama||'')}</div>
      <div class="staf-jabatan">${escapeHtml(g.jabatan||'')}</div>
    </div>`;

  const el = document.getElementById('cms-guru');
  if (el) el.innerHTML = data.map(makeKartu).join('');

  // Update stat guru di beranda
  const statEl = document.getElementById('stat-guru');
  if (statEl) statEl.textContent = data.length;
}

// Program
function renderProgram() {
  const data = window.CMS_PROGRAM || [];
  if (!data.length) return;

  const bgColors     = ['#EDFAF3','#EEF6FF','#FFFBF0','#F5F0FF','#FEF2F2','#F0FFF4'];
  const borderColors = ['#7DCEA0','#B5D4F4','#F0D060','#C4B5FD','#FCA5A5','#6EE7B7'];

  const makeKartu = (p, i) => `
    <div class="prog-kartu" style="background:${bgColors[i%bgColors.length]};border-color:${borderColors[i%borderColors.length]}">
      <div class="prog-header">
        <span class="prog-emoji">${escapeHtml(p.ikon || p.emoji || '📖')}</span>
        <div><div class="prog-nama">${escapeHtml(p.nama || '')}</div></div>
      </div>
      <div class="prog-desc">${escapeHtml(p.deskripsi || p.desc || '')}</div>
      <div class="prog-pills">${(p.tags||[]).map(t=>`<span class="prog-pill">${escapeHtml(t)}</span>`).join('')}</div>
    </div>`;

  const el = document.getElementById('cms-program');
  if (el) el.innerHTML = data.map(makeKartu).join('');

  const elList = document.getElementById('cms-program-list');
  if (elList) {
    elList.innerHTML = `<div class="program-grid">${data.map(makeKartu).join('')}</div>`;
  }
}
