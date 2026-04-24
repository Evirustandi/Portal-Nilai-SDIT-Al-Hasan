const URL = "https://docs.google.com/spreadsheets/d/1xzAbbQXxHMUGVl2fjWX64mOq6qU0JpnjEV2hKydg_5g/edit?usp=sharing";

async function cariData() {
  const nisn = document.getElementById("nisn").value;
  const dob = document.getElementById("dob").value;

  const res = await fetch(URL);
  const data = await res.json();

  const siswa = data.find(s => 
    s.NISN === nisn && s.TanggalLahir === dob
  );

  if (!siswa) {
    alert("Data tidak ditemukan!");
    return;
  }

  document.getElementById("hasil").classList.remove("hidden");

  document.getElementById("nama").innerText = "Nama: " + siswa.Nama;
  document.getElementById("kelas").innerText = "Kelas: " + siswa.Kelas;

  const tbody = document.getElementById("nilai");
  tbody.innerHTML = `
    <tr><td>MTK</td><td>${siswa.MTK}</td></tr>
    <tr><td>Bahasa Indonesia</td><td>${siswa.BINDO}</td></tr>
    <tr><td>IPA</td><td>${siswa.IPA}</td></tr>
  `;
}
