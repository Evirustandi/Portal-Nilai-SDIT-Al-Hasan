/**
 * firebase-config.js — SDIT Al-Hasan
 * ============================================================
 * CARA MENGISI CONFIG:
 * 1. Buka https://console.firebase.google.com
 * 2. Pilih project Anda → Project Settings (ikon gear)
 * 3. Scroll ke bawah → "Your apps" → pilih </> (Web)
 * 4. Copy nilai apiKey, authDomain, dst → paste di bawah
 * 5. Upload file ini ke GitHub bersama file lainnya
 * ============================================================
 */

// ✏️ GANTI NILAI DI BAWAH INI DENGAN CONFIG FIREBASE ANDA
export const firebaseConfig = {
  apiKey: "AIzaSyBc6Xx8f2Y0NsZ3eMphEzadbDP4K4rFt1w",
  authDomain: "sdital-hasan.firebaseapp.com",
  projectId: "sdital-hasan",
  storageBucket: "sdital-hasan.firebasestorage.app",
  messagingSenderId: "499840534324",
  appId: "1:499840534324:web:78b53daa11443fc258c761",
  measurementId: "G-81YC02102W"
};

/**
 * STRUKTUR KOLEKSI FIRESTORE:
 * ─────────────────────────────────────────────────────────
 * berita/      → dokumen berita & pengumuman
 * galeri/      → dokumen foto galeri
 * guru/        → dokumen data guru & staf
 * program/     → dokumen program sekolah
 * spmb/        → dokumen data pendaftar SPMB
 * siswa/       → dokumen data siswa (NISN sebagai ID)
 *   └─ nilai/  → sub-koleksi nilai per ulangan
 * users/       → dokumen akun user admin/guru
 * settings/    → dokumen pengaturan website
 *
 * ATURAN FIRESTORE (Firestore Rules):
 * ─────────────────────────────────────────────────────────
 * Paste rules berikut di Firebase Console → Firestore → Rules:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // Koleksi publik (boleh dibaca siapa saja)
 *     match /berita/{id}   { allow read: if true; allow write: if request.auth != null; }
 *     match /galeri/{id}   { allow read: if true; allow write: if request.auth != null; }
 *     match /guru/{id}     { allow read: if true; allow write: if request.auth != null; }
 *     match /program/{id}  { allow read: if true; allow write: if request.auth != null; }
 *     match /spmb/{id}     { allow read, write: if request.auth != null; }
 *
 *     // Nilai siswa (hanya bisa dibaca jika tahu NISN)
 *     match /siswa/{nisn}  { allow read: if true; allow write: if request.auth != null; }
 *
 *     // User admin (hanya admin yang bisa kelola)
 *     match /users/{id}    { allow read, write: if request.auth != null; }
 *
 *     // Settings
 *     match /settings/{id} { allow read: if true; allow write: if request.auth != null; }
 *   }
 * }
 */
