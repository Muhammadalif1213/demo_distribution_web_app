import {money} from './master-data.js';
import {validDate} from './operations.js';
import {invoiceBalance} from './calculations.js';
export const paymentMethods=['Transfer bank','Tunai'];
export function paymentCustomerId(data,payment){return payment.customerId||data.invoices.find(i=>i.id===payment.allocations[0]?.invoiceId)?.customerId;}
export function unpaidInvoices(data,customerId){return data.invoices.filter(i=>i.customerId===customerId&&invoiceBalance(i,data)>0).slice().sort((a,b)=>a.due.localeCompare(b.due)||a.id.localeCompare(b.id));}
const trim=(value,label,max=300)=>{const result=String(value??'').trim();if(result.length>max)throw Error(`${label} maksimal ${max} karakter.`);return result;};
export function previewPayment(data,values){
 const date=validDate(values.date,'Tanggal pembayaran');
 const customer=data.customers.find(c=>c.id===values.customerId);if(!customer)throw Error('Customer tidak ditemukan.');
 const amount=money(values.amount,'Nominal pembayaran');if(amount<1)throw Error('Nominal pembayaran harus lebih dari nol.');
 if(!paymentMethods.includes(values.method))throw Error('Metode pembayaran tidak valid.');
 const reference=trim(values.reference,'Referensi',100),note=trim(values.note,'Catatan',500),submissionId=trim(values.submissionId,'ID pencatatan',100);
 if(!submissionId)throw Error('ID pencatatan wajib tersedia. Buka ulang form pembayaran.');
 if(data.payments.some(p=>p.submissionId===submissionId))throw Error('Pembayaran ini sudah dicatat. Jangan simpan ulang.');
 if(reference&&data.payments.some(p=>paymentCustomerId(data,p)===customer.id&&p.method===values.method&&p.reference?.toLowerCase()===reference.toLowerCase()))throw Error('Referensi pembayaran ini sudah dicatat untuk customer dan metode yang sama.');
 if(!Array.isArray(values.allocations)||!values.allocations.length)throw Error('Alokasikan pembayaran ke minimal satu invoice.');
 const seen=new Set();const allocations=values.allocations.map(a=>{
  const inv=data.invoices.find(i=>i.id===a.invoiceId);if(!inv)throw Error('Invoice tujuan tidak ditemukan.');
  if(inv.customerId!==customer.id)throw Error('Semua invoice harus milik customer yang dipilih.');
  if(seen.has(inv.id))throw Error('Invoice yang sama tidak boleh dialokasikan dua kali.');seen.add(inv.id);
  if(date<inv.issued)throw Error(`Tanggal pembayaran tidak boleh mendahului tanggal terbit ${inv.id}.`);
  const allocation=money(a.amount,'Nominal alokasi');if(allocation<1)throw Error('Setiap alokasi harus lebih dari nol.');
  const before=invoiceBalance(inv,data);if(allocation>before)throw Error(`Alokasi ${inv.id} melebihi sisa tagihan terkini.`);
  return {invoiceId:inv.id,amount:allocation,balanceBefore:before,balanceAfter:before-allocation};
 });
 const sum=allocations.reduce((s,a)=>s+a.amount,0);if(!Number.isSafeInteger(sum))throw Error('Jumlah alokasi terlalu besar.');
 if(sum!==amount)throw Error('Total alokasi harus sama persis dengan nominal pembayaran. Kelebihan/deposit belum didukung.');
 return {date,customerId:customer.id,customerName:customer.name,amount,method:values.method,reference,note,submissionId,allocations};
}
export function createPayment(data,values){
 const record=previewPayment(data,values);let n=Math.max(0,...data.payments.map(p=>Number(p.id.replace(/^PAY-/,''))||0))+1;
 while(data.payments.some(p=>p.id===`PAY-${String(n).padStart(4,'0')}`))n++;
 const payment={id:`PAY-${String(n).padStart(4,'0')}`,...record,createdAt:new Date().toISOString()};
 data.payments.push(payment);return payment;
}
export function autoAllocate(data,customerId,amount){
 let left=money(amount,'Nominal pembayaran');const allocations=[];
 for(const inv of unpaidInvoices(data,customerId)){if(!left)break;const part=Math.min(left,invoiceBalance(inv,data));allocations.push({invoiceId:inv.id,amount:part});left-=part;}
 return {allocations,unallocated:left};
}
