import {distributionPage,bindDistribution,distributionView} from "./pages/distribution.js";
import {paymentsPage,bindPayments,showPaymentForm} from "./pages/payments.js";
import {billingPage,bindBilling,showInvoicePreview,showWhatsapp} from "./pages/billing.js";
import {operationsPage,bindOperations} from "./pages/operations.js";
import { masterPage, bindMasterPage } from "./pages/master.js";
import { shell, routes } from "./components/shell.js";
import { dashboard, view, periods, invoiceRows } from "./pages/dashboard.js";
import {supplementalRoutes,supplementalPage,bindSupplemental,resetSupplementalViews} from "./pages/supplemental.js";
import {today} from "./lib/dates.js";
import {
  getData,
  getStorageWarning,
  resetData,
  saveData,
} from "./lib/store.js";
import {
  invoiceBalance,
  invoiceStatus,
  summarize,
} from "./lib/calculations.js";
import { rupiah, date, escapeHTML } from "./lib/format.js";
import { icon } from "./lib/icons.js";
document.querySelector("#app").innerHTML = shell();
const page = document.querySelector("#page"),
  modal = document.querySelector("#modal");
let route = "dashboard",
  toastTimer;
function toast(message) {
  const el = document.querySelector("#toast");
  el.innerHTML = `${icon("check")}<span>${escapeHTML(message)}</span>`;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 4500);
}
function showModal(title, body, actions = "") {
  if (modal.open) modal.close();
  modal.innerHTML = `<div class="modal-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button close-modal" aria-label="Tutup dialog">${icon("close")}</button></div><div class="modal-content">${body}</div>${actions ? `<div class="modal-actions">${actions}</div>` : ""}`;
  modal.setAttribute("aria-labelledby", "dialog-title");
  modal.showModal();
  modal.querySelector(".close-modal").onclick = () => modal.close();
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      modal.close();
  }
});
function render() {
  const data = getData();
  document.querySelector('.workspace strong').textContent=data.settings.name;
  document.querySelector('.workspace-avatar').textContent=data.settings.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  document.querySelector('#profile strong').textContent=data.settings.user;
  document.querySelector('#profile .avatar').textContent=data.settings.user.slice(0,2).toUpperCase();
  document.title = `${routes[route]?.label || "Halaman tidak ditemukan"} · DMS`;
  document.querySelector("#breadcrumb-title").textContent =
    routes[route]?.label || "Halaman tidak ditemukan";
  document.querySelectorAll(".nav-link").forEach((el) => {
    el.classList.toggle("active", el.dataset.route === route);
    if (el.dataset.route === route) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  document.querySelector("#invoice-count").textContent = data.invoices.filter(
    (i) => invoiceBalance(i, data) > 0,
  ).length;
  page.innerHTML =
    route === "dashboard"
      ? dashboard(data)
      : ["customers", "products"].includes(route)
        ? masterPage(data, route)
        : route === "distribution"
          ? distributionPage(data)
          : route === "returns"
          ? operationsPage(data, route)
          : ["recapitulation", "invoices"].includes(route)
          ? billingPage(data, route)
          : route === "payments"
          ? paymentsPage(data)
          : supplementalRoutes.includes(route)
          ? supplementalPage(data,route)
          : `<section class="panel upcoming"><h1>Halaman tidak ditemukan</h1><p>Alamat halaman tidak dikenali.</p><a class="button primary" href="#/dashboard">Kembali ke dashboard</a></section>`;
  bindPage();
}
function navigate() {
  route = location.hash.replace(/^#\/?/, "").split("?")[0] || "dashboard";
  document.body.classList.remove("menu-open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
  if(route==="distribution")distributionView.tab="entry";
  render();
}
window.addEventListener("hashchange", () => {
  navigate();
  page.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
function invoiceDetail(id) {
 showInvoicePreview({data:getData(),id,modal,showModal,onWhatsapp:whatsappPreview,onPayment:paymentForm});
}
function paymentForm(invoiceId) {
 showPaymentForm({data:getData(),invoiceId,modal,showModal,render,toast,persist:saveData,onInvoice:invoiceDetail});
}
function whatsappPreview(id) {
 showWhatsapp({data:getData(),id,modal,showModal,persist:saveData,toast});
}
function refreshRows() {
  const result = invoiceRows(getData());
  document.querySelector("#invoice-rows").innerHTML = result.html;
  document.querySelector("#table-count").textContent =
    `Menampilkan ${result.total ? (view.page - 1) * 4 + 1 : 0}–${Math.min(view.page * 4, result.total)} dari ${result.total} invoice`;
  document.querySelector("#page-info").textContent =
    `${view.page} / ${result.pages}`;
  document.querySelector("#prev-page").disabled = view.page === 1;
  document.querySelector("#next-page").disabled = view.page === result.pages;
}
function bindPage() {
  if(supplementalRoutes.includes(route))bindSupplemental({data:getData(),type:route,page,modal,showModal,render,toast,persist:saveData});
  if (route === "payments") bindPayments({data:getData(),page,modal,showModal,render,toast,persist:saveData,onInvoice:invoiceDetail});
  if (["recapitulation", "invoices"].includes(route)) bindBilling({data:getData(),type:route,page,modal,showModal,render,toast,persist:saveData,onInvoice:invoiceDetail,onWhatsapp:whatsappPreview});
  if (route === "distribution") bindDistribution({data:getData(),page,modal,showModal,render,toast,persist:saveData});
  if (route === "returns") bindOperations({data:getData(),type:route,page,modal,showModal,render,toast,persist:saveData});
  if (["customers", "products"].includes(route))
    bindMasterPage({
      data: getData(),
      type: route,
      page,
      modal,
      showModal,
      render,
      toast,
      persist: saveData,
      onInvoice: invoiceDetail,
    });
  if (route === "dashboard") {
    document.querySelector("#period-filter").onchange = (e) => {
      view.period = e.target.value;
      view.page = 1;
      render();
    };
    document.querySelector("#customer-filter").onchange = (e) => {
      view.customer = e.target.value;
      view.page = 1;
      render();
    };
    document.querySelectorAll("[data-metric]").forEach(
      (b) =>
        (b.onclick = () => {
          view.metric = b.dataset.metric;
          render();
        }),
    );
    document.querySelector("#invoice-search").oninput = (e) => {
      view.query = e.target.value;
      view.page = 1;
      refreshRows();
    };
    document.querySelector("#status-filter").onchange = (e) => {
      view.status = e.target.value;
      view.page = 1;
      refreshRows();
    };
    document.querySelector("#prev-page").onclick = () => {
      view.page--;
      refreshRows();
    };
    document.querySelector("#next-page").onclick = () => {
      view.page++;
      refreshRows();
    };
    document.querySelector("#quick-action").onclick = () => {
      location.hash = "/distribution";
    };
    document.querySelector("#export").onclick = exportSummary;
  }
  document.querySelector("#reset-demo")?.addEventListener("click", () => {
    showModal(
      "Reset data demo?",
      `<p>Seluruh data prototipe di browser ini akan diganti dengan data demo awal. Tindakan ini tidak dapat dibatalkan.</p>`,
      `<button class="button secondary" id="cancel-reset">Batal</button><button class="button danger" id="confirm-reset">Ya, reset data demo</button>`,
    );
    document.querySelector("#cancel-reset").onclick = () => modal.close();
    document.querySelector("#confirm-reset").onclick = () => {
      const saved = resetData();
      resetSupplementalViews();
      distributionView.tab="entry";distributionView.draft=null;
      modal.close();
      Object.assign(view, {
        period: "current",
        metric: "net",
        customer: "all",
        query: "",
        status: "all",
        page: 1,
      });
      render();
      toast(saved ? "Data demo berhasil dikembalikan." : getStorageWarning());
    };
  });
}
page.addEventListener("click", (e) => {
  const b = e.target.closest(".invoice-detail");
  if (b) invoiceDetail(b.dataset.id);
});
function exportSummary() {
  const data = getData(),
    p = periods[view.period],
    s = summarize(data, p.start, p.end, view.customer);
  const rows = [
    ["Ringkasan DMS", "Nilai"],
    ["Periode", `${p.start} sampai ${p.end}`],
    [
      "Customer",
      view.customer === "all"
        ? "Semua customer"
        : data.customers.find((c) => c.id === view.customer).name,
    ],
    ["Penjualan neto", s.net],
    ["Pembayaran diterima", s.payments],
    ["Piutang outstanding (semua periode)", s.outstanding],
    ["Estimasi laba kotor", s.profit],
    ["Total distribusi", s.distributions],
    ["Total nilai retur", s.returns],
  ];
  const blob = new Blob(
    [
      "\ufeff" +
        rows
          .map((r) =>
            r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(";"),
          )
          .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DMS-ringkasan-${p.start}-${p.end}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Ringkasan CSV berhasil diekspor.");
}
document.querySelector("#menu-toggle").setAttribute("aria-controls", "sidebar");
document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
document.querySelector("#menu-toggle").onclick = () => {
  const open = document.body.classList.toggle("menu-open");
  document
    .querySelector("#menu-toggle")
    .setAttribute("aria-expanded", String(open));
};
document.querySelector(".sidebar-backdrop").onclick = () => {
  document.body.classList.remove("menu-open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.body.classList.remove("menu-open");
    document
      .querySelector("#menu-toggle")
      .setAttribute("aria-expanded", "false");
  }
});
document.querySelector("#notifications").onclick = () => {
  const data = getData(),
    late = data.invoices.filter(
      (i) => i.due < today() && invoiceBalance(i, data) > 0,
    );
  showModal(
    "Notifikasi",
    `<div class="notice">Tanggal acuan: ${date(today())}.</div><div class="notification-item">${icon("clock")}<div><strong>${late.length} invoice melewati jatuh tempo</strong><p>Total sisa tagihan ${rupiah(late.reduce((s, i) => s + invoiceBalance(i, data), 0))}. Buka detail invoice pada dashboard untuk melihat rinciannya.</p></div></div><div class="notification-item">${icon("check")}<div><strong>Data demo siap digunakan</strong><p>${data.distributions.length} transaksi distribusi dan ${data.customers.length} customer tersedia pada perangkat ini.</p></div></div>`,
  );
};
document.querySelector("#profile").onclick = () => {const s=getData().settings;showModal('Profil pengguna',`<div class="profile-detail"><span class="avatar">${escapeHTML(s.user.slice(0,2).toUpperCase())}</span><h3>${escapeHTML(s.user)}</h3><p>Administrator · ${escapeHTML(s.name)}</p></div><div class="notice">Pengguna kedua: ${escapeHTML(s.secondUser)}. Kedua pengguna memiliki akses Administrator. Autentikasi belum diterapkan.</div>`);};
document.querySelector('[data-route="distribution"]').addEventListener('click',()=>{if(route==='distribution'&&distributionView.tab!=='entry'){distributionView.tab='entry';render();}});
document.querySelector("#help").onclick = () =>
  showModal(
    "Tentang prototipe DMS",
    `<p>Kelola distribusi mie dan pangsit dalam satu ruang kerja.</p><dl class="detail-list"><div><dt>Versi</dt><dd>0.7 · Pencatatan distribusi per hari & rentang</dd></div><div><dt>Periode data demo</dt><dd>12 Okt – 8 Nov 2026</dd></div><div><dt>Penyimpanan</dt><dd>LocalStorage browser</dd></div></dl><p>Gunakan filter periode dan customer, lihat detail invoice, atau ekspor ringkasan CSV. Reset data tersedia melalui menu Pengaturan.</p><div class="notice">Inventori memakai asumsi; import Excel dan integrasi berjalan dalam simulasi. Seluruh data fiktif; tidak ada pesan atau transaksi keuangan yang dikirim.</div>`,
  );
navigate();
if (getStorageWarning()) toast(getStorageWarning());
