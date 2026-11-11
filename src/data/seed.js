import {initializeSupportData} from '../lib/support-state.js';
export function createSeed() {
  const customers = [
    "Bakmi Bahagia",
    "Mie Ayam Pak Hadi",
    "Pangsit Jaya",
    "Bakmi Sinar Pagi",
    "Mie Ayam Bu Ratna",
    "Kedai Mie Nusantara",
    "Bakmi Tiga Saudara",
    "Warung Mie Berkah",
  ].map((name, i) => ({
    id: `C${i + 1}`,
    name,
    contact: [
      "Budi Santoso",
      "Hadi Pratama",
      "Andi Wijaya",
      "Siti Aminah",
      "Ratna Dewi",
      "Dimas Saputra",
      "Rudi Hartono",
      "Agus Setiawan",
    ][i],
    area: [
      "Bandung Wetan",
      "Coblong",
      "Sukajadi",
      "Cicendo",
      "Antapani",
      "Lengkong",
      "Buahbatu",
      "Cibeunying",
    ][i],
    prices: { mie: 18000 + (i % 3) * 1000, pangsit: 14000 + (i % 2) * 1000 },
  }));
  const products = [
    {
      id: "mie",
      name: "Mie telur segar",
      unit: "kg",
      cost: 12000,
      price: 20000,
    },
    {
      id: "pangsit",
      name: "Kulit pangsit",
      unit: "pak",
      cost: 9000,
      price: 15000,
    },
  ];
  const distributions = Array.from({ length: 40 }, (_, i) => {
    const customer = customers[i % 8];
    const day = 12 + Math.floor((i * 28) / 40);
    const date =
      day <= 31
        ? `2026-10-${String(day).padStart(2, "0")}`
        : `2026-11-${String(day - 31).padStart(2, "0")}`;
    return {
      id: `DST-${String(i + 1).padStart(4, "0")}`,
      date,
      customerId: customer.id,
      items: products.map((p, j) => ({
        productId: p.id,
        quantity: 12 + ((i * 7 + j * 3) % 24),
        price: customer.prices[p.id],
        cost: p.cost,
      })),
    };
  });
  const returns = [3, 8, 17, 24, 32, 37].map((i, j) => ({
    id: `RTR-${j + 1}`,
    distributionId: distributions[i].id,
    productId: j % 2 ? "pangsit" : "mie",
    quantity: 2 + (j % 3),
    date: distributions[i].date,
    reason: "Kemasan rusak",
  }));
  const recaps = [];
  const invoices = [];
  const payments = [];
  for (let period = 0; period < 2; period++)
    for (let c = 0; c < 8; c++) {
      const start = period ? "2026-10-26" : "2026-10-12",
        end = period ? "2026-11-08" : "2026-10-25";
      const ds = distributions.filter(
        (d) =>
          d.customerId === customers[c].id && d.date >= start && d.date <= end,
      );
      const gross = ds.reduce(
        (sum, d) => sum + d.items.reduce((s, x) => s + x.quantity * x.price, 0),
        0,
      );
      const credits = returns
        .filter((r) => ds.some((d) => d.id === r.distributionId))
        .reduce(
          (s, r) =>
            s +
            r.quantity *
              ds
                .find((d) => d.id === r.distributionId)
                .items.find((x) => x.productId === r.productId).price,
          0,
        );
      const total = gross - credits;
      const id = `INV/2026/${String(period * 8 + c + 1).padStart(3, "0")}`;
      recaps.push({
        id: `R${period * 8 + c + 1}`,
        customerId: customers[c].id,
        start,
        end,
        distributionIds: ds.map((d) => d.id),
        status: "final",
        total,
      });
      invoices.push({
        id,
        recapId: `R${period * 8 + c + 1}`,
        customerId: customers[c].id,
        start,
        end,
        issued: end,
        due: period ? "2026-11-15" : "2026-11-01",
        total,
      });
      const paid =
        c % 4 === 0 ? total : c % 4 === 1 ? Math.floor(total / 2) : 0;
      if (paid)
        payments.push({
          id: `PAY-${period * 8 + c + 1}`,
          date: end,
          amount: paid,
          allocations: [{ invoiceId: id, amount: paid }],
        });
    }
  return initializeSupportData({
    version: 1,
    customers,
    products,
    distributions,
    returns,
    recaps,
    invoices,
    payments,
    settings: { name: "Berkah Pangan", user: "Alifian", role: "Administrator" },
  });
}
