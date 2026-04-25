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

// -- RENDER BERITA --
function renderBerita() {
  var el = document.getElementById('cms-berita');
  if (!el) return;
  var html = '';
  CMS_BERITA.slice(0, 6).forEach(function (b) {
    html += `
      <div class="berita-kartu">
        <div class="berita-img">${b.emoji || '📋'}</div>
        <div class="berita-konten">
          <span class="badge-info">${b.kategori || 'Info'}</span>
          <h4>${b.judul}</h4>
          <p>${b.ringkasan || ''}</p>
        </div>
      </div>`;
  });
  el.innerHTML = html;
}

// -- RENDER GALERI --
function renderGaleri() {
  var el = document.getElementById('cms-galeri');
  if (!el) return;
  var html = '';
  CMS_GALERI.forEach(function (g) {
    var imgUrl = fixGDriveUrl(g.url);
    html += `
      <div class="galeri-item">
        <img src="${imgUrl}" alt="${g.caption}" loading="lazy">
        <div class="galeri-overlay"><span>${g.caption}</span></div>
      </div>`;
  });
  el.innerHTML = html;
}

// -- HELPER: FIX GOOGLE DRIVE URL --
function fixGDriveUrl(url) {
  if (!url) return '';
  var m = url.match(/\/file\/d\/(.+)\//) || url.match(/id=(.+)/);
  if (m) return 'https://drive.google.com/thumbnail?id=' + m[1].split('&')[0] + '&sz=w600';
  return url;
}
