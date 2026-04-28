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

function shouldUsePhoto(item) {
  return !!(item?.imageUrl && (item?.thumbnailType === 'foto' || !item?.thumbnailType));
}

// Berita
function renderBerita() {
  const data = window.CMS_BERITA || [];
  if (!data.length) return;
  if (typeof window.setBeritaTab === 'function') {
    window.setBeritaTab(window._BERITA_TAB || 'Semua Berita');
  }

  const bgMap    = { Prestasi:'#FFF8E8', Penting:'#F0F4FF', Kegiatan:'#FFF0F5', Pengumuman:'#E8F5EC' };
  const badgeMap = { Prestasi:'badge-prestasi', Penting:'badge-penting', Kegiatan:'badge-info', Pengumuman:'badge-info' };

  const makeCard = b => `
    <div class="berita-kartu">
      <div class="berita-img" style="background:${bgMap[b.kategori]||'#E8F5EC'};overflow:hidden">
        ${shouldUsePhoto(b)
          ? `<img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.judul||'')}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentNode.textContent='${escapeHtml(b.emoji||'📋')}'">`
          : `${escapeHtml(b.emoji||'📋')}`
        }
      </div>
      <div class="berita-body">
        <span class="berita-badge ${badgeMap[b.kategori]||'badge-info'}">${escapeHtml(b.kategori||'')}</span>
        <div class="berita-tgl">${escapeHtml(formatTgl(b.tgl))}</div>
        <div class="berita-judul">${escapeHtml(b.judul||'')}</div>
        ${b.isi?`<div class="berita-isi">${escapeHtml(b.isi.substring(0,90))}${b.isi.length>90?'...':''}</div>`:''}
        ${b.fileUrl?`<a href="${escapeHtml(b.fileUrl)}" target="_blank" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#1D4ED8">Lihat File</a>`:''}
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

  const elBerandaPreview = document.getElementById('beranda-berita-preview');
  if (elBerandaPreview) {
    elBerandaPreview.innerHTML = data.slice(0,3).map(b => `
      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
        <div class="h-48 relative overflow-hidden bg-gray-100">
          ${shouldUsePhoto(b)
            ? `<img src="${escapeHtml(b.imageUrl)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.style.display='none'">`
            : `<div class="w-full h-full flex items-center justify-center text-5xl">${escapeHtml(b.emoji||'📋')}</div>`}
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur text-navy-900 text-[10px] font-bold px-3 py-1.5 rounded-lg">${escapeHtml(b.kategori||'Berita')}</div>
        </div>
        <div class="p-6">
          <div class="text-[10px] text-gray-400 font-bold mb-2">${escapeHtml(formatTgl(b.tgl||''))}</div>
          <h3 class="font-bold text-navy-900 text-base mb-2 group-hover:text-accent transition line-clamp-2">${escapeHtml(b.judul||'')}</h3>
          <p class="text-xs text-gray-500 font-medium mb-4 line-clamp-2">${escapeHtml((b.ringkasan||b.isi||'').substring(0,120))}</p>
          ${b.fileUrl ? `<a href="${escapeHtml(b.fileUrl)}" target="_blank" class="text-accent text-[11px] font-bold flex items-center gap-1">Buka Lampiran <i class="ph-bold ph-arrow-right"></i></a>` : ''}
        </div>
      </div>`).join('');
  }

  // Kompatibilitas untuk layout berita index versi baru
  const elMain = document.getElementById('berita-list-main');
  if (elMain) {
    elMain.innerHTML = data.map(b => `
      <div class="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row group hover:shadow-md transition p-2">
        <div class="w-full sm:w-64 h-48 sm:h-auto relative overflow-hidden shrink-0 rounded-[1.5rem] bg-gray-100">
          ${shouldUsePhoto(b)
            ? `<img src="${escapeHtml(b.imageUrl)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.style.display='none'">`
            : `<div class="w-full h-full flex items-center justify-center text-5xl">${escapeHtml(b.emoji||'📋')}</div>`}
        </div>
        <div class="p-6 flex flex-col justify-center flex-1">
          <div class="mb-3"><span class="bg-blue-50 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg">${escapeHtml(b.kategori||'')}</span></div>
          <h3 class="font-bold text-navy-900 text-lg mb-2 line-clamp-2 leading-snug">${escapeHtml(b.judul||'')}</h3>
          <p class="text-xs text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed">${escapeHtml((b.ringkasan||b.isi||'').substring(0,180))}</p>
          ${b.fileUrl?`<a href="${escapeHtml(b.fileUrl)}" target="_blank" class="text-accent text-xs font-bold">Buka Lampiran</a>`:''}
        </div>
      </div>`).join('');
  }

  const elPopuler = document.getElementById('berita-populer');
  if (elPopuler) {
    elPopuler.innerHTML = data.slice(0,4).map((b, i) => `
      <div class="flex items-center gap-4 group cursor-pointer border-b border-gray-50 pb-3 last:border-0 last:pb-0">
        <div class="text-base font-black text-gray-300 group-hover:text-accent transition w-4 text-center">${i + 1}</div>
        ${shouldUsePhoto(b)
          ? `<img src="${escapeHtml(b.imageUrl)}" class="w-14 h-14 rounded-xl object-cover shadow-sm" onerror="this.style.display='none'">`
          : `<div class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl">${escapeHtml(b.emoji||'📋')}</div>`}
        <div class="flex-1"><h4 class="font-bold text-navy-900 text-xs mb-1 line-clamp-2 group-hover:text-accent transition leading-tight">${escapeHtml(b.judul||'')}</h4><p class="text-[10px] text-gray-400 font-medium">${escapeHtml(formatTgl(b.tgl||''))}</p></div>
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

  if (typeof window.setGaleriTab === 'function') {
    window.setGaleriTab(window._GALERI_TAB || 'Semua Kegiatan');
  }

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

  // Sinkronkan juga struktur organisasi di halaman Profil (jika ada)
  const elOrg = document.getElementById('grid-org');
  if (elOrg) {
    elOrg.innerHTML = data.map(g => `
      <div class="bg-white p-5 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
        <div class="w-12 h-12 bg-blue-50 text-accent font-bold rounded-full flex items-center justify-center text-lg mb-3">${escapeHtml(g.inisial||g.nama?.[0]||'?')}</div>
        <h4 class="font-bold text-navy-900 text-[13px] mb-1 line-clamp-2">${escapeHtml(g.nama||'')}</h4>
        <p class="text-[10px] text-gray-500 font-medium">${escapeHtml(g.jabatan||'')}</p>
      </div>`).join('');
  }

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
      ${shouldUsePhoto(p) ? `<div style="height:120px;border-radius:12px;overflow:hidden;margin-bottom:10px"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama||'')}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"></div>` : ''}
      <div class="prog-header">
        <span class="prog-emoji">${escapeHtml(p.ikon || p.emoji || '📖')}</span>
        <div><div class="prog-nama">${escapeHtml(p.nama || '')}</div></div>
      </div>
      <div class="prog-desc">${escapeHtml(p.deskripsi || p.desc || '')}</div>
      <div class="prog-pills">${(p.tags||[]).map(t=>`<span class="prog-pill">${escapeHtml(t)}</span>`).join('')}</div>
      ${p.fileUrl ? `<a href="${escapeHtml(p.fileUrl)}" target="_blank" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#1D4ED8">Lihat File Program</a>` : ''}
    </div>`;

  const el = document.getElementById('cms-program');
  if (el) el.innerHTML = data.map(makeKartu).join('');

  const elList = document.getElementById('cms-program-list');
  if (elList) {
    elList.innerHTML = `<div class="program-grid">${data.map(makeKartu).join('')}</div>`;
  }

  // Kompatibilitas untuk layout program index versi baru
  const elProgramUnggulan = document.getElementById('program-unggulan-grid');
  if (elProgramUnggulan) {
    elProgramUnggulan.innerHTML = data.slice(0, 4).map(p => `
      <div class="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition">
        <div class="h-44 overflow-hidden relative bg-gray-100">
          ${shouldUsePhoto(p)
            ? `<img src="${escapeHtml(p.imageUrl)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.style.display='none'">`
            : `<div class="w-full h-full flex items-center justify-center text-5xl">${escapeHtml(p.ikon || p.emoji || '📖')}</div>`}
        </div>
        <div class="p-6">
          <h3 class="font-bold text-navy-900 text-base mb-2">${escapeHtml(p.nama || '')}</h3>
          <p class="text-xs text-gray-500 font-medium mb-3 line-clamp-3">${escapeHtml((p.deskripsi || p.desc || '').substring(0, 180))}</p>
          ${p.fileUrl ? `<a href="${escapeHtml(p.fileUrl)}" target="_blank" class="text-accent text-xs font-bold">Buka Lampiran</a>` : ''}
        </div>
      </div>`).join('');
  }
}
