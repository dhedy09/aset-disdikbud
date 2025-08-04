// Auth
if (sessionStorage.getItem('kode_akses') !== ADMIN_KODE) {
  window.location.href = '../index.html';
}

// Data fetch
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-ZVKkBynVCn0tngHrVdzDzFd7oauVIINSFCIrgC1SyHj49ru4TGX9O2ciOu9aLzD4KgkB1kA3npvL/pub?output=csv';
let allData = [];

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    allData = results.data.map(row => ({
      kode_akses: row.kode_akses || '',
      nama_sekolah: row.nama_sekolah || '',
      kecamatan: row.kecamatan || '',
      operator: row.operator || '',
      alamat_link: row.alamat_link || ''
    }));
    initDropdown(allData);
    displaySchools(allData);
  }
});

function initDropdown(data) {
  const filter = document.getElementById('filterKecamatan');
  const kecamatanSet = new Set(data.map(item => item.kecamatan));
  filter.innerHTML = '<option value="">-- Semua Kecamatan --</option>';
  Array.from(kecamatanSet).sort().forEach(kec => {
    const option = document.createElement('option');
    option.value = kec;
    option.textContent = kec;
    filter.appendChild(option);
  });
}

function displaySchools(data, keyword = '') {
  const list = document.getElementById('schoolList');
  list.innerHTML = '';

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'school-name';

    if (keyword) {
      const regex = new RegExp(`(${keyword})`, 'gi');
      div.innerHTML = item.nama_sekolah.replace(regex, `<span class="highlight">$1</span>`);
    } else {
      div.textContent = item.nama_sekolah;
    }

    div.addEventListener('click', () => showDetails(item, div));
    list.appendChild(div);
  });
}

function showDetails(item, container) {
  const oldDetails = document.querySelectorAll('.details');
  oldDetails.forEach(el => el.remove());

  const detailDiv = document.createElement('div');
  detailDiv.className = 'details';
  detailDiv.innerHTML = `
    <strong>Kode Akses:</strong> ${item.kode_akses}
    <button class="copy-btn" onclick="copyKodeAkses('${item.kode_akses}')">Salin</button><br>
    <strong>Kecamatan:</strong> ${item.kecamatan}<br>
    <strong>Operator:</strong> ${item.operator}<br><br>
    ${item.alamat_link
      ? `<div>
          File kertas kerja sudah ada, silahkan klik tombol lanjutkan di bawah ini.<br><br>
          <a href="${item.alamat_link}" target="_blank" class="lanjut-link">
            <button class="lanjut-btn">Lanjutkan</button>
          </a>
        </div>`
      : `<div>File kertas kerja belum ada, silahkan buat dulu.</div>`}
  `;
  container.insertAdjacentElement('afterend', detailDiv);
}

document.getElementById('filterKecamatan').addEventListener('change', filterAndSearch);
document.getElementById('searchInput').addEventListener('input', filterAndSearch);
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('searchInput').placeholder = 'Cari nama sekolah...';
  document.getElementById('searchInput').value = '';
  document.getElementById('filterKecamatan').value = '';
  displaySchools(allData);
});

document.getElementById('exportExcelBtn').addEventListener('click', () => {
  const dataToExport = getDisplayedData();
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daftar Sekolah");
  XLSX.writeFile(wb, "kode akses.xlsx");
});

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("helvetica");

  const dataToExport = getDisplayedData();
  if (dataToExport.length === 0) {
    showToast("Tidak ada data untuk diekspor.");
    return;
  }

  const headers = [["No", "Nama Sekolah", "Kode Akses", "Kecamatan", "Operator"]];
  const body = dataToExport.map((item, index) => [
    index + 1,
    item.nama_sekolah,
    item.kode_akses,
    item.kecamatan,
    item.operator
  ]);

  doc.autoTable({
    head: headers,
    body: body,
    startY: 20,
    theme: 'striped',
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 40 }
    }
  });

  doc.save("daftar-sekolah.pdf");
});

function getDisplayedData() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const kecamatan = document.getElementById('filterKecamatan').value;

  return allData.filter(item => {
    const matchKeyword = item.nama_sekolah.toLowerCase().includes(keyword);
    const matchKecamatan = kecamatan ? item.kecamatan === kecamatan : true;
    return matchKeyword && matchKecamatan;
  });
}

function copyKodeAkses(kode) {
  navigator.clipboard.writeText(kode).then(() => {
    showToast(`Kode akses "${kode}" berhasil disalin.`);
  }).catch(err => {
    showToast("Gagal menyalin kode akses.");
    console.error(err);
  });
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function filterAndSearch() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const kecamatan = document.getElementById('filterKecamatan').value;

  const filtered = allData.filter(item => {
    const matchKeyword = item.nama_sekolah.toLowerCase().includes(keyword);
    const matchKecamatan = kecamatan ? item.kecamatan === kecamatan : true;
    return matchKeyword && matchKecamatan;
  });

  displaySchools(filtered, keyword);
}
