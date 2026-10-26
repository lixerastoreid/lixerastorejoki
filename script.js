const ADMIN_WA = "628818238236";

const rankData = {
  gm:       { name: "Grandmaster", price: 4000, base: 0,   min: 0,   max: 24 },
  epic:     { name: "Epic",        price: 6000, base: 25,  min: 0,   max: 24 },
  legend:   { name: "Legend",      price: 8000, base: 50,  min: 0,   max: 24 },
  mythic:   { name: "Mythic",      price: 18000,base: 75,  min: 0,   max: 24 },
  honor:    { name: "Honor",       price: 25000,base: 75,  min: 25,  max: 49 },
  glory:    { name: "Glory",       price: 30000,base: 75,  min: 50,  max: 99 },
  immortal: { name: "Immortal",    price: 34000,base: 75,  min: 100, max: 10000 }
};

const gendongData = {
  gm:       { name: "Grandmaster", price: 3000 },
  epic:     { name: "Epic",        price: 5000 },
  legend:   { name: "Legend",      price: 7000 },
  mythic:   { name: "Mythic",      price: 15000 },
  honor:    { name: "Honor",       price: 22000 },
  glory:    { name: "Glory",       price: 28000 },
  immortal: { name: "Immortal",    price: 32000 },
  grading:  { name: "Mythic Grading", price: 200000 }
};

let pesanan = null;
let timerQR = null;
let slideIndex = 0;
let slideInterval = null;

function rupiah(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function masukWebsite() {
  document.getElementById("intro").classList.add("intro-hide");
  document.body.classList.remove("intro-open");
  localStorage.setItem("lixeraIntroSeen", "yes");
}

function bukaHalaman(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const halaman = document.getElementById(id);
  if (halaman) halaman.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === id);
  });

  if (id === "pemesanan") perbaruiForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function slideKe(index) {
  const slider = document.getElementById("slider");
  if (!slider) return;
  slideIndex = (index + 3) % 3;
  slider.style.transform = `translateX(-${slideIndex * 100}%)`;

  document.querySelectorAll(".dots button").forEach((dot, i) => {
    dot.classList.toggle("selected", i === slideIndex);
  });
}

function mulaiSlider() {
  slideKe(0);
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => slideKe(slideIndex + 1), 4000);
}

function nilaiGlobal(rank, nilai) {
  const data = rankData[rank];
  if (!data) return null;
  if (!Number.isFinite(nilai) || nilai < data.min || nilai > data.max) return null;

  if (rank === "gm" || rank === "epic" || rank === "legend" || rank === "mythic") {
    return data.base + nilai;
  }
  return nilai + 75;
}

function hitungRank() {
  const awalRank = document.getElementById("rankAwal").value;
  const tujuanRank = document.getElementById("rankTujuan").value;
  const awalNilai = Number(document.getElementById("bintangAwal").value);
  const tujuanNilai = Number(document.getElementById("bintangTujuan").value);
  const hargaEl = document.getElementById("hargaRank");
  const detailEl = document.getElementById("detailRank");

  const awal = nilaiGlobal(awalRank, awalNilai);
  const tujuan = nilaiGlobal(tujuanRank, tujuanNilai);

  if (awal === null || tujuan === null) {
    hargaEl.textContent = "Rp0";
    detailEl.textContent = "Periksa angka bintang/rating sesuai rentang rank.";
    return null;
  }

  if (tujuan <= awal) {
    hargaEl.textContent = "Rp0";
    detailEl.textContent = "Rank tujuan harus lebih tinggi daripada rank awal.";
    return null;
  }

  let total = 0;
  const rincian = {};

  // Setiap kenaikan dihitung satu per satu, bukan dikali satu harga tetap.
  for (let posisi = awal + 1; posisi <= tujuan; posisi++) {
    let kunci = "immortal";
    if (posisi <= 24) kunci = "gm";
    else if (posisi <= 49) kunci = "epic";
    else if (posisi <= 74) kunci = "legend";
    else if (posisi <= 99) kunci = "mythic";
    else if (posisi <= 124) kunci = "honor";
    else if (posisi <= 174) kunci = "glory";

    total += rankData[kunci].price;
    rincian[kunci] = (rincian[kunci] || 0) + 1;
  }

  const detail = Object.entries(rincian)
    .map(([k, jumlah]) => `${rankData[k].name}: ${jumlah} langkah`)
    .join(" • ");

  hargaEl.textContent = rupiah(total);
  detailEl.textContent = `${detail}. Total langkah: ${tujuan - awal}.`;

  return {
    jenis: "Joki Rank",
    rankAwal: rankData[awalRank].name,
    nilaiAwal: awalNilai,
    rankTujuan: rankData[tujuanRank].name,
    nilaiTujuan: tujuanNilai,
    total,
    detail
  };
}

