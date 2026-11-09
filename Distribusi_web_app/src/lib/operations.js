import {date as formatDate} from './format.js';
import {today,validDate} from './dates.js';
export {today,validDate} from './dates.js';
import {inventorySummary} from './inventory.js';
import {money,sellingPrice} from './master-data.js';
import {distributionTotal,returnValue,invoiceBalance} from './calculations.js';
function nextId(list,prefix){let n=Math.max(0,...list.map(r=>r.id.startsWith(prefix+'-')?Number(r.id.slice(prefix.length+1))||0:0))+1;while(list.some(r=>r.id===`${prefix}-${String(n).padStart(4,'0')}`))n++;return `${prefix}-${String(n).padStart(4,'0')}`;}
function note(value,label,required=false){const v=String(value??'').trim();if(required&&!v)throw Error(`${label} wajib diisi.`);if(v.length>500)throw Error(`${label} maksimal 500 karakter.`);return v;}
export function remainingQuantity(data,distributionId,productId){const d=data.distributions.find(d=>d.id===distributionId);const item=d?.items.find(i=>i.productId===productId);return (item?.quantity||0)-data.returns.filter(r=>r.distributionId===distributionId&&r.productId===productId).reduce((s,r)=>s+r.quantity,0);}
export function linkedRecap(data,id){return data.recaps.find(r=>r.status==='final'&&r.distributionIds.includes(id));}
export function createDistribution(data,values){
 const date=validDate(values.date);const customer=data.customers.find(c=>c.id===values.customerId&&c.active!==false);
 if(!customer)throw Error('Pilih customer aktif.');
 if(!Array.isArray(values.items)||!values.items.length)throw Error('Tambahkan minimal satu produk.');
 if(values.items.length>100)throw Error('Maksimal 100 item per transaksi.');
 const seen=new Set();const items=values.items.map(i=>{
  const p=data.products.find(p=>p.id===i.productId&&p.active!==false);if(!p)throw Error('Pilih produk aktif.');
  if(seen.has(p.id))throw Error('Produk yang sama tidak boleh ditambahkan dua kali. Gabungkan jumlahnya.');seen.add(p.id);
  const quantity=Number(i.quantity);if(!/^\d+$/.test(String(i.quantity))||!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000)throw Error('Jumlah harus bilangan bulat antara 1 dan 1.000.000.');
  if(data.inventory&&quantity>inventorySummary(data,p.id).available)throw Error(`Stok ${p.name} tidak mencukupi. Catat barang masuk terlebih dahulu.`);
  return {productId:p.id,productName:p.name,unit:p.unit,quantity,price:money(i.price??sellingPrice(customer,p)),cost:money(p.cost,'Harga modal')};
 });
 const transaction={id:nextId(data.distributions,'DST'),date,customerId:customer.id,customerName:customer.name,items,note:note(values.note,'Catatan'),createdAt:new Date().toISOString()};
 if(!Number.isSafeInteger(distributionTotal(transaction)))throw Error('Total transaksi terlalu besar.');
 // A finalized interval is closed: adding shipments would silently bypass its invoice.
 if(data.recaps.some(r=>r.customerId===customer.id&&r.status==='final'&&r.start<=date&&r.end>=date))throw Error('Periode customer ini sudah difinalisasi. Gunakan periode yang masih terbuka.');
 data.distributions.push(transaction);return transaction;
}
export function previewReturn(data,values){
 const date=validDate(values.date,'Tanggal retur');const d=data.distributions.find(d=>d.id===values.distributionId);if(!d)throw Error('Distribusi asal tidak ditemukan.');
 if(date<d.date)throw Error('Tanggal retur tidak boleh mendahului tanggal distribusi.');
 const item=d.items.find(i=>i.productId===values.productId);if(!item)throw Error('Produk tidak terdapat pada distribusi asal.');
 const quantity=Number(values.quantity);if(!/^\d+$/.test(String(values.quantity))||!Number.isSafeInteger(quantity)||quantity<1||quantity>remainingQuantity(data,d.id,item.productId))throw Error('Jumlah retur melebihi sisa yang dapat diretur atau bukan bilangan bulat positif.');
 const record={id:nextId(data.returns,'RTR'),date,distributionId:d.id,productId:item.productId,quantity,reason:note(values.reason,'Alasan retur',true),createdAt:new Date().toISOString()};
 const credit=quantity*item.price;const recap=linkedRecap(data,d.id);const invoices=recap?data.invoices.filter(i=>i.recapId===recap.id):[];
 if(invoices.length>1)throw Error('Rekap memiliki invoice ganda. Periksa data sebelum mencatat retur.');
 let newTotal=null;
 if(recap){const ds=data.distributions.filter(t=>recap.distributionIds.includes(t.id));newTotal=ds.reduce((s,t)=>s+distributionTotal(t),0)-data.returns.filter(r=>recap.distributionIds.includes(r.distributionId)).reduce((s,r)=>s+returnValue(r,data),0)-credit;
 if(newTotal<0)throw Error('Retur menghasilkan rekap negatif.');
 for(const inv of invoices){const paid=inv.total-invoiceBalance(inv,data);if(newTotal<paid)throw Error('Retur membuat tagihan lebih kecil dari pembayaran yang telah diterima. Alur kredit/refund belum tersedia pada prototipe.');}}
 return {record,credit,recapId:recap?.id,invoiceIds:invoices.map(i=>i.id),newTotal,originDate:d.date};
}
export function createReturn(data,values){
 const plan=previewReturn(data,values);const changes=[];
 if(plan.recapId){const r=data.recaps.find(r=>r.id===plan.recapId);changes.push({type:'recap',id:r.id,before:r.total,after:plan.newTotal});}
 for(const id of plan.invoiceIds){const inv=data.invoices.find(i=>i.id===id);changes.push({type:'invoice',id,before:inv.total,after:plan.newTotal});}
 // Validate the complete plan before making any mutation.
 data.returns.push(plan.record);
 for(const c of changes){const row=(c.type==='recap'?data.recaps:data.invoices).find(r=>r.id===c.id);row.total=c.after;}
 data.adjustments??=[];data.adjustments.push({id:`ADJ-${plan.record.id}`,returnId:plan.record.id,originDate:plan.originDate,credit:plan.credit,changes,createdAt:plan.record.createdAt});
 return plan.record;
}

