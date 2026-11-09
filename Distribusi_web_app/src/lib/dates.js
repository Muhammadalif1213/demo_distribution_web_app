export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(value,label='Tanggal'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')||!Number.isFinite(Date.parse(`${value}T12:00:00Z`))||new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)!==value)throw Error(`${label} tidak valid.`);
 return value;
}
export function suggestedPeriodStart(day,anchor){validDate(day);validDate(anchor);const offset=Math.floor((Date.parse(day)-Date.parse(anchor))/86400000/14)*14;const d=new Date(anchor+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
