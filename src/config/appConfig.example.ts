export const appConfig = {
  demoUsername: '[USERNAME]',
  demoPassword: '[PASSWORD]',
  clientId: '[CLIENT_ID]',
  tenantId: '[TENANT_ID]',
  clientSecret: '[CLIENT_SECRET]',
  companyId: '[COMPANY_ID]',
  environment: 'Production',
  apiHost: 'https://api.businesscentral.dynamics.com',
  loginHost: 'https://login.microsoftonline.com',
  scope: 'https://api.businesscentral.dynamics.com/.default',
  // Set to the company's local currency (BC uses a blank code for LCY).
  localCurrencyCode: '',
  appName: 'PurchaseEase',
  primaryColor: '#0078D4',
} as const;
