/**
 * cms-integration.js
 * Letakkan file ini di folder website/ bersama index.html
 * File ini membaca data dari data/data.js dan memperbarui tampilan website otomatis
 */

// Tunggu data.js dan DOM siap
document.addEventListener('DOMContentLoaded', function () {
  if (typeof CMS_BERITA !== 'undefined') renderBeritaWebsite();
  if (typeof CMS_GALERI !== 'undefined') renderGaleriWebsite();
  if (typeof CMS_GURU   !== 'undefined') renderGuruWebsite();
  if (typeof CMS_PROGRAM !== 'undefined') renderProgramWebsite();
  if (typeof CMS_SETELAN !== 'undefined') terapkanSetelan();
  if (typeof DATA_NILAI   !== 'undefined') window._DATA_NILAI = DATA_NILAI;
});

// ── Setelan ──────────────────────────────────────────
function terapkanSetelan() {
  var s = CMS_SETELAN;
  // Ganti semua teks nama sekolah
  document.querySelectorAll('[data-cms="nama"]').forEach(function(el){ el.textContent = s.nama; });
  document.querySelectorAll('[data-cms="singkat"]').forEach(function(el){ el.textContent = s.singkat; });
  document.querySelectorAll('[data-cms="tahun"]').forEach(function(el){ el.textContent = s.tahun; });
  document.querySelectorAll('[data-cms="kepsek"]').forEach(function(el){ el.textContent = s.kepsek; });
  document.querySelectorAll('[data-cms="alamat"]').forEach(function(el){ el.textContent = s.alamat; });
  document.querySelectorAll('[data-cms="telp"]').forEach(function(el){ el.textContent = s.telp; });
  document.querySelectorAll('[data-cms="email"]').forEach(function(el){ el.textContent = s.email; });
  document.title = s.singkat + ' — Website Resmi';
}

// ── Berita ───────────────────────────────────────────
function renderBeritaWebsite() {
  var container = document.getElementById('cms-berita');
  if (!container || !CMS_BERITA.length) return;
  var html = '';
  CMS_BERITA.slice(0, 6).forEach(function(b) {
    var bgColor = b.kategori === 'Prestasi' ? '#FFF8E8' : b.kategori === 'Penting' ? '#F0F4FF' : '#E8F5EC';
    var badgeClass = b.kategori === 'Penting' ? 'badge-penting' : b.kategori === 'Prestasi' ? 'badge-prestasi' : 'badge-info';
    html += '<div class="berita-kartu">' +
      '<div class="berita-img" style="background:' + bgColor + '">' + b.emoji + '</div>' +
      '<div class="berita-body">' +
      '<span class="berita-badge ' + badgeClass + '">' + b.kategori + '</span>' +
      '<div class="berita-tgl">' + formatTanggal(b.tgl) + '</div>' +
      '<div class="berita-judul">' + b.judul + '</div>' +
      (b.isi ? '<div class="berita-isi" style="font-size:12px;color:#8A9BB5;margin-top:4px">' + b.isi.substring(0,100) + (b.isi.length>100?'...':'') + '</div>' : '') +
      '</div></div>';
  });
  container.innerHTML = html;
}

// ── Galeri ───────────────────────────────────────────
function renderGaleriWebsite() {
  var container = document.getElementById('cms-galeri');
  if (!container || !CMS_GALERI.length) return;
  var html = '';
  CMS_GALERI.forEach(function(g) {
    html += '<div class="galeri-item">' +
      '<img src="' + g.url + '" alt="' + g.caption + '" loading="lazy">' +
      '<div class="galeri-caption">' + g.caption + '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

// ── Guru / Staf ──────────────────────────────────────
function renderGuruWebsite() {
  var container = document.getElementById('cms-guru');
  if (!container || !CMS_GURU.length) return;
  var html = '';
  CMS_GURU.filter(function(g){ return g.status === 'Aktif'; }).forEach(function(g) {
    html += '<div class="staf-kartu">' +
      '<div class="staf-avatar">' + g.inisial + '</div>' +
      '<div class="staf-nama">' + g.nama + '</div>' +
      '<div class="staf-jabatan">' + g.jabatan + '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

// ── Program ──────────────────────────────────────────
function renderProgramWebsite() {
  var container = document.getElementById('cms-program');
  if (!container || !CMS_PROGRAM.length) return;
  var html = '';
  var bgColors = ['#EDFAF3','#EEF6FF','#FFFBF0','#F5F0FF','#FEF2F2','#F0FFF4'];
  var borderColors = ['#7DCEA0','#B5D4F4','#F0D060','#C4B5FD','#FCA5A5','#6EE7B7'];
  CMS_PROGRAM.forEach(function(p, i) {
    var bg = bgColors[i % bgColors.length];
    var border = borderColors[i % borderColors.length];
    html += '<div class="prog-kartu" style="background:' + bg + ';border-color:' + border + '">' +
      '<div class="prog-header"><span class="prog-emoji">' + p.emoji + '</span>' +
      '<div><div class="prog-nama">' + p.nama + '</div></div></div>' +
      '<div class="prog-desc">' + (p.desc||'') + '</div>' +
      '<div class="prog-pills">' +
      (p.tags||[]).map(function(t){ return '<span class="prog-pill">' + t + '</span>'; }).join('') +
      '</div></div>';
  });
  container.innerHTML = html;
}

// ── Format Tanggal ───────────────────────────────────
function formatTanggal(str) {
  if (!str) return '';
  var bulan = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var parts = str.split('-');
  return parts[2] + ' ' + bulan[parseInt(parts[1])] + ' ' + parts[0];
}
