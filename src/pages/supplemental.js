import {reportsPage,bindReports,reportView} from './reports.js';
import {settingsPage,integrationsPage,bindConfiguration} from './configuration.js';
import {importPage,bindImport,importView} from './import.js';
export const supplementalRoutes=['reports','import','integrations','settings'];
export function supplementalPage(data,route){return ({reports:reportsPage,import:importPage,integrations:integrationsPage,settings:settingsPage})[route](data);}
export function bindSupplemental(ctx){const f={reports:bindReports,import:bindImport,integrations:bindConfiguration,settings:bindConfiguration}[ctx.type];f(ctx);}
export function resetSupplementalViews(){reportView.customerId='all';Object.assign(importView,{filename:'',rows:[],results:null,step:1,mapping:{date:0,customer:1,product:2,quantity:3,price:4}});}
