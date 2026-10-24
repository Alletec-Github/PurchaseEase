import type { PurchaseOrder, PurchaseOrderLine, ODataQueryParams, BCApiError } from '../types/api';
import { createSeedState, newOrder, newLine, calculateLine, calculateOrder, localDate } from './mockData';
import { query } from './query';

import { MockApiError } from './errors';
export { MockApiError } from './errors';
let state=createSeedState();
let sequence=10013;
let lineSequence=100;
let nextError:BCApiError|null=null;
const copy=<T,>(value:T):T=>value===undefined?value:JSON.parse(JSON.stringify(value));
export function simulateNextError(error:BCApiError={code:'SIMULATED_ERROR',message:'Simulated service failure. Please retry.',status:503}) { nextError=error; }
async function action<T>(fn:()=>T):Promise<T> {
  await new Promise(resolve=>setTimeout(resolve,300+Math.floor(Math.random()*301)));
  if(nextError) {const error=nextError;nextError=null;throw new MockApiError(error.code,error.message,error.status);}
  return copy(fn());
}
const fail=(message:string,status=400):never=>{throw new MockApiError(status===404?'NOT_FOUND':status===409?'CONFLICT':'VALIDATION_ERROR',message,status);};
const findOrder=(id:string)=>state.purchaseOrders.find(o=>o.id===id)??fail('Purchase order not found',404);
const editable=(id:string)=>{const order=findOrder(id);if(order.fullyReceived)fail('Received orders are read-only',409);return order;};
const linesFor=(id:string)=>state.purchaseOrderLines.filter(l=>l.documentId===id);
const recalculate=(id:string)=>calculateOrder(findOrder(id),linesFor(id));
function validateLine(line:PurchaseOrderLine) {
  if(!Number.isFinite(line.quantity)||line.quantity<=0)fail('Quantity must be greater than zero');
  if(!Number.isFinite(line.directUnitCost)||line.directUnitCost<0)fail('Unit cost cannot be negative');
  if(!Number.isFinite(line.discountPercent)||line.discountPercent<0||line.discountPercent>100)fail('Discount must be between 0 and 100');
  if(!state.unitsOfMeasure.some(u=>u.code===line.unitOfMeasureCode))fail('Unknown unit of measure');
}
function validateDates(order:PurchaseOrder) {
  for(const value of [order.orderDate,order.requestedReceiptDate].filter(Boolean)) {
    const parsed=new Date(value+'T12:00:00');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(parsed.getTime())||localDate(parsed)!==value)fail('Enter a valid date');
  }
  if(order.requestedReceiptDate&&order.requestedReceiptDate<order.orderDate)fail('Receipt date cannot be before order date');
}
export const getVendors=(params?:ODataQueryParams)=>action(()=>query(state.vendors,params));
export const getItems=(params?:ODataQueryParams)=>action(()=>query(state.items,params));
export const getPurchaseOrders=(params?:ODataQueryParams)=>action(()=>query(state.purchaseOrders,params));
export const getPurchaseOrder=(id:string)=>action(()=>findOrder(id));
export const getPurchaseOrderLines=(id:string,params?:ODataQueryParams)=>action(()=>{findOrder(id);return query(linesFor(id),params);});
export const getPurchaseInvoices=(params?:ODataQueryParams)=>action(()=>query(state.purchaseInvoices,params));
export const getUnitsOfMeasure=(params?:ODataQueryParams)=>action(()=>query(state.unitsOfMeasure,params));
export const getLocations=(params?:ODataQueryParams)=>action(()=>query(state.locations,params));
export const createPurchaseOrder=(data:Partial<PurchaseOrder>)=>action(()=>{
  const vendor=state.vendors.find(v=>v.id===data.vendorId)??fail('Select a valid vendor');
  if(vendor.blocked)fail('Vendor is blocked');
  const number=`PO-${sequence}`;
  const order={...newOrder(vendor,`order-${sequence}`,number),orderDate:data.orderDate||localDate(),requestedReceiptDate:data.requestedReceiptDate||'',notes:data.notes||''};
  validateDates(order);sequence++;state.purchaseOrders.push(order);return order;
});
export const updatePurchaseOrder=(id:string,data:Partial<PurchaseOrder>,_etag?:string)=>action(()=>{
  const order=editable(id);
  if(data.status&&data.status!=='Open'&&data.status!=='In Review'&&data.status!==order.status)fail('Invalid status transition');
  if(data.status==='Open'&&!linesFor(id).length)fail('Add at least one line before submitting');
  const updated={...order,orderDate:data.orderDate??order.orderDate,requestedReceiptDate:data.requestedReceiptDate??order.requestedReceiptDate,
    postingDate:data.postingDate??order.postingDate,notes:data.notes??order.notes,status:data.status??order.status};
  validateDates(updated);Object.assign(order,updated);recalculate(id);return order;
});
export const deletePurchaseOrder=(id:string)=>action(()=>{
  const order=editable(id);if(order.status!=='Draft')fail('Only draft orders can be deleted',409);
  state.purchaseOrders=state.purchaseOrders.filter(o=>o.id!==id);state.purchaseOrderLines=state.purchaseOrderLines.filter(l=>l.documentId!==id);
});
export const createPurchaseOrderLine=(id:string,data:Partial<PurchaseOrderLine>)=>action(()=>{
  const order=editable(id);
  const item=state.items.find(i=>i.id===data.itemId||i.number===data.lineObjectNumber)??fail('Select a valid catalog item');
  if(item.blocked)fail('Item is blocked');
  const nextSequence=Math.max(0,...linesFor(id).map(l=>l.sequence))+10000;
  const base=newLine(order,item,`new-line-${lineSequence}`,nextSequence);
  const line=calculateLine({...base,quantity:data.quantity??1,directUnitCost:data.directUnitCost??item.unitCost,
    discountPercent:data.discountPercent??0,description:data.description??item.displayName,unitOfMeasureCode:data.unitOfMeasureCode??item.baseUnitOfMeasureCode});
  validateLine(line);lineSequence++;state.purchaseOrderLines.push(line);recalculate(id);return line;
});
export const updatePurchaseOrderLine=(id:string,lineId:string,data:Partial<PurchaseOrderLine>,_etag?:string)=>action(()=>{
  editable(id);const original=linesFor(id).find(l=>l.id===lineId)??fail('Order line not found',404);
  const updated=calculateLine({...original,quantity:data.quantity??original.quantity,directUnitCost:data.directUnitCost??original.directUnitCost,
    discountPercent:data.discountPercent??original.discountPercent,description:data.description??original.description,
    unitOfMeasureCode:data.unitOfMeasureCode??original.unitOfMeasureCode});
  validateLine(updated);Object.assign(original,updated);recalculate(id);return original;
});
export const deletePurchaseOrderLine=(id:string,lineId:string)=>action(()=>{
  editable(id);if(!linesFor(id).some(l=>l.id===lineId))fail('Order line not found',404);
  state.purchaseOrderLines=state.purchaseOrderLines.filter(l=>!(l.documentId===id&&l.id===lineId));recalculate(id);
});
export const receiveAndInvoice=(id:string)=>action(()=>{
  const order=editable(id);if(order.status!=='Open')fail('Only open orders can be received',409);
  const lines=linesFor(id);if(!lines.length)fail('Cannot receive an empty order');
  order.status='Received';order.fullyReceived=true;order.postingDate=localDate();
  lines.forEach(l=>{l.receivedQuantity=l.invoicedQuantity=l.quantity;});recalculate(id);
  state.purchaseInvoices.push({id:`received-${id}`,number:`PI-${20000+sequence++}`,postingDate:localDate(),invoiceDate:localDate(),
    vendorName:order.vendorName,vendorNumber:order.vendorNumber,totalAmountExcludingTax:order.totalAmountExcludingTax,
    totalAmountIncludingTax:order.totalAmountIncludingTax,status:'Posted',orderNumber:order.number});
});
export const resetMockData=()=>action(()=>{state=createSeedState();sequence=10013;lineSequence=100;});
export const testConnection=()=>action(()=>true);
export const bcApi={getVendors,getItems,getPurchaseOrders,getPurchaseOrder,createPurchaseOrder,updatePurchaseOrder,deletePurchaseOrder,
  getPurchaseOrderLines,createPurchaseOrderLine,updatePurchaseOrderLine,deletePurchaseOrderLine,receiveAndInvoice,getPurchaseInvoices,
  getUnitsOfMeasure,getLocations,resetMockData,testConnection};
