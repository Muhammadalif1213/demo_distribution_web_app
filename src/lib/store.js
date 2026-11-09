import {today} from './dates.js';
import {initializeSupportData} from './support-state.js';
import { createSeed } from "../data/seed.js";
const KEY = "dms-prototype-v1";
let data;
let warning = "";
try {
  const saved = localStorage.getItem(KEY);
  data = saved ? JSON.parse(saved) : createSeed();
  if (
    data.version !== 1 ||
    ![
      "customers",
      "products",
      "distributions",
      "returns",
      "recaps",
      "invoices",
      "payments",
    ].every((k) => Array.isArray(data[k]))
  )
    throw Error("Data tidak valid");
} catch {
  data = createSeed();
  warning = "Data tersimpan tidak dapat dibaca. Data demo dimuat kembali.";
}
initializeSupportData(data,today());
export const getData = () => data;
export const getStorageWarning = () => warning;
export function saveData() {
  try {
    initializeSupportData(data,today());
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    warning =
      "Penyimpanan browser tidak tersedia. Perubahan hanya bertahan selama sesi ini.";
    return false;
  }
}
export function resetData() {
  data = createSeed();
  return saveData();
}
saveData();
