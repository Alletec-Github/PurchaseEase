import type { PurchaseOrderLine, Vendor, Item } from './api';

// ── Draft Order (local state during creation) ────────────

export interface DraftOrderLine {
  tempId: string;
  item: Item;
  quantity: number;
  directUnitCost: number;
  discountPercent: number;
  lineType: 'Item' | 'Account' | 'Resource';
  description: string;
  unitOfMeasureCode: string;
}

export interface DraftOrder {
  vendor: Vendor | null;
  lines: DraftOrderLine[];
  orderDate: Date;
  requestedReceiptDate: Date | null;
  notes: string;
}

// ── Filter State ─────────────────────────────────────────

export type OrderFilterTab = 'All' | 'Draft' | 'Open' | 'Received';

export interface FilterState {
  tab: OrderFilterTab;
  searchQuery: string;
  dateFrom?: string;
  dateTo?: string;
}

// ── User Profile ─────────────────────────────────────────

export interface UserProfile {
  username: string;
  displayName: string;
  isLoggedIn: boolean;
  loginTimestamp: number;
}

// ── Scanned Document (placeholder for ADI) ───────────────

export interface ScannedDocumentResult {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: {
    description: string;
    quantity: number;
    unitCost: number;
    amount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  confidence: number;
}
