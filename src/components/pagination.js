import { PAGE_SIZE, paginationWindow, paginationNumbers } from "../lib/pagination.js?v=0.16";

// Shared pagination for data tables and record lists, including modal details.
// Existing rows stay mounted so form values and bound actions survive page changes.
export function installListPagination(root, {paginate = true} = {}) {
  const states = new Map();
  let sequence = 0;
  const observer = new MutationObserver(scan);
  function watch() {
    observer.observe(root, { childList: true, subtree: true });
  }
  function scrollContainer(table) {
    let wrapper = table.closest(".table-scroll");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "table-scroll";
      table.before(wrapper);
      wrapper.append(table);
    }
    wrapper.dataset.listScroll = "";
    if (!wrapper.hasAttribute("tabindex")) wrapper.tabIndex = 0;
    if (!wrapper.hasAttribute("aria-label")) wrapper.setAttribute("aria-label", "Tabel data, gulir untuk melihat baris lainnya");
    return wrapper;
  }
  function dataRows(table) {
    return [...table.tBodies]
      .flatMap((body) => [...body.rows])
      .filter((row) => !isEmpty(row));
  }
  function isEmpty(row) {
    return (
      row.cells.length === 1 &&
      (row.cells[0].colSpan > 1 ||
        row.cells[0].classList.contains("empty-state"))
    );
  }
  function draw(state) {
    if (!paginate) {
      state.rows.forEach(row => { row.hidden = false; });
      return;
    }
    const range = paginationWindow(state.rows.length, state.page);
    state.page = range.page;
    state.anchor.closest("[data-list-scroll]")?.scrollTo({top: 0, behavior: "instant"});
    state.rows.forEach((row, index) => {
      row.hidden = index < range.start || index >= range.end;
    });
    state.footer.innerHTML = `<span class="list-range" aria-live="polite">Menampilkan ${range.total ? range.start + 1 : 0}–${range.end} dari ${range.total} data · maks. ${PAGE_SIZE} per halaman</span><nav class="list-page-buttons" aria-label="Halaman ${state.label}"><button type="button" data-list-page="${range.page - 1}" ${range.page === 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">Sebelumnya</button>${paginationNumbers(
      range.page,
      range.pages,
    )
      .map((n) =>
        n === "…"
          ? '<span class="page-ellipsis">…</span>'
          : `<button type="button" data-list-page="${n}" ${n === range.page ? 'aria-current="page"' : ""} aria-label="Halaman ${n}">${n}</button>`,
      )
      .join(
        "",
      )}<button type="button" data-list-page="${range.page + 1}" ${range.page === range.pages ? "disabled" : ""} aria-label="Halaman berikutnya">Berikutnya</button></nav>`;
  }
  function createState(anchor, rows, label) {
    const footer = document.createElement("div");
    footer.className = "list-pagination";
    footer.dataset.paginationFooter = String(++sequence);
    const state = { anchor, rows, page: 1, footer, label };
    states.set(anchor, state);
    footer.addEventListener("click", (event) => {
      const button = event.target.closest("[data-list-page]");
      if (!button || button.disabled) return;
      event.preventDefault();
      state.page = Number(button.dataset.listPage);
      draw(state);
      state.footer
        .querySelector('[aria-current="page"]')
        ?.focus({ preventScroll: true });
    });
    return state;
  }
  function numberTable(table, state) {
    const head = table.tHead;
    if (!head?.rows.length) return;
    let heading = head.rows[0].cells[0];
    if (!heading?.hasAttribute("data-row-number-heading")) {
      if (/^(No\.?|Baris)$/i.test(heading?.textContent.trim() || "")) {
        state.hasExistingNumbers = true;
        heading.textContent = "No.";
      } else {
        heading = document.createElement("th");
        heading.textContent = "No.";
        heading.scope = "col";
        heading.rowSpan = head.rows.length;
        head.rows[0].prepend(heading);
        state.hasExistingNumbers = false;
      }
      heading.dataset.rowNumberHeading = "";
      heading.classList.add("row-number-heading");
    }
    state.rows.forEach((row, index) => {
      let cell = row.querySelector(":scope > [data-row-number]");
      if (!cell) {
        if (state.hasExistingNumbers) cell = row.cells[0];
        else {
          cell = document.createElement("td");
          row.prepend(cell);
        }
        cell.dataset.rowNumber = "";
        cell.classList.add("row-number");
      }
      cell.textContent = String(index + 1);
    });
    for (const body of table.tBodies)
      for (const row of body.rows)
        if (isEmpty(row)) {
          const cell = row.cells[0];
          cell.dataset.paginationBaseColspan ??= String(cell.colSpan);
          cell.colSpan =
            Number(cell.dataset.paginationBaseColspan) +
            (state.hasExistingNumbers ? 0 : 1);
        }
  }
  function synchronize(anchor, rows, kind) {
    let state = states.get(anchor);
    const changed =
      !state ||
      state.rows.length !== rows.length ||
      state.rows.some((row, index) => row !== rows[index]);
    if (!state)
      state = createState(anchor, rows, kind === "table" ? "tabel" : "daftar");
    if (changed) {
      state.rows = rows;
      state.page = 1;
      if (kind === "table") numberTable(anchor, state);
      else
        rows.forEach((row, index) => {
          let number = row.querySelector(":scope > [data-record-number]");
          if (!number) {
            number = document.createElement("span");
            number.dataset.recordNumber = "";
            number.className = "record-row-number";
            row.prepend(number);
          }
          number.textContent = String(index + 1);
        });
    }
    anchor.dataset.paginatedList = "";
    const position =
      kind === "table"
        ? scrollContainer(anchor)
        : rows.at(-1);
    if (paginate && position && !state.footer.isConnected) position.after(state.footer);
    if (changed) draw(state);
  }
  function scan() {
    observer.disconnect();
    for (const [anchor, state] of states)
      if (!root.contains(anchor)) {
        state.footer.remove();
        states.delete(anchor);
      }
    for (const table of root.querySelectorAll("table"))
      synchronize(table, dataRows(table), "table");
    const covered = new Set();
    for (const first of root.querySelectorAll(".detail-record,.activity-row")) {
      if (covered.has(first)) continue;
      const selector = first.classList.contains("detail-record")
          ? ".detail-record"
          : ".activity-row",
        rows = [];
      let current = first;
      while (current?.matches(selector)) {
        rows.push(current);
        covered.add(current);
        current = current.nextElementSibling;
      }
      synchronize(first, rows, "records");
    }
    watch();
  }
  root.addEventListener(
    "invalid",
    (event) => {
      const row = event.target.closest("tr");
      if (!row) return;
      const state = states.get(row.closest("table"));
      if (!state) return;
      const index = state.rows.indexOf(row);
      if (index < 0) return;
      state.page = Math.floor(index / PAGE_SIZE) + 1;
      draw(state);
    },
    true,
  );
  scan();
  return () => {
    observer.disconnect();
    for (const state of states.values()) state.footer.remove();
    states.clear();
  };
}
