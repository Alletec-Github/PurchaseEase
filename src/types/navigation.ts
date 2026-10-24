import type { NavigatorScreenParams } from '@react-navigation/native';
import type { DraftOrder } from './app';
export type RootStackParamList={Login:undefined;Main:undefined};
export type OrderFlowParamList={
  DashboardHome:undefined;OrderList:undefined;OrderDetail:{orderId:string};EditOrder:{orderId:string};
  CreateOrder:{prefillData?:Partial<DraftOrder>;prefillKey?:string}|undefined;ScanDocument:undefined;
};
export type DashboardStackParamList=OrderFlowParamList;
export type OrdersStackParamList=OrderFlowParamList;
export type CreateStackParamList=OrderFlowParamList;
export type InvoicesStackParamList={PostedInvoices:undefined;InvoiceDetail:{invoiceId:string}};
export type SettingsStackParamList={Settings:undefined};
export type BottomTabParamList={
  DashboardTab:NavigatorScreenParams<DashboardStackParamList>|undefined;
  OrdersTab:NavigatorScreenParams<OrdersStackParamList>|undefined;
  CreateTab:NavigatorScreenParams<CreateStackParamList>|undefined;
  InvoicesTab:NavigatorScreenParams<InvoicesStackParamList>|undefined;
  SettingsTab:NavigatorScreenParams<SettingsStackParamList>|undefined;
};
