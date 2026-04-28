import axios, { AxiosInstance, AxiosError } from 'axios';
import { appConfig } from '../config/appConfig';
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  Vendor,
  Item,
  PurchaseInvoice,
  UnitOfMeasure,
  Location,
  BCApiResponse,
  BCApiError,
  ODataQueryParams,
} from '../types/api';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', appConfig.clientId);
  params.append('client_secret', appConfig.clientSecret);
  params.append('scope', appConfig.oauthScope);

  const response = await axios.post(appConfig.oauthTokenUrl, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  cachedToken = response.data.access_token;
  tokenExpiry = now + response.data.expires_in * 1000;
  return cachedToken!;
}

function buildQueryString(params?: ODataQueryParams): string {
  if (!params) return '';
  const parts: string[] = [];
  if (params.$filter) parts.push(`$filter=${encodeURIComponent(params.$filter)}`);
  if (params.$orderby) parts.push(`$orderby=${encodeURIComponent(params.$orderby)}`);
  if (params.$top !== undefined) parts.push(`$top=${params.$top}`);
  if (params.$skip !== undefined) parts.push(`$skip=${params.$skip}`);
  if (params.$expand) parts.push(`$expand=${encodeURIComponent(params.$expand)}`);
  if (params.$select) parts.push(`$select=${encodeURIComponent(params.$select)}`);
  if (params.$count) parts.push('$count=true');
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.bcBaseUrl,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30000,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<BCApiError>) => {
      const apiError: BCApiError = {
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        message:
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred',
        status: error.response?.status || 0,
      };
      return Promise.reject(apiError);
    },
  );

  return client;
}

const api = createApiClient();

// ── Vendors ──────────────────────────────────────────────

export async function getVendors(
  params?: ODataQueryParams,
): Promise<Vendor[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<Vendor>>(`/vendors${qs}`);
  return response.data.value;
}

// ── Items ────────────────────────────────────────────────

export async function getItems(params?: ODataQueryParams): Promise<Item[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<Item>>(`/items${qs}`);
  return response.data.value;
}

// ── Purchase Orders ──────────────────────────────────────

export async function getPurchaseOrders(
  params?: ODataQueryParams,
): Promise<PurchaseOrder[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<PurchaseOrder>>(
    `/purchaseOrders${qs}`,
  );
  return response.data.value;
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const response = await api.get<PurchaseOrder>(`/purchaseOrders(${id})`);
  return response.data;
}

export async function createPurchaseOrder(
  data: Partial<PurchaseOrder>,
): Promise<PurchaseOrder> {
  const response = await api.post<PurchaseOrder>('/purchaseOrders', data);
  return response.data;
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrder>,
  etag?: string,
): Promise<PurchaseOrder> {
  const headers: Record<string, string> = {};
  if (etag) headers['If-Match'] = etag;
  const response = await api.patch<PurchaseOrder>(
    `/purchaseOrders(${id})`,
    data,
    { headers },
  );
  return response.data;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await api.delete(`/purchaseOrders(${id})`);
}

// ── Purchase Order Lines ─────────────────────────────────

export async function getPurchaseOrderLines(
  orderId: string,
  params?: ODataQueryParams,
): Promise<PurchaseOrderLine[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<PurchaseOrderLine>>(
    `/purchaseOrders(${orderId})/purchaseOrderLines${qs}`,
  );
  return response.data.value;
}

export async function createPurchaseOrderLine(
  orderId: string,
  data: Partial<PurchaseOrderLine>,
): Promise<PurchaseOrderLine> {
  const response = await api.post<PurchaseOrderLine>(
    `/purchaseOrders(${orderId})/purchaseOrderLines`,
    data,
  );
  return response.data;
}

export async function updatePurchaseOrderLine(
  orderId: string,
  lineId: string,
  data: Partial<PurchaseOrderLine>,
  etag?: string,
): Promise<PurchaseOrderLine> {
  const headers: Record<string, string> = {};
  if (etag) headers['If-Match'] = etag;
  const response = await api.patch<PurchaseOrderLine>(
    `/purchaseOrders(${orderId})/purchaseOrderLines(${lineId})`,
    data,
    { headers },
  );
  return response.data;
}

export async function deletePurchaseOrderLine(
  orderId: string,
  lineId: string,
): Promise<void> {
  await api.delete(
    `/purchaseOrders(${orderId})/purchaseOrderLines(${lineId})`,
  );
}

// ── Actions ──────────────────────────────────────────────

export async function receiveAndInvoice(orderId: string): Promise<void> {
  await api.post(
    `/purchaseOrders(${orderId})/Microsoft.NAV.receiveAndInvoice`,
  );
}

// ── Purchase Invoices ────────────────────────────────────

export async function getPurchaseInvoices(
  params?: ODataQueryParams,
): Promise<PurchaseInvoice[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<PurchaseInvoice>>(
    `/purchaseInvoices${qs}`,
  );
  return response.data.value;
}

// ── Units of Measure ─────────────────────────────────────

export async function getUnitsOfMeasure(
  params?: ODataQueryParams,
): Promise<UnitOfMeasure[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<UnitOfMeasure>>(
    `/unitsOfMeasure${qs}`,
  );
  return response.data.value;
}

// ── Locations ────────────────────────────────────────────

export async function getLocations(
  params?: ODataQueryParams,
): Promise<Location[]> {
  const qs = buildQueryString(params);
  const response = await api.get<BCApiResponse<Location>>(`/locations${qs}`);
  return response.data.value;
}

// ── Connection Test ──────────────────────────────────────

export async function testConnection(): Promise<boolean> {
  try {
    await getVendors({ $top: 1 });
    return true;
  } catch {
    return false;
  }
}

export const bcApi = {
  getVendors,
  getItems,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderLines,
  createPurchaseOrderLine,
  updatePurchaseOrderLine,
  deletePurchaseOrderLine,
  receiveAndInvoice,
  getPurchaseInvoices,
  getUnitsOfMeasure,
  getLocations,
  testConnection,
};
