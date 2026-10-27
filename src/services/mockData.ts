import type { Vendor, Item, PurchaseOrder, PurchaseOrderLine, PurchaseInvoice, UnitOfMeasure, Location } from '../types/api';

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateAgo = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return localDate(date); };
export const vendors: Vendor[] = [
  ['Contoso Electronics Ltd.', 'Seattle', 'WA'], ['Fabrikam Office Supplies', 'Portland', 'OR'],
  ['Northwind Industrial', 'Chicago', 'IL'], ['Adventure Works', 'Austin', 'TX'],
  ['Blue Yonder Packaging', 'Denver', 'CO'], ['Litware Components', 'Boston', 'MA'],
  ['Wide World Importers', 'New York', 'NY'], ['Alpine Safety Equipment', 'Phoenix', 'AZ'],
].map(([displayName, city, state], i) => ({
  id: `vendor-${i+1}`, number: `V${1000+i}`, displayName, addressLine1: `${120+i*10} Commerce Avenue`,
  addressLine2: '', city, state, country: 'US', postalCode: `${98000+i}`, phoneNumber: `+1 206 555 01${String(i).padStart(2,'0')}`,
  email: `orders@${displayName.split(' ')[0].toLowerCase()}.example`, balance: money(1250+i*214.75), blocked: '', currencyCode: 'USD', paymentTermsId: 'net30',
}));
const catalog: [string, number, string][] = [
  ['Wireless Keyboard Pro',45.99,'PCS'], ['USB-C Docking Station',129.99,'PCS'], ['Monitor Stand Adjustable',34.50,'PCS'],
  ['Office Paper A4',28.50,'BOX'], ['Ergonomic Office Chair',245,'EA'], ['27-inch LED Monitor',219,'EA'],
  ['Steel Fasteners',12.80,'KG'], ['Industrial Lubricant',18.50,'LTR'], ['Safety Gloves',8.75,'PCS'],
  ['Packing Tape',32,'BOX'], ['Ethernet Cable 5m',6.90,'PCS'], ['Shipping Cartons',42,'BOX'],
  ['Laser Toner Cartridge',78,'EA'], ['Hand Tool Set',89.50,'EA'], ['Warehouse Labels',16.25,'BOX'],
];
export const items: Item[] = catalog.map(([displayName,unitCost,baseUnitOfMeasureCode],i)=>({
  id:`item-${i+1}`, number:`I${1000+i}`, displayName, type:'Inventory', unitPrice:money(unitCost*1.35), unitCost,
  inventory:40+i*15, baseUnitOfMeasureCode, blocked:false, itemCategoryCode:i<6?'OFFICE':'INDUSTRIAL',
}));
export const unitsOfMeasure: UnitOfMeasure[] = ['EA','BOX','KG','LTR','PCS'].map((code,i)=>({id:`uom-${i}`,code,displayName:({EA:'Each',BOX:'Box',KG:'Kilogram',LTR:'Liter',PCS:'Pieces'})[code]!,internationalStandardCode:code}));
export const locations: Location[] = ['Seattle Central','Chicago Distribution','Austin Warehouse'].map((displayName,i)=>({
  id:`location-${i+1}`,code:['WEST','CENTRAL','SOUTH'][i],displayName,addressLine1:`${200+i} Warehouse Road`,addressLine2:'',
  city:['Seattle','Chicago','Austin'][i],state:['WA','IL','TX'][i],country:'US',postalCode:'98001',phoneNumber:'+1 206 555 0100',
}));
export function newOrder(vendor: Vendor, id: string, number: string, date = localDate()): PurchaseOrder {
  return { id,number,orderDate:date,postingDate:date,vendorId:vendor.id,vendorNumber:vendor.number,vendorName:vendor.displayName,
    status:'Draft',totalAmountExcludingTax:0,totalTaxAmount:0,totalAmountIncludingTax:0,fullyReceived:false,
    buyFromAddressLine1:vendor.addressLine1,buyFromAddressLine2:vendor.addressLine2,buyFromCity:vendor.city,buyFromState:vendor.state,
    buyFromCountry:vendor.country,buyFromPostCode:vendor.postalCode,shipToAddressLine1:locations[0].addressLine1,shipToAddressLine2:'',
    shipToCity:locations[0].city,shipToState:locations[0].state,shipToCountry:'US',shipToPostCode:locations[0].postalCode,
    currencyCode:vendor.currencyCode,paymentTermsId:vendor.paymentTermsId,shipmentMethodId:'standard',requestedReceiptDate:date,
    discountAmount:0,lastModifiedDateTime:new Date().toISOString(),notes:'',
  };
}
export function lineAmounts(quantity: number, directUnitCost: number, discountPercent: number) {
  const discountAmount = money(quantity * directUnitCost * discountPercent / 100);
  const amountExcludingTax = money(quantity * directUnitCost - discountAmount);
  return {discountAmount, amountExcludingTax, amountIncludingTax: money(amountExcludingTax * 1.1)};
}
export function calculateLine(line: PurchaseOrderLine): PurchaseOrderLine {
  return {...line, ...lineAmounts(line.quantity, line.directUnitCost, line.discountPercent)};
}
export function newLine(order: PurchaseOrder, item: Item, id: string, sequence: number): PurchaseOrderLine {
  return calculateLine({id,documentId:order.id,sequence,itemId:item.id,lineType:'Item',lineObjectNumber:item.number,
    description:item.displayName,unitOfMeasureCode:item.baseUnitOfMeasureCode,quantity:1,directUnitCost:item.unitCost,discountPercent:0,
    discountAmount:0,amountExcludingTax:0,amountIncludingTax:0,taxCode:'TAX10',expectedReceiptDate:order.requestedReceiptDate,
    receivedQuantity:0,invoicedQuantity:0});
}
export function calculateOrder(order: PurchaseOrder, lines: PurchaseOrderLine[]): void {
  order.totalAmountExcludingTax=money(lines.reduce((sum,line)=>sum+line.amountExcludingTax,0));
  order.totalAmountIncludingTax=money(lines.reduce((sum,line)=>sum+line.amountIncludingTax,0));
  order.totalTaxAmount=money(order.totalAmountIncludingTax-order.totalAmountExcludingTax);
  order.discountAmount=money(lines.reduce((sum,line)=>sum+line.discountAmount,0));
  order.lastModifiedDateTime=new Date().toISOString();
}
export const purchaseOrders: PurchaseOrder[] = [];
export const purchaseOrderLines: PurchaseOrderLine[] = [];
for(let i=0;i<12;i++) {
  const order=newOrder(vendors[i%vendors.length],`order-${i+1}`,`PO-${10001+i}`,dateAgo(i*2));
  const status=(['Draft','Open','In Review','Received'] as const)[i%4];
  order.status=status==='Received'?'Open':status;order.fullyReceived=status==='Received';
  const lines=Array.from({length:2+i%3},(_,j)=>{
    const line=newLine(order,items[(i+j)%items.length],`line-${i}-${j}`,(j+1)*10000);
    line.quantity=(j+1)*5;line.discountPercent=j===1?5:0;
    if(order.fullyReceived)line.receivedQuantity=line.invoicedQuantity=line.quantity;
    return calculateLine(line);
  });
  calculateOrder(order,lines);purchaseOrders.push(order);purchaseOrderLines.push(...lines);
}
export const purchaseInvoices: PurchaseInvoice[] = Array.from({length:5},(_,i)=>{
  const order=purchaseOrders[[3,7,11,3,7][i]];
  return {id:`invoice-${i+1}`,number:`PI-${20001+i}`,postingDate:dateAgo(i*3),invoiceDate:dateAgo(i*3+1),vendorName:order.vendorName,
    vendorNumber:order.vendorNumber,totalAmountExcludingTax:order.totalAmountExcludingTax,totalAmountIncludingTax:order.totalAmountIncludingTax,
    status:'Posted',orderNumber:i<3?order.number:`PO-${9000+i}`};
});
export function createSeedState() {
  return JSON.parse(JSON.stringify({vendors,items,purchaseOrders,purchaseOrderLines,purchaseInvoices,unitsOfMeasure,locations})) as {
    vendors:Vendor[];items:Item[];purchaseOrders:PurchaseOrder[];purchaseOrderLines:PurchaseOrderLine[];
    purchaseInvoices:PurchaseInvoice[];unitsOfMeasure:UnitOfMeasure[];locations:Location[];
  };
}
