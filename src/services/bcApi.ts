import { create, isAxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { appConfig } from '../config/appConfig';
import type { BCApiError, BCApiResponse, ODataQueryParams, PurchaseOrder, PurchaseOrderLine, Vendor, Item, PurchaseInvoice, UnitOfMeasure, Location } from '../types/api';

export class ApiError extends Error implements BCApiError {
  constructor(public code: string, message: string, public status: number) {
    super(message); this.name = 'ApiError';
  }
}
function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const details = error.response?.data?.error;
    // Never include Axios config: it contains Authorization or the client secret.
    return new ApiError(typeof details?.code === 'string' ? details.code : `HTTP_${status}`,
      typeof details?.message === 'string' ? details.message :
      typeof error.response?.data?.error_description === 'string' ? 'Entra authentication failed. Check app credentials and admin consent.' :
      status === 412 ? 'This record changed in Business Central. Refresh before editing again.' :
      status === 0 ? 'Cannot reach Business Central. Check your connection and retry.' : `Business Central request failed (${status}).`, status);
  }
  return new ApiError('UNKNOWN', 'Unable to complete the Business Central request.', 0);
}
export interface BcConfig { tenantId: string; clientId: string; clientSecret: string; environment: string; companyId: string; apiHost: string; loginHost: string; scope: string }
type OrderWrite = Partial<Pick<PurchaseOrder, 'vendorId' | 'orderDate' | 'postingDate' | 'requestedReceiptDate' | 'paymentTermsId' | 'shipmentMethodId'>>;
type LineWrite = Partial<Pick<PurchaseOrderLine, 'itemId' | 'lineType' | 'lineObjectNumber' | 'description' | 'unitOfMeasureCode' | 'quantity' | 'directUnitCost' | 'discountPercent' | 'expectedReceiptDate'>>;
const guid = (value: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ApiError('INVALID_ID', 'Invalid Business Central record ID.', 400);
  return value;
};
export function createBcApi(config: BcConfig, http: AxiosInstance = create({ timeout: 30000 })) {
  const base = `${config.apiHost}/v2.0/${encodeURIComponent(config.tenantId)}/${encodeURIComponent(config.environment)}/api/v2.0/companies(${config.companyId})`;
  let cached: { value: string; expires: number } | undefined;
  let pending: Promise<string> | undefined;
  let generation = 0;
  async function token(): Promise<string> {
    if (cached && cached.expires > Date.now() + 60000) return cached.value;
    if (!pending) {
      const startedGeneration = generation;
      pending = (async () => {
        try {
          const body = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'client_credentials', scope: config.scope });
          const { data } = await http.post(`${config.loginHost}/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
          if (typeof data.access_token !== 'string' || !Number.isFinite(Number(data.expires_in))) throw new ApiError('INVALID_TOKEN', 'Entra returned an invalid token response.', 502);
          if (startedGeneration === generation) cached = { value: data.access_token, expires: Date.now() + Number(data.expires_in) * 1000 };
          return data.access_token as string;
        } catch (error) { throw normalizeError(error); }
        finally { if (startedGeneration === generation) pending = undefined; }
      })();
    }
    return pending;
  }
  const clearCache = () => { generation++; cached = undefined; pending = undefined; };
  async function request<T>(path: string, options: AxiosRequestConfig = {}, retry = true): Promise<T> {
    let bearer: string | undefined;
    try {
      if (path.startsWith('http') && !new URL(path).href.startsWith(`${base}/`)) throw new ApiError('UNSAFE_PAGE', 'Business Central returned an invalid pagination URL.', 502);
      bearer = await token();
      const response = await http.request<T>({ ...options, url: path.startsWith('http') ? path : `${base}/${path}`, headers: { Accept: 'application/json', ...options.headers, Authorization: `Bearer ${bearer}` } });
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401 && retry) {
        if (cached?.value === bearer) cached = undefined;
        return request<T>(path, options, false);
      }
      throw normalizeError(error);
    }
  }
  function params(query: ODataQueryParams = {}) {
    const { filter, orderby, top, ...values } = query;
    return { ...values, $filter: query.$filter ?? filter, $orderby: query.$orderby ?? orderby, $top: query.$top ?? top };
  }
  async function list<T>(path: string, query?: ODataQueryParams): Promise<T[]> {
    const values: T[] = [], seen = new Set<string>();
    const limit = query?.$top ?? query?.top;
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) throw new ApiError('INVALID_QUERY', '$top must be a nonnegative integer.', 400);
    if (limit === 0) return [];
    let next: string | undefined = path;
    let first = true;
    while (next) {
      if (seen.has(next)) throw new ApiError('INVALID_PAGE', 'Business Central returned a pagination loop.', 502);
      seen.add(next);
      const page: BCApiResponse<T> = await request(next, first ? { params: params(query) } : {});
      if (!Array.isArray(page.value)) throw new ApiError('INVALID_RESPONSE', 'Business Central returned an invalid list.', 502);
      values.push(...page.value);
      if (limit !== undefined && values.length >= limit) return values.slice(0, limit);
      next = page['@odata.nextLink']; first = false;
    }
    return values;
  }
  const orderPath = (id: string) => `purchaseOrders(${guid(id)})`;
  const linesPath = (id: string) => `${orderPath(id)}/purchaseOrderLines`;
  const linePath = (id: string, lineId: string) => `${linesPath(id)}(${guid(lineId)})`;
  async function mutate<T>(path: string, method: 'PATCH' | 'DELETE', data?: unknown, etag?: string): Promise<T> {
    const tag = etag ?? (await request<{ '@odata.etag'?: string }>(path))['@odata.etag'];
    if (!tag) throw new ApiError('MISSING_ETAG', 'Record version is missing. Refresh before saving.', 409);
    return request<T>(path, { method, data, headers: { 'If-Match': tag } });
  }
  return {
    clearCache,
    getVendors: (q?: ODataQueryParams) => list<Vendor>('vendors', q),
    getItems: (q?: ODataQueryParams) => list<Item>('items', q),
    getPurchaseOrders: (q?: ODataQueryParams) => list<PurchaseOrder>('purchaseOrders', q),
    getPurchaseOrder: (id: string) => request<PurchaseOrder>(orderPath(id)),
    createPurchaseOrder: (data: OrderWrite) => request<PurchaseOrder>('purchaseOrders', { method: 'POST', data }),
    updatePurchaseOrder: (id: string, data: OrderWrite, etag?: string) => mutate<PurchaseOrder>(orderPath(id), 'PATCH', data, etag),
    deletePurchaseOrder: (id: string, etag?: string) => mutate<void>(orderPath(id), 'DELETE', undefined, etag),
    getPurchaseOrderLines: (id: string, q?: ODataQueryParams) => list<PurchaseOrderLine>(linesPath(id), q),
    createPurchaseOrderLine: (id: string, data: LineWrite) => request<PurchaseOrderLine>(linesPath(id), { method: 'POST', data }),
    updatePurchaseOrderLine: (id: string, lineId: string, data: LineWrite, etag?: string) => mutate<PurchaseOrderLine>(linePath(id, lineId), 'PATCH', data, etag),
    deletePurchaseOrderLine: (id: string, lineId: string, etag?: string) => mutate<void>(linePath(id, lineId), 'DELETE', undefined, etag),
    receiveAndInvoice: (id: string) => request<void>(`${orderPath(id)}/Microsoft.NAV.receiveAndInvoice`, { method: 'POST' }),
    getPurchaseInvoices: (q?: ODataQueryParams) => list<PurchaseInvoice>('purchaseInvoices', q),
    getPurchaseInvoice: (id: string) => request<PurchaseInvoice>(`purchaseInvoices(${guid(id)})`),
    getUnitsOfMeasure: (q?: ODataQueryParams) => list<UnitOfMeasure>('unitsOfMeasure', q),
    getLocations: (q?: ODataQueryParams) => list<Location>('locations', q),
    testConnection: async () => { await list<Vendor>('vendors', { $top: 1 }); return true; },
  };
}
export const bcApi = createBcApi(appConfig);
export const { getVendors, getItems, getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderLines, createPurchaseOrderLine, updatePurchaseOrderLine, deletePurchaseOrderLine, receiveAndInvoice,
  getPurchaseInvoices, getUnitsOfMeasure, getLocations } = bcApi;
