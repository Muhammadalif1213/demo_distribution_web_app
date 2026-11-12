import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_SIZE,
  paginationWindow,
  paginationNumbers,
} from "../src/lib/pagination.js";
test("pagination membatasi 30 baris, dengan batas akhir dan halaman kosong yang konsisten", () => {
  assert.equal(PAGE_SIZE, 30);
  assert.deepEqual(paginationWindow(0, 9), {
    page: 1,
    pages: 1,
    start: 0,
    end: 0,
    total: 0,
  });
  assert.deepEqual(paginationWindow(121, 2), {
    page: 2,
    pages: 5,
    start: 30,
    end: 60,
    total: 121,
  });
  assert.deepEqual(paginationWindow(121, 99), {
    page: 5,
    pages: 5,
    start: 120,
    end: 121,
    total: 121,
  });
  assert.equal(paginationWindow(30, 2).page, 1);
  assert.equal(paginationWindow(31, 2).start, 30);
  assert.equal(paginationWindow(10, -5).page, 1);
});
test("angka halaman mencakup awal, akhir, dan halaman aktif tanpa duplikat", () => {
  assert.deepEqual(paginationNumbers(2, 3), [1, 2, 3]);
  assert.deepEqual(paginationNumbers(10, 20), [
    1,
    "…",
    8,
    9,
    10,
    11,
    12,
    "…",
    20,
  ]);
});
