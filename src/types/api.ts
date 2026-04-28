// ── BC API Response Wrapper ──────────────────────────────

export interface BCApiResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  value: T[];
}

export interface BCApiError {
  code: string;
  message: string;
  status: number;
}

export interface ODataQueryParams {
  $filter?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $expand?: string;
  $select?: string;
  $count?: boolean;
}

// ── Purchase Order ───────────────────────────────────────

export type PurchaseOrderStatus = 'Draft' | 'In Review' | 'Open';

export interface PurchaseOrder {
  id: string;
  number: string;
  orderDate: string;
  postingDate: string;
  vendorId: string;
  vendorNumber: string;
  vendorName: string;
  status: PurchaseOrderStatus;
  totalAmountExcludingTax: number;
  totalTaxAmount: number;
  totalAmountIncludingTax: number;
  fullyReceived: boolean;
  buyFromAddressLine1: string;
  buyFromAddressLine2: string;
  buyFromCity: string;
  buyFromState: string;
  buyFromCountry: string;
  buyFromPostCode: string;
  shipToAddressLine1: string;
  shipToAddressLine2: string;
  shipToCity: string;
  shipToState: string;
  shipToCountry: string;
  shipToPostCode: string;
  currencyCode: string;
  paymentTermsId: string;
  shipmentMethodId: string;
  requestedReceiptDate: string;
  discountAmount: number;
  lastModifiedDateTime: string;
  '@odata.etag'?: string;
}

// ── Purchase Order Line ──────────────────────────────────

export type LineType = 'Item' | 'Account' | 'Resource';

export interface PurchaseOrderLine {
  id: string;
  documentId: string;
  sequence: number;
  itemId: string;
  lineType: LineType;
  lineObjectNumber: string;
  description: string;
  unitOfMeasureCode: string;
  quantity: number;
  directUnitCost: number;
  discountPercent: number;
  discountAmount: number;
  amountExcludingTax: number;
  amountIncludingTax: number;
  taxCode: string;
  expectedReceiptDate: string;
  receivedQuantity: number;
  invoicedQuantity: number;
  '@odata.etag'?: string;
}

// ── Vendor ───────────────────────────────────────────────

export interface Vendor {
  id: string;
  number: string;
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  balance: number;
  blocked: string;
  currencyCode: string;
  paymentTermsId: string;
}

// ── Item ─────────────────────────────────────────────────

export type ItemType = 'Inventory' | 'Service' | 'Non-Inventory';

export interface Item {
  id: string;
  number: string;
  displayName: string;
  type: ItemType;
  unitPrice: number;
  unitCost: number;
  inventory: number;
  baseUnitOfMeasureCode: string;
  blocked: boolean;
  itemCategoryCode: string;
}

// ── Purchase Invoice ─────────────────────────────────────

export interface PurchaseInvoice {
  id: string;
  number: string;
  postingDate: string;
  invoiceDate: string;
  vendorName: string;
  vendorNumber: string;
  totalAmountExcludingTax: number;
  totalAmountIncludingTax: number;
  status: string;
  orderNumber: string;
}

// ── Unit of Measure ──────────────────────────────────────

export interface UnitOfMeasure {
  id: string;
  code: string;
  displayName: string;
  internationalStandardCode: string;
}

// ── Location ─────────────────────────────────────────────

export interface Location {
  id: string;
  code: string;
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
}
