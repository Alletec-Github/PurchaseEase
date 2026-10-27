import { create, AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isVendorBlocked } from '../src/services/format';
import { createBcApi, ApiError, type BcConfig } from '../src/services/bcApi';
const id = '11111111-1111-1111-1111-111111111111';
const config: BcConfig = { clientId: 'test-client', clientSecret: 'test-secret&special=+', tenantId: 'test-tenant', companyId: id, environment: 'Test Environment', apiHost: 'https://bc.test', loginHost: 'https://login.test', scope: 'https://bc.test/.default' };
const base = `https://bc.test/v2.0/test-tenant/Test%20Environment/api/v2.0/companies(${id})`;
const token = { access_token: 'test-token', expires_in: 3600 };
function setup(replies: { data?: unknown; status?: number }[]) {
  const calls: InternalAxiosRequestConfig[] = [];
  const http = create({ adapter: async request => {
    calls.push(request);
    const reply = replies.shift();
    if (!reply) throw new Error('Unexpected request');
    const response: AxiosResponse = { data: reply.data, status: reply.status ?? 200, statusText: '', headers: new AxiosHeaders(), config: request };
    if (response.status >= 400) throw new AxiosError('HTTP failure', undefined, request, undefined, response);
    return response;
  } });
  return { api: createBcApi(config, http), calls };
}
test('shares token acquisition, encodes form credentials, and reuses cached token', async () => {
  const { api, calls } = setup([{data:token}, {data:{value:[]}}, {data:{value:[]}}, {data:{value:[]}}]);
  await Promise.all([api.getVendors(), api.getItems()]); await api.getPurchaseOrders();
  expect(calls.filter(c=>c.url?.includes('/token'))).toHaveLength(1);
  expect(new URLSearchParams(calls[0].data).get('client_secret')).toBe(config.clientSecret);
  expect(calls.slice(1).every(c=>c.headers.get('Authorization')==='Bearer test-token')).toBe(true);
});
test('refreshes a token before expiry and clears it on cache reset', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  try {
    const { api, calls } = setup([{data:token},{data:{value:[]}},{data:token},{data:{value:[]}},{data:token},{data:{value:[]}}]);
    await api.getVendors(); now.mockReturnValue(3550000); await api.getVendors(); api.clearCache(); await api.getVendors();
    expect(calls.filter(c=>c.url?.includes('/token'))).toHaveLength(3);
  } finally { now.mockRestore(); }
});
test('refreshes once for unauthorized API requests, without an infinite retry', async () => {
  const { api, calls }=setup([{data:token},{status:401},{data:{...token,access_token:'new-token'}},{status:401}]);
  await expect(api.getVendors()).rejects.toMatchObject({status:401});
  expect(calls).toHaveLength(4); expect(calls[3].headers.get('Authorization')).toBe('Bearer new-token');
});
test('follows server pages, preserves OData options, and honors top across pages', async () => {
  const {api,calls}=setup([{data:token},{data:{value:[{id:'a'}],'@odata.nextLink':`${base}/vendors?$skiptoken=next`}},{data:{value:[{id:'b'},{id:'c'}]}}]);
  expect(await api.getVendors({$filter:"contains(displayName,'O''Brien')",$orderby:'displayName', $top:2, $expand:'contacts'})).toEqual([{id:'a'},{id:'b'}]);
  expect(calls[1].params).toMatchObject({$orderby:'displayName',$top:2,$expand:'contacts'});
  expect(calls[2].url).toBe(`${base}/vendors?$skiptoken=next`);
  expect(await api.getVendors({$top:0})).toEqual([]);
});
test('never sends a token to a foreign or other-company pagination URL', async () => {
  for (const next of ['https://malicious.test/steal',`${config.apiHost}/v2.0/other/companies/records`,`${base}/../other-company/vendors`]) {
    const {api,calls}=setup([{data:token},{data:{value:[],'@odata.nextLink':next}}]);
    await expect(api.getVendors()).rejects.toMatchObject({code:'UNSAFE_PAGE'}); expect(calls).toHaveLength(2);
  }
});
test('rejects pagination loops and invalid IDs before unsafe requests', async () => {
  const {api,calls}=setup([{data:token},{data:{value:[],'@odata.nextLink':`${base}/vendors`}},{data:{value:[],'@odata.nextLink':`${base}/vendors`}}]);
  await expect(api.getVendors()).rejects.toMatchObject({code:'INVALID_PAGE'});
  expect(()=>api.getPurchaseOrder('../vendors')).toThrow(ApiError);expect(calls).toHaveLength(3);
});
test('uses the caller ETag, or reads it for a mutation; never uses wildcard concurrency', async () => {
  const {api,calls}=setup([{data:token},{data:{id}},{data:{'@odata.etag':'W/"current"'}},{status:204}]);
  await api.updatePurchaseOrder(id,{orderDate:'2026-10-27'},'W/"screen"'); await api.deletePurchaseOrderLine(id,id);
  expect(calls[1].method).toBe('patch');expect(calls[1].headers.get('If-Match')).toBe('W/"screen"');
  expect(calls[3].method).toBe('delete'); expect(calls[3].url).toBe(`${base}/purchaseOrders(${id})/purchaseOrderLines(${id})`);expect(calls[3].headers.get('If-Match')).toBe('W/"current"');
});
test('rejects missing ETags and does not retry failed write requests', async () => {
  const {api,calls}=setup([{data:token},{data:{id}}]);
  await expect(api.deletePurchaseOrder(id)).rejects.toMatchObject({code:'MISSING_ETAG'});expect(calls).toHaveLength(2);
  const other=setup([{data:token},{status:503}]);
  await expect(other.api.createPurchaseOrder({vendorId:id})).rejects.toMatchObject({status:503});expect(other.calls).toHaveLength(2);
});
test('writes standard header/line payloads and invokes the receive action', async () => {
  const {api,calls}=setup([{data:token},{data:{id}},{data:{id}},{status:204}]);
  await api.createPurchaseOrder({vendorId:id,orderDate:'2026-10-27'});
  await api.createPurchaseOrderLine(id,{itemId:id,lineType:'Item',quantity:2,directUnitCost:15,discountPercent:10});
  await api.receiveAndInvoice(id);
  expect(JSON.parse(calls[1].data)).toEqual({vendorId:id,orderDate:'2026-10-27'});
  expect(JSON.parse(calls[2].data)).toMatchObject({quantity:2,discountPercent:10});
  expect(calls[3].url).toBe(`${base}/purchaseOrders(${id})/Microsoft.NAV.receiveAndInvoice`);
});
test('surfaces BC errors and sanitizes token failures without leaking HTTP config', async () => {
  const {api}=setup([{data:token},{status:400,data:{error:{code:'BadRequest',message:'Vendor is blocked'}}}]);
  await expect(api.getVendors()).rejects.toMatchObject({code:'BadRequest',message:'Vendor is blocked',status:400});
  const auth=setup([{status:401,data:{error:'invalid_client',error_description:`secret ${config.clientSecret}`}}]);
  try { await auth.api.getVendors(); throw new Error('Expected failure'); }
  catch(error) {expect(error).toBeInstanceOf(ApiError);expect(JSON.stringify(error)).not.toContain(config.clientSecret);expect(error).not.toHaveProperty('config');}
});

test('recognizes Business Central blank vendor enum without hiding eligible vendors', () => {
  expect(isVendorBlocked('_x0020_')).toBe(false); expect(isVendorBlocked(' ')).toBe(false);
  expect(isVendorBlocked('')).toBe(false); expect(isVendorBlocked('All')).toBe(true); expect(isVendorBlocked('Payment')).toBe(true);
});
