export const PAGE_SIZE = 30;
export function paginationWindow(total, requestedPage = 1) {
  const count = Number.isSafeInteger(total) && total > 0 ? total : 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const start = (page - 1) * PAGE_SIZE,
    end = Math.min(start + PAGE_SIZE, count);
  return { page, pages, start, end, total: count };
}
export function paginationNumbers(page, pages) {
  const chosen = new Set([1, pages]);
  for (let n = Math.max(1, page - 2); n <= Math.min(pages, page + 2); n++)
    chosen.add(n);
  if (pages <= 7) for (let n = 1; n <= pages; n++) chosen.add(n);
  const result = [];
  let previous = 0;
  for (const n of [...chosen].sort((a, b) => a - b)) {
    if (n - previous > 1) result.push("…");
    result.push(n);
    previous = n;
  }
  return result;
}