function hitungGendong() {
  const rank = document.getElementById("rankGendong").value;
  const jumlah = Math.floor(Number(document.getElementById("jumlahGendong").value));
  const data = gendongData[rank];

  if (!data || !Number.isFinite(jumlah) || jumlah < 1) {
    document.getElementById("hargaGendong").textContent = "Rp0";
    document.getElementById("detailGendong").textContent = "Masukkan jumlah minimal 1.";
    return null;
  }

  const total = rank === "grading" ? data.price : data.price * jumlah;
  document.getElementById("hargaGendong").textContent = rupiah(total);
  document.getElementById("detailGendong").textContent =
    rank === "grading" ? "Harga paket Mythic Grading" : `${jumlah} bintang/rating × ${rupiah(data.price)}`;

  return {
    jenis: "Joki Gendong",
    paket: data.name,
    jumlah: rank === "grading" ? "Paket grading" : jumlah + " bintang/rating",
    total
  };
}

function gunakanRank() {
  const hasil = hitungRank();
  if (!hasil) {
    alert("Perbaiki rank dan bintang/rating terlebih dahulu.");
    return;
  }

  pesanan = hasil;
  document.getElementById("jenisOrder").value = "Joki Rank";
  document.getElementById("ringkasanJenis").textContent = hasil.jenis;
  document.getElementById("ringkasanPaket").textContent =
    `${hasil.rankAwal} ${hasil.nilaiAwal} → ${hasil.rankTujuan} ${hasil.nilaiTujuan}`;
  document.getElementById("ringkasanHarga").textContent = rupiah(hasil.total);
  bukaHalaman("pemesanan");
}

function gunakanGendong() {
  const hasil = hitungGendong();
  if (!hasil) {
    alert("Periksa pilihan layanan dan jumlahnya.");
    return;
  }

  pesanan = hasil;
  document.getElementById("jenisOrder").value = "Joki Gendong";
  document.getElementById("ringkasanJenis").textContent = hasil.jenis;
  document.getElementById("ringkasanPaket").textContent = `${hasil.paket} — ${hasil.jumlah}`;
  document.getElementById("ringkasanHarga").textContent = rupiah(hasil.total);
  bukaHalaman("pemesanan");
}
function perbaruiForm() {
  const jenis = document.getElementById("jenisOrder").value;
  document.getElementById("formRank").classList.toggle("hidden", jenis !== "Joki Rank");
  document.getElementById("formGendong").classList.toggle("hidden", jenis !== "Joki Gendong");

  document.getElementById("ringkasanJenis").textContent = jenis;

  if (pesanan && pesanan.jenis === jenis) {
    document.getElementById("ringkasanHarga").textContent = rupiah(pesanan.total);
  } else {
    document.getElementById("ringkasanPaket").textContent = "Belum dihitung";
    document.getElementById("ringkasanHarga").textContent = "Rp0";
  }
}

function buatPesanan() {
  const jenis = document.getElementById("jenisOrder").value;
  let detailPemesan = {};

  if (jenis === "Joki Rank") {
    const nama = document.getElementById("namaRank").value.trim();
    const wa = document.getElementById("waRank").value.trim();
    const catatan = document.getElementById("requestRank").value.trim();

    if (!nama || !wa) {
      alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
      return;
    }
    if (!pesanan || pesanan.jenis !== "Joki Rank") {
      alert("Pilih rank awal dan tujuan, lalu tekan PESAN JOKI RANK.");
      bukaHalaman("rank");
      return;
    }
    detailPemesan = { nama, wa, catatan };
  } else {
    const nick = document.getElementById("nickML").value.trim();
    const id = document.getElementById("idML").value.trim();
    const catatan = document.getElementById("catatanGendong").value.trim();

    if (!nick || !id) {
      alert("Isi nickname dan ID/server ML terlebih dahulu.");
      return;
    }
    if (!pesanan || pesanan.jenis !== "Joki Gendong") {
      alert("Pilih layanan dan hitung harga terlebih dahulu.");
      bukaHalaman("gendong");
      return;
    }
    detailPemesan = { nick, id, catatan };
  }

  pesanan.pemesan = detailPemesan;
  tampilkanQR();
}

