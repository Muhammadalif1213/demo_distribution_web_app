export const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const number = (n) => new Intl.NumberFormat("id-ID").format(n);
export const date = (
  s,
  options = { day: "numeric", month: "short", year: "numeric" },
) =>
  new Intl.DateTimeFormat("id-ID", options).format(new Date(`${s}T12:00:00`));
export const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
