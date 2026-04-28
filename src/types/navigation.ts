import type { DraftOrder, ScannedDocumentResult } from './app';

// ── Root Stack (Auth vs Main) ────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

// ── Bottom Tab Navigator ─────────────────────────────────

export type BottomTabParamList = {
  DashboardTab: undefined;
  OrdersTab: undefined;
  CreateTab: undefined;
  InvoicesTab: undefined;
  SettingsTab: undefined;
};

// ── Dashboard Stack ──────────────────────────────────────

export type DashboardStackParamList = {
  DashboardHome: undefined;
  OrderDetail: { orderId: string };
  CreateOrder: { prefillData?: Partial<DraftOrder> } | undefined;
};

// ── Orders Stack ─────────────────────────────────────────

export type OrdersStackParamList = {
  OrderList: undefined;
  OrderDetail: { orderId: string };
  EditOrder: { orderId: string };
};

// ── Create Stack ─────────────────────────────────────────

export type CreateStackParamList = {
  CreateOrder: { prefillData?: Partial<DraftOrder> } | undefined;
  ScanDocument: undefined;
};

// ── Invoices Stack ───────────────────────────────────────

export type InvoicesStackParamList = {
  PostedInvoices: undefined;
  InvoiceDetail: { invoiceId: string };
};

// ── Settings Stack ───────────────────────────────────────

export type SettingsStackParamList = {
  Settings: undefined;
};
