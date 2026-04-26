// ============================================================
// firebase-admin.js — CMS Admin SDIT Al-Hasan + Firebase
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection, doc,
  addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBc6Xx8f2Y0NsZ3eMphEzadbDP4K4rFt1w",
  authDomain: "sdital-hasan.firebaseapp.com",
  projectId: "sdital-hasan",
  storageBucket: "sdital-hasan.firebasestorage.app",
  messagingSenderId: "499840534324",
  appId: "1:499840534324:web:78b53daa11443fc258c761"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── GLOBAL STATE ──────────────────────────────────────────
let ME           = null;
let DATA_NILAI   = [];

// ── AUTHENTICATION ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  const loading = document.getElementById('loading-screen');
  if (user) {
    // Ambil data profil dari Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      ME = userDoc.data();
      document.getElementById('admin-name').textContent = ME.nama || "Administrator";
      if (loading) loading.classList.add('hidden');
      initDashboard();
    } else {
      // Jika user terdaftar di Auth tapi tidak ada di koleksi 'users'
      console.warn("User profile not found in Firestore.");
      await signOut(auth);
      window.location.href = 'login.html'; // atau halaman login Anda
    }
  } else {
    // Belum login, lempar ke halaman login jika bukan di index
    if (!window.location.pathname.includes('login.html')) {
        // window.location.href = 'login.html';
    }
  }
});

// ── FUNGSI YANG DI-EXPORT ─────────────────────────────────

// 1. Logout
export const handleLogout = async () => {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    try {
      await signOut(auth);
      location.reload();
    } catch (e) {
      alert("Gagal logout: " + e.message);
    }
  }
};

// 2. Export Data ke data.js (Backup)
export const exportDataJS = async () => {
  try {
    const beritaSnap = await getDocs(collection(db, 'berita'));
    const galeriSnap = await getDocs(collection(db, 'galeri'));
    const guruSnap   = await getDocs(collection(db, 'guru'));
    const programSnap = await getDocs(collection(db, 'program'));
    const spmbSnap   = await getDocs(collection(db, 'spmb'));

    const toArr = snap => snap.docs.map(d => {
      const data = d.data();
      delete data.createdAt; 
      delete data.updatedAt;
      return { id: d.id, ...data };
    });

    const jsContent = `// data.js — Backup dari Firebase Firestore
// Tanggal: ${new Date().toLocaleString('id-ID')}

var CMS_BERITA  = ${JSON.stringify(toArr(beritaSnap),  null, 2)};
var CMS_GALERI  = ${JSON.stringify(toArr(galeriSnap),  null, 2)};
var CMS_GURU    = ${JSON.stringify(toArr(guruSnap),    null, 2)};
var CMS_PROGRAM = ${JSON.stringify(toArr(programSnap), null, 2)};
var CMS_SPMB    = ${JSON.stringify(toArr(spmbSnap),    null, 2)};
var DATA_NILAI  = []; // Tambahkan logika fetch nilai jika diperlukan
`;

    const blob = new Blob([jsContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    a.click();
    alert('Backup data.js berhasil diunduh!');
  } catch (e) {
    alert('Gagal export: ' + e.message);
  }
};

// 3. Inisialisasi Dashboard
async function initDashboard() {
  // Query sederhana tanpa OrderBy untuk menghindari masalah Index di awal
  onSnapshot(collection(db, 'berita'), (snap) => {
    document.getElementById('stat-berita').textContent = snap.size;
    renderBeritaList(snap.docs.map(d => ({id: d.id, ...d.data()})));
  });

  onSnapshot(collection(db, 'siswa'), (snap) => {
    document.getElementById('stat-siswa').textContent = snap.size;
  });
}

function renderBeritaList(data) {
  const container = document.getElementById('list-berita');
  if (!container) return;
  
  if (data.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-400 py-10">Belum ada berita.</p>';
    return;
  }

  container.innerHTML = data.map(b => `
    <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
      <div>
        <h4 class="font-bold text-navy-900">${b.judul}</h4>
        <p class="text-xs text-slate-500">${b.kategori || 'Berita'}</p>
      </div>
      <div class="flex gap-2">
        <button class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i class="ph ph-pencil"></i></button>
        <button class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i class="ph ph-trash"></i></button>
      </div>
    </div>
  `).join('');
}

// ── HELPER ────────────────────────────────────────────────
window.fixGDriveUrl = function(url) {
    if (!url) return '';
    return url.replace('file/d/', 'uc?export=view&id=').replace('/view?usp=drive_link', '').replace('/view?usp=sharing', '');
};
