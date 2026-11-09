import {inventoryPage,bindInventory,inventoryView} from './inventory.js';
import {reportsPage,bindReports,reportView} from './reports.js';
import {settingsPage,integrationsPage,bindConfiguration} from './configuration.js';
import {importPage,bindImport,importView} from './import.js';
export const supplementalRoutes=['inventory','reports','import','integrations','settings'];
export function supplementalPage(data,route){return ({inventory:inventoryPage,reports:reportsPage,import:importPage,integrations:integrationsPage,settings:settingsPage})[route](data);}
export function bindSupplemental(ctx){const f={inventory:bindInventory,reports:bindReports,import:bindImport,integrations:bindConfiguration,settings:bindConfiguration}[ctx.type];f(ctx);}
export function resetSupplementalViews(){Object.assign(inventoryView,{product:'all',type:'all'});reportView.customerId='all';Object.assign(importView,{filename:'',rows:[],results:null,step:1,mapping:{date:0,customer:1,product:2,quantity:3,price:4}});}
