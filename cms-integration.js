/**
 * cms-integration.js — SDIT Al-Hasan
 * Menghubungkan data.js dengan tampilan website secara otomatis.
 */

document.addEventListener('DOMContentLoaded', function () {
  if (typeof CMS_BERITA  !== 'undefined' && CMS_BERITA.length)  renderBerita();
  if (typeof CMS_GALERI  !== 'undefined' && CMS_GALERI.length)  renderGaleri();
  if (typeof CMS_GURU    !== 'undefined' && CMS_GURU.length)    renderGuru();
  if (typeof CMS_PROGRAM !== 'undefined' && CMS_PROGRAM.length) renderProgram();
});

// ── BERITA ──────────────────────────────────────────────────
function renderBerita() {
  var el = document.getElementById('cms-berita');
  if (!el) return;

  var bgMap    = { 'Prestasi':'#FFF8E8', 'Penting':'#F0F4FF', 'Kegiatan':'#FFF0F5', 'Pengumuman':'#E8F5EC' };
  var badgeMap = { 'Prestasi':'badge-prestasi', 'Penting':'badge-penting', 'Kegiatan':'badge-info', 'Pengumuman':'badge-info' };

  var html = '';
  CMS_BERITA.slice(0, 6).forEach(function (b) {
    html +=
      '<div class="berita-kartu">' +
        '<div class="berita-img" style="background:' + (bgMap[b.kategori]||'#E8F5EC') + '">' + (b.emoji||'📋') + '</div>' +
        '<div class="berita-body">' +
          '<span class="berita-badge ' + (badgeMap[b.kategori]||'badge-info') + '">' + b.kategori + '</span>' +
          '<div class="berita-tgl">' + formatTgl(b.tgl) + '</div>' +
          '<div class="berita-judul">' + b.judul + '</div>' +
          (b.isi ? '<div style="font-size:12px;color:#8A9BB5;margin-top:4px;line-height:1.5">' + b.isi.substring(0,90) + (b.isi.length>90?'...':'') + '</div>' : '') +
        '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ── GALERI ──────────────────────────────────────────────────
function renderGaleri() {
  var el = document.getElementById('cms-galeri');
  if (!el) return;

  var html = '';
  CMS_GALERI.forEach(function (g) {
    // Otomatis konversi Google Drive view URL → thumbnail URL yang bisa ditampilkan
    var url = fixGDriveUrl(g.url);
    html +=
      '<div class="galeri-item">' +
        '<img src="' + url + '" alt="' + g.caption + '" loading="lazy" ' +
          'onerror="this.closest(\'.galeri-item\').style.display=\'none\'">' +
        '<div class="galeri-caption">' + g.caption + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ── GURU / STAF ─────────────────────────────────────────────
function renderGuru() {
  var el = document.getElementById('cms-guru');
  if (!el) return;

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

// ── PROGRAM ─────────────────────────────────────────────────
function renderProgram() {
  var el = document.getElementById('cms-program');
  if (!el) return;

  var bgColors     = ['#EDFAF3','#EEF6FF','#FFFBF0','#F5F0FF','#FEF2F2','#F0FFF4'];
  var borderColors = ['#7DCEA0','#B5D4F4','#F0D060','#C4B5FD','#FCA5A5','#6EE7B7'];

  var html = '';
  CMS_PROGRAM.forEach(function (p, i) {
    html +=
      '<div class="prog-kartu" style="background:' + bgColors[i%bgColors.length] + ';border-color:' + borderColors[i%borderColors.length] + '">' +
        '<div class="prog-header">' +
          '<span class="prog-emoji">' + (p.emoji||'📖') + '</span>' +
          '<div><div class="prog-nama">' + p.nama + '</div></div>' +
        '</div>' +
        '<div class="prog-desc">' + (p.desc||'') + '</div>' +
        '<div class="prog-pills">' +
          (p.tags||[]).map(function(t){return '<span class="prog-pill">'+t+'</span>';}).join('') +
        '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

// ── HELPERS ─────────────────────────────────────────────────

/**
 * Konversi Google Drive share/view URL → URL thumbnail yang bisa ditampilkan di <img>
 * Input : https://drive.google.com/file/d/FILE_ID/view?usp=...
 * Output: https://drive.google.com/thumbnail?id=FILE_ID&sz=w600
 */
function fixGDriveUrl(url) {
  if (!url) return url;
  var m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600';
  return url;
}

function formatTgl(str) {
  if (!str) return '';
  var bln = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var p = str.split('-');
  if (p.length < 3) return str;
  return p[2] + ' ' + (bln[parseInt(p[1])]||p[1]) + ' ' + p[0];
}