// Multi-date entry is stored as separate daily transactions, all-or-nothing.
export function distributionDates(start,end){
 validDate(start,'Tanggal awal');validDate(end,'Tanggal akhir');
 if(start>end)throw Error('Tanggal awal tidak boleh melewati tanggal akhir.');
 const count=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
 if(count>366)throw Error('Maksimal 366 hari dalam satu pencatatan.');
 const dates=[],d=new Date(start+'T12:00:00Z');
 for(let i=0;i<count;i++){dates.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}
 return dates;
}
export function previewDistributionBatch(data,values){
 const customer=data.customers.find(c=>c.id===values.customerId&&c.active!==false);
 if(!customer)throw Error('Pilih customer aktif terlebih dahulu.');
 const dates=distributionDates(values.start,values.end);
 const submissionId=String(values.submissionId??'').trim();
 if(!submissionId||submissionId.length>100)throw Error('ID pencatatan tidak valid. Buka ulang formulir.');
 if(data.distributionBatches?.some(b=>b.submissionId===submissionId))throw Error('Pencatatan ini sudah disimpan. Jangan simpan ulang.');
 const batchNote=note(values.note,'Catatan');
 if(!Array.isArray(values.entries)||values.entries.length!==dates.length)throw Error('Isi catatan untuk setiap tanggal dalam rentang.');
 const working=structuredClone(data),records=[],skippedDates=[];
 let batchNumber=1;while(data.distributionBatches?.some(b=>b.id===`BATCH-${String(batchNumber).padStart(4,'0')}`))batchNumber++;
 const batchId=`BATCH-${String(batchNumber).padStart(4,'0')}`;
 for(let index=0;index<dates.length;index++){
  const entry=values.entries[index];if(entry.date!==dates[index])throw Error('Tanggal catatan harus berurutan, unik, dan sesuai rentang.');
  if(!Array.isArray(entry.items)||!entry.items.length)throw Error(`Produk pada ${entry.date} belum diisi.`);
  const seen=new Set();const positive=[];
  for(const item of entry.items){
   const p=data.products.find(p=>p.id===item.productId&&p.active!==false);if(!p)throw Error('Produk tidak aktif atau tidak ditemukan.');
   if(seen.has(p.id))throw Error('Produk yang sama tidak boleh dicatat dua kali pada satu tanggal.');seen.add(p.id);
   const quantity=Number(item.quantity);if(!/^\d+$/.test(String(item.quantity))||!Number.isSafeInteger(quantity)||quantity<0||quantity>1000000)throw Error(`Jumlah ${p.name} pada ${formatDate(entry.date)} harus bilangan bulat 0–1.000.000.`);
   const price=money(item.price??sellingPrice(customer,p),`Harga ${p.name}`);
   if(quantity>0)positive.push({productId:p.id,quantity,price});
  }
  if(!positive.length){skippedDates.push(entry.date);continue;}
  try{const transaction=createDistribution(working,{date:entry.date,customerId:customer.id,items:positive,note:batchNote});transaction.batchId=batchId;records.push(transaction);}catch(error){throw Error(`${formatDate(entry.date)}: ${error.message}`);}
 }
 if(!records.length)throw Error('Belum ada pengiriman. Isi minimal satu jumlah produk lebih dari 0.');
 const total=records.reduce((sum,d)=>sum+distributionTotal(d),0);if(!Number.isSafeInteger(total))throw Error('Total pencatatan terlalu besar.');
 return {records,total,batch:{id:batchId,submissionId,customerId:customer.id,start:values.start,end:values.end,distributionIds:records.map(d=>d.id),skippedDates,note:batchNote,createdAt:new Date().toISOString()}};
}
export function createDistributionBatch(data,values){
 const plan=previewDistributionBatch(data,values);
 data.distributions.push(...plan.records);
 data.distributionBatches??=[];data.distributionBatches.push(plan.batch);
 return plan;
}
