/**
 * cms-integration.js — SDIT Al-Hasan
 * Script penghubung antara data.js (dari Admin CMS) dan tampilan website.
 * Letakkan file ini di folder yang sama dengan index.html
 */

document.addEventListener('DOMContentLoaded', function () {

  // Jalankan semua fungsi render setelah halaman siap
  if (typeof CMS_BERITA  !== 'undefined') renderBerita();
  if (typeof CMS_GALERI  !== 'undefined') renderGaleri();
  if (typeof CMS_GURU    !== 'undefined') renderGuru();
  if (typeof CMS_PROGRAM !== 'undefined') renderProgram();

  // DATA_NILAI untuk portal nilai sudah langsung terbaca oleh script portal
  // di dalam index.html karena variabelnya global

});

// ─────────────────────────────────────────────
// BERITA & PENGUMUMAN
// ─────────────────────────────────────────────
function renderBerita() {
  var el = document.getElementById('cms-berita');
  if (!el) return;
  if (!CMS_BERITA || CMS_BERITA.length === 0) {
    el.innerHTML = '<p style="color:#8A9BB5;font-size:13px;text-align:center;padding:2rem">Belum ada berita.</p>';
    return;
  }

  var bgMap = {
    'Prestasi': '#FFF8E8',
    'Penting'  : '#F0F4FF',
    'Kegiatan' : '#FFF0F5',
    'Pengumuman': '#E8F5EC'
  };
  var badgeMap = {
    'Prestasi'  : 'badge-prestasi',
    'Penting'   : 'badge-penting',
    'Kegiatan'  : 'badge-info',
    'Pengumuman': 'badge-info'
  };

  var html = '';
  CMS_BERITA.slice(0, 6).forEach(function (b) {
    var bg    = bgMap[b.kategori]    || '#E8F5EC';
    var badge = badgeMap[b.kategori] || 'badge-info';
    html +=
      '<div class="berita-kartu">' +
        '<div class="berita-img" style="background:' + bg + '">' + (b.emoji || '📋') + '</div>' +
        '<div class="berita-body">' +
          '<span class="berita-badge ' + badge + '">' + b.kategori + '</span>' +
          '<div class="berita-tgl">' + formatTgl(b.tgl) + '</div>' +
          '<div class="berita-judul">' + b.judul + '</div>' +
          (b.isi ? '<div style="font-size:12px;color:#8A9BB5;margin-top:4px;line-height:1.5">' +
            b.isi.substring(0, 90) + (b.isi.length > 90 ? '...' : '') + '</div>' : '') +
        '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ─────────────────────────────────────────────
// GALERI FOTO
// ─────────────────────────────────────────────
function renderGaleri() {
  var el = document.getElementById('cms-galeri');
  if (!el) return;
  if (!CMS_GALERI || CMS_GALERI.length === 0) return; // biarkan galeri lama jika kosong

  var html = '';
  CMS_GALERI.forEach(function (g) {
    html +=
      '<div class="galeri-item">' +
        '<img src="' + g.url + '" alt="' + g.caption + '" loading="lazy">' +
        '<div class="galeri-caption">' + g.caption + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ─────────────────────────────────────────────
// GURU / STAF
// ─────────────────────────────────────────────
function renderGuru() {
  var el = document.getElementById('cms-guru');
  if (!el) return;
  if (!CMS_GURU || CMS_GURU.length === 0) return; // biarkan staf lama jika kosong

  var html = '';
  CMS_GURU
    .filter(function (g) { return g.status === 'Aktif'; })
    .forEach(function (g) {
      html +=
        '<div class="staf-kartu">' +
          '<div class="staf-avatar">' + (g.inisial || g.nama[0]) + '</div>' +
          '<div class="staf-nama">'    + g.nama    + '</div>' +
          '<div class="staf-jabatan">' + g.jabatan + '</div>' +
        '</div>';
    });
  if (html) el.innerHTML = html;
}

// ─────────────────────────────────────────────
// PROGRAM SEKOLAH
// ─────────────────────────────────────────────
function renderProgram() {
  var el = document.getElementById('cms-program');
  if (!el) return;
  if (!CMS_PROGRAM || CMS_PROGRAM.length === 0) return;

  var bgColors     = ['#EDFAF3','#EEF6FF','#FFFBF0','#F5F0FF','#FEF2F2','#F0FFF4'];
  var borderColors = ['#7DCEA0','#B5D4F4','#F0D060','#C4B5FD','#FCA5A5','#6EE7B7'];

  var html = '';
  CMS_PROGRAM.forEach(function (p, i) {
    var bg  = bgColors[i  % bgColors.length];
    var bdr = borderColors[i % borderColors.length];
    var pills = (p.tags || []).map(function (t) {
      return '<span class="prog-pill">' + t + '</span>';
    }).join('');

    html +=
      '<div class="prog-kartu" style="background:' + bg + ';border-color:' + bdr + '">' +
        '<div class="prog-header">' +
          '<span class="prog-emoji">' + (p.emoji || '📖') + '</span>' +
          '<div><div class="prog-nama">' + p.nama + '</div></div>' +
        '</div>' +
        '<div class="prog-desc">' + (p.desc || '') + '</div>' +
        '<div class="prog-pills">' + pills + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ─────────────────────────────────────────────
// HELPER: Format tanggal "2026-04-08" → "08 Apr 2026"
// ─────────────────────────────────────────────
function formatTgl(str) {
  if (!str) return '';
  var bulan = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var parts = str.split('-');
  if (parts.length < 3) return str;
  return parts[2] + ' ' + (bulan[parseInt(parts[1])] || parts[1]) + ' ' + parts[0];
}
