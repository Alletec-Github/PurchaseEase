import {bcApi,simulateNextError,MockApiError} from '../src/services/bcApi';
import {purchaseOrders,purchaseOrderLines,items,vendors,money} from '../src/services/mockData';
import {query} from '../src/services/query';

jest.useFakeTimers();
async function run<T>(request:Promise<T>):Promise<T>{const result=request.then(value=>({value}),error=>({error}));await jest.runAllTimersAsync();const out=await result;if('error' in out)throw out.error;return out.value;}
beforeEach(async()=>{await run(bcApi.resetMockData());});
test('seeds every requested entity and two to four lines per order',async()=>{
  expect(purchaseOrders.length).toBeGreaterThanOrEqual(10);expect(vendors.length).toBeGreaterThanOrEqual(8);expect(items.length).toBeGreaterThanOrEqual(15);
  expect(new Set(purchaseOrders.map(o=>o.status))).toEqual(new Set(['Draft','Open','In Review','Received']));
  for(const order of purchaseOrders){const lines=purchaseOrderLines.filter(l=>l.documentId===order.id);expect(lines.length).toBeGreaterThanOrEqual(2);expect(lines.length).toBeLessThanOrEqual(4);expect(order.totalAmountIncludingTax).toBe(money(lines.reduce((sum,l)=>sum+l.amountIncludingTax,0)));}
  expect((await run(bcApi.getPurchaseInvoices())).length).toBeGreaterThanOrEqual(5);expect((await run(bcApi.getUnitsOfMeasure())).map(u=>u.code)).toEqual(['EA','BOX','KG','LTR','PCS']);expect((await run(bcApi.getLocations())).length).toBeGreaterThanOrEqual(3);
});
test('create, edit, delete lines persist with discount and tax recalculation',async()=>{
  const order=await run(bcApi.createPurchaseOrder({vendorId:vendors[0].id,notes:'Dock delivery'}));
  expect(order.vendorName).toBe(vendors[0].displayName);expect(order.notes).toBe('Dock delivery');
  const line=await run(bcApi.createPurchaseOrderLine(order.id,{itemId:items[0].id,quantity:4,directUnitCost:10,discountPercent:10}));
  expect(line.amountExcludingTax).toBe(36);expect(line.amountIncludingTax).toBe(39.6);
  expect((await run(bcApi.getPurchaseOrder(order.id))).totalAmountIncludingTax).toBe(39.6);
  await run(bcApi.updatePurchaseOrderLine(order.id,line.id,{quantity:2}));expect((await run(bcApi.getPurchaseOrder(order.id))).totalAmountIncludingTax).toBe(19.8);
  await run(bcApi.deletePurchaseOrderLine(order.id,line.id));expect((await run(bcApi.getPurchaseOrder(order.id))).totalAmountIncludingTax).toBe(0);
  await run(bcApi.deletePurchaseOrder(order.id));await expect(run(bcApi.getPurchaseOrder(order.id))).rejects.toMatchObject({status:404});
});
test('receiving changes quantities, creates one invoice and prevents repeat receipt and edits',async()=>{
  const order=(await run(bcApi.getPurchaseOrders({$filter:"status eq 'Open'"})))[0];const before=await run(bcApi.getPurchaseInvoices());
  await run(bcApi.receiveAndInvoice(order.id));expect(await run(bcApi.getPurchaseOrder(order.id))).toMatchObject({status:'Received',fullyReceived:true});
  const lines=await run(bcApi.getPurchaseOrderLines(order.id));for(const line of lines){expect(line.receivedQuantity).toBe(line.quantity);expect(line.invoicedQuantity).toBe(line.quantity);}
  expect((await run(bcApi.getPurchaseInvoices())).length).toBe(before.length+1);
  await expect(run(bcApi.receiveAndInvoice(order.id))).rejects.toMatchObject({status:409});
  await expect(run(bcApi.updatePurchaseOrder(order.id,{notes:'invalid'}))).rejects.toMatchObject({status:409});
  await expect(run(bcApi.deletePurchaseOrderLine(order.id,lines[0].id))).rejects.toMatchObject({status:409});
});
test('invalid lines do not corrupt state',async()=>{
  const order=purchaseOrders[0],line=purchaseOrderLines.find(l=>l.documentId===order.id)!;
  for(const values of [{quantity:0},{quantity:NaN},{directUnitCost:-1},{discountPercent:101}]){
    await expect(run(bcApi.updatePurchaseOrderLine(order.id,line.id,values))).rejects.toBeInstanceOf(MockApiError);
  }
  expect((await run(bcApi.getPurchaseOrderLines(order.id)))[0]).toEqual(line);
});
test('rejects unknown references, invalid dates and submitting an empty order',async()=>{
  await expect(run(bcApi.createPurchaseOrder({vendorId:'missing'}))).rejects.toMatchObject({status:400});
  await expect(run(bcApi.createPurchaseOrder({vendorId:vendors[0].id,orderDate:'2026-02-30'}))).rejects.toMatchObject({status:400});
  const order=await run(bcApi.createPurchaseOrder({vendorId:vendors[0].id}));
  await expect(run(bcApi.updatePurchaseOrder(order.id,{status:'Open'}))).rejects.toMatchObject({status:400});
  await expect(run(bcApi.createPurchaseOrderLine(order.id,{itemId:'missing'}))).rejects.toMatchObject({status:400});
});
test('reads return isolated copies and reset restores seeds',async()=>{
  const orders=await run(bcApi.getPurchaseOrders());orders[0].vendorName='MUTATED';expect((await run(bcApi.getPurchaseOrder(orders[0].id))).vendorName).not.toBe('MUTATED');
  await run(bcApi.deletePurchaseOrder(purchaseOrders[0].id));await run(bcApi.resetMockData());expect(await run(bcApi.getPurchaseOrders())).toHaveLength(12);
});
test('deterministic simulated failure occurs once and retry succeeds',async()=>{
  simulateNextError();await expect(run(bcApi.getVendors())).rejects.toMatchObject({code:'SIMULATED_ERROR',status:503});expect(await run(bcApi.getVendors())).toHaveLength(8);
});
test('nested OData filtering, aliases, ordering, pagination and escaped literals',()=>{
  const rows=[{name:"O'Brien and Sons",price:2,blocked:false},{name:'Acme',price:9,blocked:false},{name:'Other',price:1,blocked:true}];
  expect(query(rows,{$filter:"(contains(name, 'o''brien') or price ge 5) and blocked eq false",$orderby:'price desc',$top:1})).toEqual([rows[1]]);
  expect(query(rows,{filter:'blocked eq false',orderby:'price asc',top:1})).toEqual([rows[0]]);
  expect(query(rows,{$orderby:'price asc',$skip:1,$top:1})).toEqual([rows[0]]);
  expect(()=>query(rows,{$filter:'invalid query'})).toThrow(MockApiError);expect(()=>query(rows,{$top:-1})).toThrow(MockApiError);expect(()=>query(rows,{$orderby:'missing'})).toThrow(MockApiError);
});
test('all service operations simulate 300–600ms delay',async()=>{
  let resolved=false;const request=bcApi.getVendors().then(()=>{resolved=true;});await jest.advanceTimersByTimeAsync(299);expect(resolved).toBe(false);await jest.advanceTimersByTimeAsync(301);await request;expect(resolved).toBe(true);
});
