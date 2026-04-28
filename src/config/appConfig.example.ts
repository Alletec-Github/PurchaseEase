/**
 * PurchaseEase App Configuration
 *
 * Copy this file to appConfig.ts and fill in your actual values.
 * NEVER commit appConfig.ts — it is gitignored.
 */
export const appConfig = {
  // Entra ID (Azure AD) OAuth2 Client Credentials
  clientId: 'YOUR_ENTRA_CLIENT_ID',
  tenantId: 'YOUR_ENTRA_TENANT_ID',
  clientSecret: 'YOUR_ENTRA_CLIENT_SECRET',

  // Business Central Environment
  bcEnvironment: 'YOUR_BC_ENVIRONMENT', // e.g., 'Production' or 'Sandbox'
  bcCompanyId: 'YOUR_BC_COMPANY_ID',

  // Derived URLs (auto-computed from above values)
  get bcBaseUrl(): string {
    return `https://api.businesscentral.dynamics.com/v2.0/${this.tenantId}/${this.bcEnvironment}/api/v2.0/companies(${this.bcCompanyId})`;
  },
  get oauthTokenUrl(): string {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  },
  oauthScope: 'https://api.businesscentral.dynamics.com/.default',

  // Demo Login Credentials
  demoUsername: 'rishabh.shukla',
  demoPassword: '1234',

  // App Branding
  appName: 'PurchaseEase',
  primaryColor: '#0078D4',

  // Azure Document Intelligence (Future)
  adiEndpoint: '',
  adiApiKey: '',
  adiModelId: '',
};
