import { icon } from "../lib/icons.js";
import { rupiah, date, escapeHTML as esc } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { reportData, csvContent } from "../lib/reports.js";
export const reportView = {
  start: "2026-10-12",
  end: today(),
  customerId: "all",
};
function lineChart(series, key, color, label) {
  const values = series.map((s) => s[key]),
    min = Math.min(0, ...values),
    max = Math.max(1, ...values),
    range = max - min,
    x = (i) => 45 + (i * 445) / Math.max(1, series.length - 1),
    y = (v) => 160 - ((v - min) / range) * 130;
  const path = values
    .map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`)
    .join(" ");
  return `<svg viewBox="0 0 520 205" class="report-chart" role="img" aria-label="${label}">${[
    0, 0.5, 1,
  ]
    .map((t) => {
      const v = min + range * t;
      return `<line x1="45" x2="490" y1="${y(v)}" y2="${y(v)}" stroke="#e8edf5" stroke-dasharray="4 4"/><text class="chart-label" text-anchor="end" x="38" y="${y(v) + 4}">${(v / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt</text>`;
    })
    .join(
      "",
    )}<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>${series
    .filter(
      (_, i) =>
        i === 0 ||
        i === series.length - 1 ||
        i % Math.max(1, Math.floor(series.length / 5)) === 0,
    )
    .map((s) => {
      const i = series.indexOf(s);
      return `<text class="chart-label" x="${x(i)}" y="191" text-anchor="middle">${date(s.date, { day: "numeric", month: "short" })}</text>`;
    })
    .join(
      "",
    )}${series.map((s, i) => `<circle cx="${x(i)}" cy="${y(s[key])}" r="3" fill="${color}"><title>${date(s.date)}: ${rupiah(s[key])}</title></circle>`).join("")}</svg>`;
}
export function reportsPage(data) {
  const r = reportData(data, { ...reportView, asOf: today() });
  return `<div class="page-heading"><div><div class="eyebrow">PELAPORAN</div><h1>Laporan & Analitik</h1><p>Analisis penjualan, laba kotor, retur, dan piutang customer.</p></div><button class="button secondary" id="export-report">${icon("download")} Ekspor laporan CSV</button></div><section class="panel report-filter-panel"><form id="report-form" class="operation-filters"><label class="form-field">Tanggal awal<input type="date" name="start" value="${reportView.start}" required></label><label class="form-field">Tanggal akhir<input type="date" name="end" value="${reportView.end}" required></label><label class="form-field">Customer<select name="customerId" aria-label="Customer laporan"><option value="all">Semua customer</option>${data.customers.map((c) => `<option value="${c.id}" ${reportView.customerId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label><button class="button primary" type="submit">Terapkan filter</button></form><p class="filter-error" id="report-error" role="alert"></p></section><div class="report-stats">${[
    ["Penjualan neto", r.summary.net, "chart", "blue"],
    ["Estimasi laba kotor", r.summary.profit, "leaf", "purple"],
    ["Nilai retur", r.summary.returns, "return", "rose"],
    ["Sisa piutang invoice periode", r.outstanding, "clock", "orange"],
  ]
    .map(
      ([label, val, i, color]) =>
        `<article class="stat-card"><div class="stat-heading"><span>${label}</span><span class="stat-icon ${color}">${icon(i)}</span></div><strong class="report-stat-value">${rupiah(val)}</strong></article>`,
    )
    .join("")}</div><div class="report-chart-grid">${[
    ["Penjualan neto harian", "net", "#3675ef"],
    ["Estimasi laba kotor harian", "profit", "#9578d1"],
    ["Retur pada periode asal", "returns", "#d68593"],
  ]
    .map(
      ([label, key, color]) =>
        `<section class="panel"><div class="panel-heading"><div><h2>${label}</h2><p>${date(reportView.start)} – ${date(reportView.end)}</p></div></div>${lineChart(r.series, key, color, label)}</section>`,
    )
    .join(
      "",
    )}<section class="panel"><div class="panel-heading"><div><h2>Umur piutang</h2><p>Saldo terkini per ${date(today())}</p></div></div><div class="aging-bars">${r.aging.map((a) => `<div><span>${a.label}</span><strong>${rupiah(a.value)}</strong><div><i style="width:${(a.value / Math.max(1, ...r.aging.map((a) => a.value))) * 100}%"></i></div></div>`).join("")}</div></section></div><section class="panel"><div class="panel-heading"><div><h2>Ringkasan per customer</h2><p>Pembayaran mengikuti tanggal penerimaan; penjualan dan retur mengikuti distribusi asal.</p></div></div><div class="table-scroll report-table"><table><thead><tr><th>Customer</th><th class="amount">Penjualan neto</th><th class="amount">Laba kotor</th><th class="amount">Retur</th><th class="amount">Pembayaran diterima</th><th class="amount">Sisa piutang</th></tr></thead><tbody>${r.rows.map((row) => `<tr><td>${esc(row.name)}</td>${["net", "profit", "returns", "payments", "outstanding"].map((k) => `<td class="amount">${rupiah(row[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section><div class="notice operation-notice">Piutang hanya untuk invoice yang terbit pada rentang terpilih, dengan saldo terkini setelah semua pembayaran. Ini bukan saldo historis pada akhir periode. Estimasi laba belum memasukkan biaya operasional; barang retur mengikuti asumsi penyesuaian modal prototipe.</div>`;
}
export function bindReports({ data, page, render, toast }) {
  page.querySelector("#report-form").onsubmit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      reportData(data, { ...values, asOf: today() });
      Object.assign(reportView, values);
      render();
    } catch (error) {
      page.querySelector("#report-error").textContent = error.message;
    }
  };
  page.querySelector("#export-report").onclick = () => {
    const report = reportData(data, { ...reportView, asOf: today() }),
      rows = [
        [
          "Laporan DMS",
          "Tanggal awal",
          reportView.start,
          "Tanggal akhir",
          reportView.end,
        ],
        ["Catatan piutang", "Saldo terkini invoice terbit dalam periode"],
        [
          "Customer",
          "Penjualan neto",
          "Laba kotor",
          "Retur",
          "Pembayaran diterima",
          "Sisa piutang",
        ],
        ...report.rows.map((r) => [
          r.name,
          r.net,
          r.profit,
          r.returns,
          r.payments,
          r.outstanding,
        ]),
      ];
    const url = URL.createObjectURL(
        new Blob([csvContent(rows)], { type: "text/csv;charset=utf-8" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `DMS-laporan-${reportView.start}-${reportView.end}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Laporan CSV berhasil diekspor.");
  };
}
