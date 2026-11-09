export function initializeSupportData(data,baselineDate='2026-11-09'){
 data.inventory??={opening:{},baselineDate,receipts:[]};
 data.inventory.opening??={};data.inventory.receipts??=[];
 for(const p of data.products){if(data.inventory.opening[p.id]===undefined){const shipped=data.distributions.reduce((s,d)=>s+d.items.filter(i=>i.productId===p.id).reduce((v,i)=>v+i.quantity,0),0);data.inventory.opening[p.id]=(p.stock||0)+shipped;}}
 data.settings={name:'Berkah Pangan',user:'Alifian',secondUser:'Rina',role:'Administrator',address:'Bandung, Jawa Barat',phone:'',bankName:'',bankAccount:'',bankOwner:'',recapAnchor:'2026-10-12',recapDays:14,invoiceDueDays:7,...data.settings};
 data.integrations??={whatsapp:{enabled:true,sender:'',provider:'WhatsApp Demo'},gateway:{enabled:false,provider:'Gateway Demo'}};
 data.integrationTests??=[];data.importRuns??=[];
 return data;
}
