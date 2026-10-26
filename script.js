"use strict";

const ADMIN_WA = "628818238236";

const RANKS = [
  { id: "gm", name: "Grandmaster", base: 0, price: 4000, division: true },
  { id: "epic", name: "Epic", base: 25, price: 6000, division: true },
  { id: "legend", name: "Legend", base: 50, price: 8000, division: true },
  { id: "mythic", name: "Mythic", base: 75, price: 18000, division: false },
  { id: "honor", name: "Honor", base: 100, price: 25000, division: false },
  { id: "glory", name: "Glory", base: 125, price: 30000, division: false },
  { id: "immortal", name: "Immortal", base: 175, price: 34000, division: false }
];

const CARRY_PRICES = {
  gm: 3000,
  epic: 5000,
  legend: 7000,
  mythic: 15000,
  honor: 22000,
  glory: 28000,
  immortal: 32000
};

const money = value =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const $ = id => document.getElementById(id);

let currentOrder = null;
let countdownTimer = null;
let toastTimer = null;
let savedOrders = [];

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function showPage(pageId) {
  const page = $(pageId);
  if (!page || !page.classList.contains("page")) return;

  document.querySelectorAll(".page").forEach(item => {
    item.classList.toggle("active", item.id === pageId);
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

/* SLIDER BANNER */
let slideIndex = 0;
const slides = document.querySelector(".slides");
const dots = [...document.querySelectorAll(".dot")];

function showSlide(index) {
  if (!slides || !dots.length) return;
  slideIndex = (index + dots.length) % dots.length;
  slides.style.transform = `translateX(-${slideIndex * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle("active", i === slideIndex));
}

dots.forEach(dot => {
  dot.addEventListener("click", () => showSlide(Number(dot.dataset.slide)));
});

if (dots.length > 1) {
  setInterval(() => showSlide(slideIndex + 1), 5000);
}

/* KALKULATOR RANK */
function getRank(id) {
  return RANKS.find(rank => rank.id === id);
}

function readNumber(id) {
  const input = $(id);
  return input ? Number(input.value) : NaN;
}

/*
  GM/Epic/Legend:
  setiap divisi berisi 5 bintang.
  Mythic dimulai dari 0, Honor 25, Glory 50, Immortal 100.
*/
function getPosition(rankId, division, stars) {
  const rank = getRank(rankId);
  if (!rank || !Number.isFinite(stars)) return null;

  if (rank.division) {
    if (!Number.isFinite(division) || division < 1 || division > 5) {
      return null;
    }
    if (stars < 0 || stars > 4 || !Number.isInteger(stars)) return null;

    const divisionOffset = (5 - division) * 5;
    return rank.base + divisionOffset + stars;
  }

  if (!Number.isInteger(stars)) return null;

  if (rankId === "mythic" && (stars < 0 || stars > 24)) return null;
  if (rankId === "honor" && (stars < 25 || stars > 49)) return null;
  if (rankId === "glory" && (stars < 50 || stars > 99)) return null;
  if (rankId === "immortal" && stars < 100) return null;

  return rank.base + stars - (
    rankId === "mythic" ? 0 :
    rankId === "honor" ? 25 :
    rankId === "glory" ? 50 : 100
  );
}

function formatRank(rankId, division, stars) {
  const rank = getRank(rankId);
  if (!rank) return "-";

  if (rank.division) {
    const roman = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
    return `${rank.name} ${roman[division]} · ${stars} 🌟`;
  }

  return `${rank.name} · ${stars} 🌟`;
}

function updateDivisionFields(prefix) {
  const startId = prefix === "rank" ? "rankStart" : "carryStart";
  const endId = prefix === "rank" ? "rankEnd" : "carryEnd";
  const startWrap = $(prefix === "rank" ? "startDivisionWrap" : "carryStartDivisionWrap");
  const endWrap = $(prefix === "rank" ? "endDivisionWrap" : "carryEndDivisionWrap");

  const start = getRank($(startId).value);
  const end = getRank($(endId).value);

  startWrap.style.display = start && start.division ? "" : "none";
  endWrap.style.display = end && end.division ? "" : "none";

  const startStars = $(prefix === "rank" ? "startStars" : "carryStartStars");
  const endStars = $(prefix === "rank" ? "endStars" : "carryEndStars");

  if (start && !start.division) {
    startStars.min = start.id === "mythic" ? "0" : start.id === "honor" ? "25" : start.id === "glory" ? "50" : "100";
    startStars.max = start.id === "mythic" ? "24" : start.id === "honor" ? "49" : start.id === "glory" ? "99" : "";
  } else {
    startStars.min = "0";
    startStars.max = "4";
  }

  if (end && !end.division) {
    endStars.min = end.id === "mythic" ? "0" : end.id === "honor" ? "25" : end.id === "glory" ? "50" : "100";
    endStars.max = end.id === "mythic" ? "24" : end.id === "honor" ? "49" : end.id === "glory" ? "99" : "";
  } else {
    endStars.min = "0";
    endStars.max = "4";
  }
}

function calculate(prefix) {
  const isRank = prefix === "rank";
  const ids = isRank ? {
    start: "rankStart", startDiv: "startDivision", startStars: "startStars",
    end: "rankEnd", endDiv: "endDivision", endStars: "endStars",
    price: "rankPrice", summary: "rankSummary"
  } : {
    start: "carryStart", startDiv: "carryStartDivision", startStars: "carryStartStars",
    end: "carryEnd", endDiv: "carryEndDivision", endStars: "carryEndStars",
    price: "carryPrice", summary: "carrySummary"
  };

  updateDivisionFields(prefix);

  const startRank = getRank($(ids.start).value);
  const endRank = getRank($(ids.end).value);
  const startStars = readNumber(ids.startStars);
  const endStars = readNumber(ids.endStars);
  const startDiv = startRank.division ? readNumber(ids.startDiv) : null;
  const endDiv = endRank.division ? readNumber(ids.endDiv) : null;

  const startPos = getPosition(startRank.id, startDiv, startStars);
  const endPos = getPosition(endRank.id, endDiv, endStars);

  if (startPos === null || endPos === null || endPos <= startPos) {
    $(ids.price).textContent = money(0);
    $(ids.summary).textContent = "Periksa pilihan rank dan bintang.";
    return null;
  }

  let total = 0;
  const stepPrices = isRank ? RANKS.map(r => r.price) : RANKS.map(r => CARRY_PRICES[r.id]);

  // Tambahkan harga satu bintang demi satu bintang, bukan dikalikan total bintang.
  for (let position = startPos + 1; position <= endPos; position++) {
    let tier;

    if (position <= 25) tier = 0;
    else if (position <= 50) tier = 1;
    else if (position <= 75) tier = 2;
    else if (position <= 100) tier = 3;
    else if (position <= 125) tier = 4;
    else if (position <= 175) tier = 5;
    else tier = 6;

    total += stepPrices[tier];
  }

  const startLabel = formatRank(startRank.id, startDiv, startStars);
  const endLabel = formatRank(endRank.id, endDiv, endStars);
  const count = endPos - startPos;

  $(ids.price).textContent = money(total);
  $(ids.summary).textContent = `${startLabel} → ${endLabel} · ${count} bintang`;

  return {
    service: isRank ? "Joki Rank" : "Joki Gendong",
    startLabel,
    endLabel,
    stars: count,
    total,
    startPos,
    endPos
  };
}
/* UPDATE KALKULATOR SAAT PILIHAN BERUBAH */
[
  "rankStart", "startDivision", "startStars", "rankEnd", "endDivision", "endStars",
  "carryStart", "carryStartDivision", "carryStartStars", "carryEnd",
  "carryEndDivision", "carryEndStars"
].forEach(id => {
  $(id).addEventListener("input", () => {
    calculate(id.startsWith("carry") ? "carry" : "rank");
  });
  $(id).addEventListener("change", () => {
    calculate(id.startsWith("carry") ? "carry" : "rank");
  });
});

calculate("rank");
calculate("carry");

/* RIWAYAT PESANAN */
function renderOrders() {
  const list = $("orderList");

  if (!savedOrders.length) {
    list.innerHTML = '<p class="empty">Belum ada pesanan.</p>';
    return;
  }

  list.replaceChildren();

  [...savedOrders].reverse().forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";

    const title = document.createElement("strong");
    title.textContent = order.service;

    const detail = document.createElement("p");
    detail.textContent = `${order.startLabel} → ${order.endLabel}`;

    const price = document.createElement("p");
    price.textContent = `Total: ${money(order.total)}`;

    const status = document.createElement("p");
    status.textContent = order.status;

    card.append(title, detail, price, status);
    list.appendChild(card);
  });
}

/* MEMBUAT PESANAN */
function makeOrder(type) {
  const isRank = type === "rank";
  const result = calculate(type);

  if (!result) {
    showToast("Periksa rank dan bintang terlebih dahulu.");
    return;
  }

  const name = $(isRank ? "rankName" : "carryName").value.trim();
  const phone = $(isRank ? "rankPhone" : "carryPhone").value.trim();
  const request = $(isRank ? "rankRequest" : "carryRequest").value.trim();

  if (!name || !phone) {
    showToast("Isi nama dan nomor WhatsApp terlebih dahulu.");
    $(isRank ? "rankName" : "carryName").focus();
    return;
  }

  if (!/^[0-9+\s()-]{8,20}$/.test(phone)) {
    showToast("Nomor WhatsApp belum valid.");
    $(isRank ? "rankPhone" : "carryPhone").focus();
    return;
  }

  const order = {
    id: "LX" + Date.now().toString().slice(-8),
    service: result.service,
    name,
    phone,
    startLabel: result.startLabel,
    endLabel: result.endLabel,
    stars: result.stars,
    total: result.total,
    request,
    status: "Menunggu konfirmasi pembayaran"
  };

  if (!isRank) {
    order.nickname = $("carryNick").value.trim();
    order.gameId = $("carryId").value.trim();

    if (!order.nickname || !order.gameId) {
      showToast("Isi nickname dan ID Mobile Legends.");
      return;
    }
  }

  currentOrder = order;
  openPayment(order);
}

/* POPUP QRIS DAN HITUNG MUNDUR */
function openPayment(order) {
  clearInterval(countdownTimer);

  $("paymentPrice").textContent = money(order.total);
  $("paymentDescription").textContent =
    `Pesanan ${order.id} · ${order.service}`;

  $("paymentModal").classList.add("show");
  $("paymentModal").setAttribute("aria-hidden", "false");
  $("confirmPayment").disabled = true;
  $("confirmPayment").textContent = "MENUNGGU 15 DETIK";

  let seconds = 15;
  $("paymentCountdown").textContent =
    `Konfirmasi tersedia dalam ${seconds} detik`;

  countdownTimer = setInterval(() => {
    seconds--;

    if (seconds <= 0) {
      clearInterval(countdownTimer);
      $("paymentCountdown").textContent =
        "Jika sudah membayar, lanjutkan konfirmasi ke admin.";
      $("confirmPayment").disabled = false;
      $("confirmPayment").textContent = "KONFIRMASI VIA WHATSAPP";
      return;
    }

    $("paymentCountdown").textContent =
      `Konfirmasi tersedia dalam ${seconds} detik`;
    $("confirmPayment").textContent = `TUNGGU ${seconds} DETIK`;
  }, 1000);
}

function closePayment() {
  clearInterval(countdownTimer);
  $("paymentModal").classList.remove("show");
  $("paymentModal").setAttribute("aria-hidden", "true");
}

$("closePayment").addEventListener("click", closePayment);
$("cancelPayment").addEventListener("click", closePayment);

$("paymentModal").addEventListener("click", event => {
  if (event.target === $("paymentModal")) closePayment();
});

/* KONFIRMASI WHATSAPP */
function confirmOrder() {
  if (!currentOrder) {
    showToast("Belum ada pesanan.");
    return;
  }

  const order = currentOrder;

  let message =
`Halo Min, saya sudah order di LIXERA STORE.

ID Pesanan: ${order.id}
Layanan: ${order.service}
Nama: ${order.name}
No. WhatsApp: ${order.phone}
Rank awal: ${order.startLabel}
Rank tujuan: ${order.endLabel}
Jumlah bintang: ${order.stars}
Total harga: ${money(order.total)}`;

  if (order.nickname) {
    message += `\nNick ML: ${order.nickname}`;
  }

  if (order.gameId) {
    message += `\nID ML: ${order.gameId}`;
  }

  if (order.request) {
    message += `\nRequest/catatan: ${order.request}`;
  }

  message +=
`\n\nMohon konfirmasi pesanan saya, Min. Saya akan mengirimkan bukti pembayaran untuk diperiksa.`;

  order.status = "Menunggu pemeriksaan admin";
  savedOrders.push(order);
  renderOrders();
  closePayment();

  const waUrl =
    `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;

  window.location.href = waUrl;
}

$("confirmPayment").addEventListener("click", () => {
  if ($("confirmPayment").disabled) return;
  confirmOrder();
});

/* TOMBOL ORDER */
$("rankOrder").addEventListener("click", () => makeOrder("rank"));
$("carryOrder").addEventListener("click", () => makeOrder("carry"));

/* PASTIKAN QR BISA DILIHAT */
$("paymentQR").addEventListener("error", () => {
  $("paymentDescription").textContent =
    "QRIS tidak ditemukan. Periksa nama file qrislixera.png di GitHub.";
});

/* MULAI DI HALAMAN HOME */
showPage("home");
renderOrders();
