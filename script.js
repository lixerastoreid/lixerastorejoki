
/* =====================================
   LIXERA JOKI GAME — script.js
   ===================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ==============================
  // KONFIGURASI
  // ==============================

  const ADMIN_WA = "628818238236";
  const QRIS_IMAGE = "qrislixera.png";
  const DELAY_KONFIRMASI = 15000;

  // Harga ini masih contoh.
  // Nanti ganti dengan harga final dari kamu.
  const HARGA_RANK = {
    grandmaster: 4000,
    epic: 6000,
    legend: 8000,
    mythic: 18000,
    honor: 25000,
    glory: 30000,
    immortal: 34000
  };

  const HARGA_GENDONG = {};

  let dataPesanan = null;
  let timerKonfirmasi = null;

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const rupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(Number(angka) || 0);

  const bersih = (nilai) => String(nilai ?? "").trim();

  // ==============================
  // NAVIGASI HALAMAN TERTUTUP
  // ==============================

  function tampilkanHalaman(nama) {
    const halaman = $$(".page, .halaman, [data-page]");

    halaman.forEach((el) => {
      const id = el.dataset.page || el.id;
      const cocok =
        id === nama ||
        id === `page-${nama}` ||
        id === `halaman-${nama}`;

      el.hidden = !cocok;
      el.classList.toggle("active", cocok);
    });

    $$("[data-nav]").forEach((tombol) => {
      tombol.classList.toggle(
        "active",
        tombol.dataset.nav === nama
      );
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$("[data-nav]").forEach((tombol) => {
    tombol.addEventListener("click", () => {
      tampilkanHalaman(tombol.dataset.nav);
    });
  });

  // Tombol masuk dari intro.
  const tombolMasuk = $(
    "#masukWebsite, #btnMasuk, [data-masuk-website]"
  );

  if (tombolMasuk) {
    tombolMasuk.addEventListener("click", () => {
      const intro = $("#intro, #introScreen, .intro-screen");

      if (intro) intro.hidden = true;

      const utama = $("#home, #homePage, #halamanUtama");

      if (utama) {
        utama.hidden = false;
        utama.classList.add("active");
      }
    });
  }

  // ==============================
  // SLIDER BANNER
  // ==============================

  const slider = $(
    "#bannerSlider, .banner-slider, [data-banner-slider]"
  );

  if (slider) {
    const slides = $$(".slide, .banner-slide", slider);
    const dots = $$(".slider-dot, [data-slide-to]");

    if (slides.length > 1) {
      let indexSlide = 0;

      function pindahSlide(index) {
        indexSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
          slide.hidden = i !== indexSlide;
          slide.classList.toggle("active", i === indexSlide);
        });

        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === indexSlide);
        });
      }

      dots.forEach((dot, i) => {
        dot.addEventListener("click", () => pindahSlide(i));
      });

      const tombolSebelumnya = $(
        ".slider-prev, [data-slide-prev]",
        slider
      );

      const tombolBerikutnya = $(
        ".slider-next, [data-slide-next]",
        slider
      );

      if (tombolSebelumnya) {
        tombolSebelumnya.addEventListener("click", () =>
          pindahSlide(indexSlide - 1)
        );
      }

      if (tombolBerikutnya) {
        tombolBerikutnya.addEventListener("click", () =>
          pindahSlide(indexSlide + 1)
        );
      }

      pindahSlide(0);

      // Otomatis bergeser setiap 5 detik.
      setInterval(() => pindahSlide(indexSlide + 1), 5000);
    }
  }

  // ==============================
  // KALKULATOR JOKI RANK
  // ==============================

  const FORM_RANK = $(
    "#formRank, #rankForm, [data-form-rank]"
  );

  const rankAwal = $("#rankAwal, #rank, [name='rankAwal']");
  const rankTujuan = $(
    "#rankTujuan, #target, [name='rankTujuan']"
  );

  const bintangAwal = $(
    "#bintangAwal, #stars, [name='bintangAwal']"
  );

  const bintangTujuan = $(
    "#bintangTujuan, [name='bintangTujuan']"
  );

  const totalRank = $("#totalRank, #total, [data-total-rank]");
  const rincianRank = $("#rincianRank, #priceNote");

  const urutanRank = [
    "grandmaster",
    "epic",
    "legend",
    "mythic",
    "honor",
    "glory",
    "immortal"
  ];

  function angka(value, fallback = 0) {
    const hasil = Number(value);
    return Number.isFinite(hasil) ? hasil : fallback;
  }

  function posisiRank(namaRank, bintang = 0) {
    const nama = bersih(namaRank).toLowerCase();

    // Urutan rank dapat memakai label Indonesia/Inggris.
    const alias = {
      gm: "grandmaster",
      grandmaster: "grandmaster",
      epic: "epic",
      efic: "epic",
      efik: "epic",
      legend: "legend",
      mythic: "mythic",
      mitik: "mythic",
      honor: "honor",
      honours: "honor",
      glory: "glory",
      immortal: "immortal",
      imo: "immortal"
    };

    const rank = alias[nama] || nama;
    const urutan = urutanRank.indexOf(rank);

    if (urutan < 0) return null;

    if (rank === "grandmaster" ||
        rank === "epic" ||
        rank === "legend") {
      const divisi = {
        v: 0, "5": 0,
        iv: 1, "4": 1,
        iii: 2, "3": 2,
        ii: 3, "2": 3,
        i: 4, "1": 4
      };

      const bagian = bersih(
        $("[name='divisiAwal']")?.value ||
        $("[name='divisiTujuan']")?.value ||
        "V"
      ).toLowerCase();

      const nilaiDivisi = divisi[bagian] ?? 0;

      return {
        nama: rank,
        posisi: urutan * 25 + nilaiDivisi * 5 +
          Math.max(0, Math.min(5, angka(bintang))),
        urutan
      };
    }

    // Mythic, Honor, Glory dan Immortal memakai
    // angka berkelanjutan, tidak di-reset ke nol.
    const batas = {
      mythic: 0,
      honor: 25,
      glory: 50,
      immortal: 100
    };

    return {
      nama: rank,
      posisi: batas[rank] + Math.max(0, angka(bintang)),
      urutan
    };
  }

  function hitungRank() {
    if (!rankAwal || !rankTujuan || !totalRank) return;

    const awal = posisiRank(
      rankAwal.value,
      bintangAwal?.value
    );

    const tujuan = posisiRank(
      rankTujuan.value,
      bintangTujuan?.value
    );

    if (!awal || !tujuan) {
      totalRank.textContent = "Pilih rank terlebih dahulu";
      return;
    }

    if (tujuan.posisi <= awal.posisi) {
      totalRank.textContent = rupiah(0);

      if (rincianRank) {
        rincianRank.textContent =
          "Rank tujuan harus lebih tinggi dari rank awal.";
      }

      return;
    }

    let total = 0;
    const rincian = [];

    // Harga ditambahkan satu per satu sesuai rank
    // yang sedang dikerjakan, bukan dikalikan.
    for (let posisi = awal.posisi + 1;
         posisi <= tujuan.posisi;
         posisi++) {
      let namaRank;

      if (posisi < 25) namaRank = "grandmaster";
      else if (posisi < 50) namaRank = "epic";
      else if (posisi < 75) namaRank = "legend";
      else if (posisi < 100) namaRank = "mythic";
      else if (posisi < 125) namaRank = "honor";
      else if (posisi < 175) namaRank = "glory";
      else namaRank = "immortal";

      // Perhitungan rank berkelanjutan:
      // Mythic 0–24, Honor 25–49, Glory 50–99,
      // Immortal 100 ke atas.
      if (posisi >= 100) namaRank = "immortal";
      else if (posisi >= 50) namaRank = "glory";
      else if (posisi >= 25) namaRank = "honor";
      else if (posisi >= 0) namaRank = "mythic";

      // Perhitungan tier GM/Epic/Legend menggunakan
      // 25 langkah per tier.
      if (posisi < 25) namaRank = "grandmaster";
      else if (posisi < 50) namaRank = "epic";
      else if (posisi < 75) namaRank = "legend";

      const harga = angka(HARGA_RANK[namaRank]);
      total += harga;
      rincian.push(`${namaRank}: ${rupiah(harga)}`);
    }

    totalRank.textContent = rupiah(total);

    if (rincianRank) {
      rincianRank.textContent =
        `Total ${tujuan.posisi - awal.posisi} langkah. Harga dijumlahkan satu per satu.`;
    }

    if (FORM_RANK) {
      FORM_RANK.dataset.total = String(total);
    }
  }

  [rankAwal, rankTujuan, bintangAwal, bintangTujuan]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener("change", hitungRank);
      el.addEventListener("input", hitungRank);
    });

  // ==============================
  // FORM PEMESANAN
  // ==============================

  const formPesanan = $(
    "#formPesanan, #orderForm, [data-form-pesanan]"
  );

  function ambilNilai(form, nama) {
    return bersih(
      form.querySelector(`[name="${nama}"]`)?.value ||
      form.querySelector(`#${nama}`)?.value
    );
  }

  function buatNomorOrder() {
    return "LXR" + Date.now().toString().slice(-8);
  }

  function buatPesanWhatsApp(data) {
    return [
      "Halo min, saya sudah melakukan pemesanan JOKI LIXERA.",
      "",
      `Nomor order: ${data.nomor}`,
      `Jenis layanan: ${data.layanan}`,
      `Nama: ${data.nama}`,
      `No. WhatsApp: ${data.wa || "-"}`,
      `Nick ML: ${data.nick || "-"}`,
      `ID ML: ${data.id || "-"}`,
      `Rank awal: ${data.rankAwal || "-"}`,
      `Rank tujuan: ${data.rankTujuan || "-"}`,
      `Catatan/request: ${data.catatan || "-"}`,
      `Total pembayaran: ${rupiah(data.total)}`,
      "",
      "Saya sudah membayar. Mohon konfirmasi pesanan saya, min. Terima kasih."
    ].join("\n");
  }

  function bukaPopupPembayaran(data) {
    const popup = $(
      "#popupPembayaran, #paymentModal, [data-popup-pembayaran]"
    );

    if (!popup) {
      alert(
        "Data pesanan siap, tetapi popup pembayaran tidak ditemukan di index.html."
      );
      return;
    }

    const hargaEl = $(
      "#hargaPembayaran, #paymentTotal, [data-harga-pembayaran]",
      popup
    );

    const nomorEl = $(
      "#nomorOrder, #orderNumber, [data-nomor-order]",
      popup
    );

    const gambarQR = $(
      "#gambarQR, #qrisImage, [data-qris-image]",
      popup
    );

    if (hargaEl) hargaEl.textContent = rupiah(data.total);
    if (nomorEl) nomorEl.textContent = data.nomor;

    if (gambarQR) {
      gambarQR.src = QRIS_IMAGE;
      gambarQR.alt = "QRIS LIXERA";
    }

    popup.hidden = false;
    popup.classList.add("active");

    const tombolKonfirmasi = $(
      "#konfirmasiPembayaran, #btnKonfirmasi, [data-konfirmasi-pembayaran]",
      popup
    );

    if (tombolKonfirmasi) {
      tombolKonfirmasi.disabled = false;
      tombolKonfirmasi.textContent = "Konfirmasi via WhatsApp";

      tombolKonfirmasi.onclick = () => {
        tombolKonfirmasi.disabled = true;
        tombolKonfirmasi.textContent =
          "Menyiapkan WhatsApp...";

        clearTimeout(timerKonfirmasi);

        // Jeda 15 detik sebelum membuka WhatsApp.
        timerKonfirmasi = setTimeout(() => {
          const pesan = encodeURIComponent(
            buatPesanWhatsApp(data)
          );

          window.location.href =
            `https://wa.me/${ADMIN_WA}?text=${pesan}`;

          tombolKonfirmasi.disabled = false;
          tombolKonfirmasi.textContent =
            "Konfirmasi via WhatsApp";
        }, DELAY_KONFIRMASI);
      };
    }
  }

  if (formPesanan) {
    formPesanan.addEventListener("submit", (event) => {
      event.preventDefault();

      const layanan =
        formPesanan.dataset.layanan ||
        $("input[name='layanan']:checked", formPesanan)?.value ||
        $("#jenisLayanan")?.value ||
        "Joki Rank";

      const data = {
        nomor: buatNomorOrder(),
        layanan,
        nama: ambilNilai(formPesanan, "nama"),
        wa: ambilNilai(formPesanan, "wa"),
        nick: ambilNilai(formPesanan, "nick"),
        id: ambilNilai(formPesanan, "id"),
        rankAwal: ambilNilai(formPesanan, "rankAwal"),
        rankTujuan: ambilNilai(formPesanan, "rankTujuan"),
        catatan: ambilNilai(formPesanan, "catatan") ||
          ambilNilai(formPesanan, "request"),
        total: angka(
          formPesanan.dataset.total ||
          $("#totalRank")?.dataset.total ||
          $("#totalRank")?.textContent.replace(/\D/g, "")
        )
      };

      if (!data.nama) {
        alert("Nama wajib diisi.");
        return;
      }

      if (layanan.toLowerCase().includes("gendong") &&
          (!data.nick || !data.id)) {
        alert("Nick ML dan ID ML wajib diisi untuk joki gendong.");
        return;
      }

      if (data.total <= 0) {
        alert("Total harga belum tersedia. Periksa pilihan dan harga.");
        return;
      }

      dataPesanan = data;
      bukaPopupPembayaran(data);
    });
  }

  // ==============================
  // TUTUP POPUP
  // ==============================

  $$("[data-tutup-popup], #tutupPopup, #closePayment").forEach(
    (tombol) => {
      tombol.addEventListener("click", () => {
        const popup = tombol.closest(
          "#popupPembayaran, #paymentModal, [data-popup-pembayaran]"
        );

        if (popup) {
          popup.hidden = true;
          popup.classList.remove("active");
        }
      });
    }
  );

  // Fungsi global bila HTML menggunakan onclick.
  window.LIXERA = {
    rupiah,
    tampilkanHalaman,
    hitungRank,
    bukaPopupPembayaran
  };

  console.log("LIXERA JOKI GAME siap.");
});
    
