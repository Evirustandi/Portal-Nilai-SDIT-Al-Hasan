# Template Audit "Siapa Mengubah Apa"

Gunakan file CSV `template_audit_perubahan.csv` sebagai log harian perubahan.

## Definisi Kolom
- **tanggal**: tanggal perubahan (YYYY-MM-DD)
- **waktu**: jam perubahan (HH:MM)
- **nama_petugas**: nama operator yang melakukan perubahan
- **modul**: Berita / Galeri / Guru / Program / SPMB / Nilai / User
- **aksi**: Tambah / Ubah / Hapus / Nonaktifkan
- **ringkasan_perubahan**: deskripsi singkat perubahan
- **link_referensi**: URL konten jika ada
- **status_validasi**: Draft / Tervalidasi / Revisi
- **validator**: nama pemeriksa (jika ada)
- **catatan**: catatan tambahan

## Aturan Pengisian
1. Satu perubahan penting = satu baris.
2. Isi segera setelah perubahan selesai.
3. Konten sensitif wajib punya validator.
4. Simpan file ini sebagai arsip bulanan (contoh: `audit-2026-04.csv`).
