export function initializeSupportData(data,baselineDate='2026-11-09'){
 // Legacy inventory is retained if present, but no longer created or used.
 data.settings={name:'Berkah Pangan',user:'Alifian',secondUser:'Rina',role:'Administrator',address:'Bandung, Jawa Barat',phone:'',bankName:'',bankAccount:'',bankOwner:'',recapAnchor:'2026-10-12',recapDays:14,invoiceDueDays:7,...data.settings};
 data.integrations??={whatsapp:{enabled:true,sender:'',provider:'WhatsApp Demo'},gateway:{enabled:false,provider:'Gateway Demo'}};
 data.integrationTests??=[];data.importRuns??=[];
 return data;
}
