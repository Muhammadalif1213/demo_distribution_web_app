// Mutations only touch master records. Financial snapshots are never rewritten.
const text = (value, label, max = 120, required = true) => {
  const result = String(value ?? "").trim();
  if (required && !result) throw new Error(`${label} wajib diisi.`);
  if (result.length > max)
    throw new Error(`${label} maksimal ${max} karakter.`);
  return result;
};
export function money(value, label = "Harga") {
  if (!/^\d+$/.test(String(value)))
    throw new Error(`${label} harus berupa bilangan bulat Rupiah, minimal 0.`);
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount > 1000000000)
    throw new Error(`${label} maksimal Rp1.000.000.000.`);
  return amount;
}
export const sellingPrice = (customer, product) =>
  customer.prices?.[product.id] ?? product.price;
export function saveCustomer(data, values, id) {
  const existing = id ? data.customers.find((c) => c.id === id) : null;
  if (id && !existing) throw new Error("Customer tidak ditemukan.");
  const name = text(values.name, "Nama usaha");
  if (
    data.customers.some(
      (c) =>
        c.id !== id &&
        c.name.toLocaleLowerCase("id") === name.toLocaleLowerCase("id"),
    )
  )
    throw new Error("Nama usaha sudah digunakan customer lain.");
  const phone = text(values.phone, "Nomor telepon", 25, false);
  if (phone && !/^\+?[\d\s()-]{8,25}$/.test(phone))
    throw new Error(
      "Nomor telepon harus berisi 8–25 karakter angka, spasi, +, - atau tanda kurung.",
    );
  const record = {
    name,
    contact: text(values.contact, "Nama kontak"),
    area: text(values.area, "Wilayah", 80),
    phone,
    address: text(values.address, "Alamat", 300, false),
  };
  if (existing) Object.assign(existing, record);
  else
    data.customers.push({
      id: nextId(data.customers, "C"),
      ...record,
      prices: {},
      active: true,
    });
  return existing || data.customers.at(-1);
}
export function saveProduct(data, values, id) {
  const existing = id ? data.products.find((p) => p.id === id) : null;
  if (id && !existing) throw new Error("Produk tidak ditemukan.");
  const name = text(values.name, "Nama produk");
  if (
    data.products.some(
      (p) =>
        p.id !== id &&
        p.name.toLocaleLowerCase("id") === name.toLocaleLowerCase("id"),
    )
  )
    throw new Error("Nama produk sudah digunakan.");
  const unit = text(values.unit, "Satuan", 20);
  const used =
    existing &&
    (data.distributions.some((d) => d.items.some((i) => i.productId === id)) || data.inventory?.receipts?.some(r=>r.productId===id));
  if (used && unit !== existing.unit)
    throw new Error(
      "Satuan produk yang sudah memiliki transaksi tidak dapat diubah. Buat produk baru untuk satuan berbeda.",
    );
  const record = {
    name,
    unit,
    cost: money(values.cost, "Harga modal"),
    price: money(values.price, "Harga jual default"),
  };
  if (existing) Object.assign(existing, record);
  else
    data.products.push({
      id: nextId(data.products, "P"),
      ...record,
      stock: 0,
      active: true,
    });
  if(!existing&&data.inventory)data.inventory.opening[data.products.at(-1).id]=0;
  return existing || data.products.at(-1);
}
function nextId(records, prefix) {
  let n = 1;
  while (records.some((r) => r.id === `${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}
export function saveCustomerPrices(data, customerId, values) {
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error("Customer tidak ditemukan.");
  const prices = {};
  // Validate everything before applying so invalid input cannot partially save.
  for (const p of data.products) {
    const value = values[p.id];
    if (value !== "" && value !== undefined)
      prices[p.id] = money(value, `Harga ${p.name}`);
  }
  customer.prices = prices;
}
export function toggleMasterStatus(data, type, id) {
  if (!["customers", "products"].includes(type))
    throw new Error("Jenis master tidak valid.");
  const record = data[type].find((r) => r.id === id);
  if (!record) throw new Error("Data tidak ditemukan.");
  record.active = record.active === false;
  return record.active;
}
