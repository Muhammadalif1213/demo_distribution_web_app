export const distributionTotal = d => d.items.reduce((s,i)=>s+i.quantity*i.price,0);
export function returnValue(r,data){const item=data.distributions.find(d=>d.id===r.distributionId)?.items.find(i=>i.productId===r.productId);return r.quantity*(item?.price||0);}
export function invoiceBalance(invoice,data){return invoice.total-data.payments.reduce((s,p)=>s+p.allocations.filter(a=>a.invoiceId===invoice.id).reduce((v,a)=>v+a.amount,0),0);}
export function invoiceStatus(invoice,data){const remaining=invoiceBalance(invoice,data);return remaining===0?'Lunas':remaining<invoice.total?'Sebagian':'Belum dibayar';}
export function summarize(data,start,end,customerId='all') {
 const ds=data.distributions.filter(d=>d.date>=start&&d.date<=end&&(customerId==='all'||d.customerId===customerId));
 const rs=data.returns.filter(r=>ds.some(d=>d.id===r.distributionId));
 const gross=ds.reduce((s,d)=>s+distributionTotal(d),0), returns=rs.reduce((s,r)=>s+returnValue(r,data),0);
 const cost=ds.reduce((s,d)=>s+d.items.reduce((v,i)=>v+i.quantity*i.cost,0),0)-rs.reduce((s,r)=>s+r.quantity*ds.find(d=>d.id===r.distributionId).items.find(i=>i.productId===r.productId).cost,0);
 const payments=data.payments.filter(p=>p.date>=start&&p.date<=end).reduce((s,p)=>s+p.allocations.filter(a=>customerId==='all'||data.invoices.find(i=>i.id===a.invoiceId)?.customerId===customerId).reduce((v,a)=>v+a.amount,0),0);
 const invoices=data.invoices.filter(i=>customerId==='all'||i.customerId===customerId);
 return {gross,returns,net:gross-returns,profit:gross-returns-cost,payments,outstanding:invoices.reduce((s,i)=>s+invoiceBalance(i,data),0),distributions:ds.length,returnCount:rs.length,ds,rs};
}
export function dailySeries(data,start,end,customerId='all') {
 const series=[]; const current=new Date(`${start}T12:00:00Z`);
 while(current.toISOString().slice(0,10)<=end){const day=current.toISOString().slice(0,10);series.push({date:day,...summarize(data,day,day,customerId)});current.setUTCDate(current.getUTCDate()+1);}
 return series;
}
