// Konfigurasi Firebase Anda (Ganti dengan data dari Firebase Console)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSy...", // Ganti dengan milik Anda
  authDomain: "sdit-al-hasan.firebaseapp.com",
  projectId: "sdit-al-hasan",
  storageBucket: "sdit-al-hasan.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fungsi utama untuk mencari nilai
async function cariNilai() {
    const nisnInput = document.getElementById('nisn-input').value; // ID kotak input di HTML
    const btnCari = document.getElementById('btn-cari'); // ID tombol di HTML
    const containerHasil = document.getElementById('hasil-pencarian'); // Tempat munculnya nilai

    if (!nisnInput) {
        alert("Silakan masukkan NISN siswa!");
        return;
    }

    // Tampilkan status loading
    btnCari.disabled = true;
    btnCari.innerText = "Mencari...";
    containerHasil.innerHTML = "<p>Sedang mengambil data...</p>";

    try {
        // Query ke Firebase: Cari di koleksi 'nilai_siswa' yang NISN-nya cocok
        const q = query(collection(db, "nilai_siswa"), where("nisn", "==", nisnInput));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            containerHasil.innerHTML = `
                <div style="color: red; padding: 20px; border: 1px solid red;">
                    NISN ${nisnInput} tidak ditemukan. Pastikan nomor yang dimasukkan benar.
                </div>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Tampilkan data ke layar (Sesuaikan dengan desain Anda)
                containerHasil.innerHTML = `
                    <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; border-left: 5px solid #0D2147;">
                        <h3>Hasil Pencarian:</h3>
                        <p><strong>Nama:</strong> ${data.nama}</p>
                        <p><strong>NISN:</strong> ${data.nisn}</p>
                        <p><strong>Nilai:</strong> <span style="font-size: 20px; color: green;">${data.nilai}</span></p>
                    </div>`;
            });
        }
    } catch (error) {
        console.error("Error:", error);
        containerHasil.innerHTML = "Terjadi kesalahan sistem saat mengambil data.";
    } finally {
        btnCari.disabled = false;
        btnCari.innerText = "Lihat Nilai";
    }
}

// Pasang fungsi ke tombol saat halaman siap
document.getElementById('btn-cari').addEventListener('click', cariNilai);
