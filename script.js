const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-ZVKkBynVCn0tngHrVdzDzFd7oauVIINSFCIrgC1SyHj49ru4TGX9O2ciOu9aLzD4KgkB1kA3npvL/pub?output=csv';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwQi1WI__3-1CePTePIIvT55g5YASBlTDrCmttVyPK7FbYy2EB4XbqLovr3w_TRSi-sUA/exec';

let dataSekolah = [];

async function ambilData() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const rows = text.trim().split('\n').map(row => row.split(','));
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
    return obj;
  });
}

async function cekKode() {
  const kode = document.getElementById('kodeAkses').value.trim().toLowerCase();
  if (!kode) return alert("Silakan masukkan kode akses.");

  if (kode === "admin889") {
    const adminBtn = document.getElementById('adminBtn');
    adminBtn.style.display = 'inline-block';
    adminBtn.onclick = () => window.open('kd_akses', '_blank');
    sessionStorage.setItem('kode_akses', 'admin889');
    return;
  }

  if (!dataSekolah.length) {
    try { dataSekolah = await ambilData(); }
    catch (e) { alert('Gagal mengambil data: ' + e); return; }
  }

  const hasil = dataSekolah.find(x => x.kode_akses.toLowerCase() === kode);
  if (hasil) {
    document.getElementById('school-name').innerText = hasil.nama_sekolah;
    document.getElementById('openLink').setAttribute('data', JSON.stringify(hasil));
    document.getElementById('kodeLabel').innerText = 'Kode Akses: ' + hasil.kode_akses;
    document.getElementById('kodeLabel').style.display = 'inline-block';
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('result-box').classList.add('show');
    document.getElementById('adminBtn').style.display = 'none';
  } else {
    alert('Kode akses tidak ditemukan.');
  }
}

async function bukaLink() {
  const raw = document.getElementById('openLink').getAttribute('data');
  if (!raw) return;
  const data = JSON.parse(raw);

  if (data.alamat_link && data.alamat_link.startsWith('http')) {
    window.open(data.alamat_link, '_blank');
  } else {
    try {
      document.getElementById('loading-bar').style.display = 'block';
      document.getElementById('progress-fill').style.width = '30%';

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          kode_akses: data.kode_akses,
          nama_sekolah: data.nama_sekolah,
          kecamatan: data.kecamatan,
          operator: data.operator
        })
      });

      document.getElementById('progress-fill').style.width = '70%';

      const json = await res.json();

      if (json.success && json.url) {
        document.getElementById('progress-fill').style.width = '100%';
        setTimeout(() => {
          document.getElementById('loading-bar').style.display = 'none';
          document.getElementById('progress-fill').style.width = '0%';
          window.open(json.url, '_blank');
        }, 500);
      } else {
        document.getElementById('loading-bar').style.display = 'none';
        alert('Gagal membuat file: ' + (json.error || 'Tidak diketahui.'));
      }
    } catch (err) {
      document.getElementById('loading-bar').style.display = 'none';
      alert('Terjadi kesalahan: ' + err.message);
    }
  }
}

document.getElementById('toggleMode').onclick = () => {
  document.body.classList.toggle('dark');
};

document.getElementById('adminBtn').onclick = () => {
  window.open('cari_kode_akses.html', '_blank');
};

window.onload = () => {
  const kode = sessionStorage.getItem('kode_akses');
  if (kode === 'admin889') {
    document.getElementById('adminBtn').style.display = 'inline-block';
  }
  document.getElementById('kodeAkses').focus();
};

document.getElementById('togglePassword').onclick = function () {
  const input = document.getElementById('kodeAkses');
  const icon = this;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
};
