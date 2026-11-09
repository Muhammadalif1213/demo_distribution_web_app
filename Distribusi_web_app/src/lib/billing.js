import { date, rupiah } from "./format.js";
import { validDate } from "./operations.js";
import {
  distributionTotal,
  returnValue,
  invoiceBalance,
} from "./calculations.js";
export function periodEnd(start) {
  validDate(start);
  const d = new Date(start + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 13);
  return d.toISOString().slice(0, 10);
}
export function recapFigures(data, ids) {
  const distributions = data.distributions.filter((d) => ids.includes(d.id));
  const returns = data.returns.filter((r) => ids.includes(r.distributionId));
  const gross = distributions.reduce((s, d) => s + distributionTotal(d), 0),
    credits = returns.reduce((s, r) => s + returnValue(r, data), 0);
  const total = gross - credits;
  if (
    !Number.isSafeInteger(gross) ||
    !Number.isSafeInteger(credits) ||
    !Number.isSafeInteger(total) ||
    total < 0
  )
    throw Error(
      "Nilai rekap tidak valid atau melebihi batas bilangan bulat aman.",
    );
  return { distributions, returns, gross, credits, total };
}
function candidate(data, customerId, start, end, excludeId) {
  validDate(start);
  validDate(end);
  if (end !== periodEnd(start))
    throw Error(
      "Periode rekap harus tepat 14 hari, termasuk tanggal awal dan akhir.",
    );
  if (!data.customers.some((c) => c.id === customerId))
    throw Error("Customer tidak ditemukan.");
  if (
    data.recaps.some(
      (r) =>
        r.id !== excludeId &&
        r.status === "final" &&
        r.customerId === customerId &&
        r.start <= end &&
        r.end >= start,
    )
  )
    throw Error("Periode bertumpang tindih dengan rekap final customer ini.");
  const ds = data.distributions.filter(
    (d) => d.customerId === customerId && d.date >= start && d.date <= end,
  );
  if (!ds.length)
    throw Error("Tidak ada distribusi pada customer dan periode tersebut.");
  const used = new Set(
    data.recaps
      .filter((r) => r.id !== excludeId && r.status === "final")
      .flatMap((r) => r.distributionIds),
  );
  if (ds.some((d) => used.has(d.id)))
    throw Error("Distribusi sudah tercakup dalam rekap final lain.");
  const figures = recapFigures(
    data,
    ds.map((d) => d.id),
  );
  const fingerprint = JSON.stringify({
    distributions: figures.distributions,
    returns: figures.returns,
  });
  return { ...figures, fingerprint, distributionIds: ds.map((d) => d.id) };
}
export function generateRecap(data, { customerId, start, end }) {
  const result = candidate(data, customerId, start, end);
  const existing = data.recaps.find(
    (r) =>
      r.status === "draft" &&
      r.customerId === customerId &&
      r.start === start &&
      r.end === end,
  );
  let n = 1;
  while (data.recaps.some((r) => r.id === `R${n}`)) n++;
  const record = {
    id: existing?.id || `R${n}`,
    customerId,
    start,
    end,
    status: "draft",
    distributionIds: result.distributionIds,
    total: result.total,
    fingerprint: result.fingerprint,
    generatedAt: new Date().toISOString(),
  };
  if (existing) Object.assign(existing, record);
  else data.recaps.push(record);
  return existing || record;
}
export function finalizeRecap(data, id) {
  const r = data.recaps.find((r) => r.id === id);
  if (!r) throw Error("Rekap tidak ditemukan.");
  if (r.status !== "draft") throw Error("Rekap ini sudah final.");
  const latest = candidate(data, r.customerId, r.start, r.end, r.id);
  if (r.fingerprint !== latest.fingerprint || r.total !== latest.total)
    throw Error(
      "Data distribusi atau retur berubah. Generate ulang rekap sebelum finalisasi.",
    );
  r.status = "final";
  r.finalizedAt = new Date().toISOString();
  return r;
}
export function createInvoice(data, { recapId, issued, due }) {
  const r = data.recaps.find((r) => r.id === recapId);
  if (!r || r.status !== "final")
    throw Error("Invoice hanya dapat dibuat dari rekap final.");
  if (data.invoices.some((i) => i.recapId === recapId))
    throw Error("Invoice untuk rekap ini sudah ada.");
  validDate(issued, "Tanggal terbit");
  validDate(due, "Jatuh tempo");
  if (issued < r.end)
    throw Error("Tanggal terbit tidak boleh mendahului akhir periode rekap.");
  if (due < issued)
    throw Error("Jatuh tempo tidak boleh mendahului tanggal terbit.");
  const figures = recapFigures(data, r.distributionIds);
  if (figures.total !== r.total)
    throw Error(
      "Nilai rekap tidak sesuai transaksi asal. Periksa penyesuaian retur.",
    );
  const year = issued.slice(0, 4);
  let sequence = 1;
  while (
    data.invoices.some(
      (i) => i.id === `INV/${year}/${String(sequence).padStart(3, "0")}`,
    )
  )
    sequence++;
  const c = data.customers.find((c) => c.id === r.customerId);
  const inv = {
    id: `INV/${year}/${String(sequence).padStart(3, "0")}`,
    recapId: r.id,
    customerId: r.customerId,
    customerName: c.name,
    customerAddress: c.address || c.area,
    distributorName: data.settings?.name || "Berkah Pangan",
    bank: {
      name: data.settings?.bankName || "",
      account: data.settings?.bankAccount || "",
      owner: data.settings?.bankOwner || "",
    },
    start: r.start,
    end: r.end,
    issued,
    due,
    total: r.total,
    createdAt: new Date().toISOString(),
  };
  data.invoices.push(inv);
  return inv;
}
export function whatsappMessage(data, id) {
  const i = data.invoices.find((i) => i.id === id);
  if (!i) throw Error("Invoice tidak ditemukan.");
  const money = rupiah;
  return `SIMULASI — TIDAK DIKIRIM\n\nYth. ${i.customerName || data.customers.find((c) => c.id === i.customerId).name},\nBerikut invoice ${i.id} untuk periode ${date(i.start)} s.d. ${date(i.end)}.\nNilai tagihan: ${money(i.total)}\nSisa tagihan: ${money(invoiceBalance(i, data))}\nJatuh tempo: ${date(i.due)}\n\nTerima kasih, ${i.distributorName || data.settings?.name || "Berkah Pangan"}.`;
}
export function simulateWhatsapp(data, id) {
  if (data.integrations?.whatsapp?.enabled === false)
    throw Error(
      "Simulasi WhatsApp dinonaktifkan melalui Integrasi. Aktifkan dan simpan konfigurasi terlebih dahulu.",
    );
  const message = whatsappMessage(data, id);
  data.simulations ??= [];
  const log = {
    id: `SIM-${data.simulations.length + 1}`,
    invoiceId: id,
    mode: "simulation",
    message,
    createdAt: new Date().toISOString(),
  };
  data.simulations.push(log);
  return log;
}