function tampilkanQR() {
  if (!pesanan || !pesanan.total) {
    alert("Pesanan belum valid. Periksa kembali layanan dan harganya.");
    return;
  }

  document.getElementById("qrJenis").textContent = pesanan.jenis;
  document.getElementById("qrDetail").textContent =
    pesanan.jenis === "Joki Rank"
      ? `${pesanan.rankAwal} ${pesanan.nilaiAwal} → ${pesanan.rankTujuan} ${pesanan.nilaiTujuan}`
      : `${pesanan.paket} — ${pesanan.jumlah}`;

  document.getElementById("qrHarga").textContent = rupiah(pesanan.total);
  document.getElementById("modalQR").classList.remove("hidden");

  const tombol = document.getElementById("btnKonfirmasi");
  const teks = document.getElementById("timerText");
  tombol.disabled = true;

  if (timerQR) clearInterval(timerQR);
  let sisa = 15;
  teks.textContent = `Tombol konfirmasi tersedia dalam ${sisa} detik.`;

  timerQR = setInterval(() => {
    sisa--;
    if (sisa > 0) {
      teks.textContent = `Tombol konfirmasi tersedia dalam ${sisa} detik.`;
    } else {
      clearInterval(timerQR);
      timerQR = null;
      teks.textContent = "Silakan konfirmasi pesanan ke admin.";
      tombol.disabled = false;
    }
  }, 1000);
}

function tutupQR() {
  document.getElementById("modalQR").classList.add("hidden");
  if (timerQR) {
    clearInterval(timerQR);
    timerQR = null;
  }
}

function konfirmasiWA() {
  if (!pesanan || !pesanan.pemesan) {
    alert("Data pesanan tidak ditemukan. Silakan buat pesanan kembali.");
    return;
  }

  const p = pesanan;
  let teks = `Halo Min, saya sudah order di LIXERA STORE.\n\n`;
  teks += `Jenis: ${p.jenis}\n`;

  if (p.jenis === "Joki Rank") {
    teks += `Nama: ${p.pemesan.nama}\n`;
    teks += `No. WhatsApp: ${p.pemesan.wa}\n`;
    teks += `Rank: ${p.rankAwal} ${p.nilaiAwal} → ${p.rankTujuan} ${p.nilaiTujuan}\n`;
    teks += `Rincian: ${p.detail}\n`;
    teks += `Request: ${p.pemesan.catatan || "-"}\n`;
  } else {
    teks += `Nickname ML: ${p.pemesan.nick}\n`;
    teks += `ID/Server: ${p.pemesan.id}\n`;
    teks += `Layanan: ${p.paket}\n`;
    teks += `Jumlah: ${p.jumlah}\n`;
    teks += `Catatan: ${p.pemesan.catatan || "-"}\n`;
  }

  teks += `Total: ${rupiah(p.total)}\n\n`;
  teks += `Mohon konfirmasi pesanan dan pembayaran saya. Terima kasih.`;

  window.open(
    `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(teks)}`,
    "_blank"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("intro-open");

  if (localStorage.getItem("lixeraIntroSeen") === "yes") {
    document.getElementById("intro").classList.add("intro-hide");
    document.body.classList.remove("intro-open");
  }

  mulaiSlider();

  ["rankAwal", "bintangAwal", "rankTujuan", "bintangTujuan"].forEach(id => {
    document.getElementById(id).addEventListener("input", hitungRank);
    document.getElementById(id).addEventListener("change", hitungRank);
  });

  ["rankGendong", "jumlahGendong"].forEach(id => {
    document.getElementById(id).addEventListener("input", hitungGendong);
    document.getElementById(id).addEventListener("change", hitungGendong);
  });

  document.getElementById("jenisOrder").addEventListener("change", perbaruiForm);
  hitungRank();
  hitungGendong();
  perbaruiForm();
});
