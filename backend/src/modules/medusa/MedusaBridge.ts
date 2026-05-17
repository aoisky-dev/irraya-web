/**
 * Placeholder adapter to connect this domain layer with Medusa modules.
 * In upcoming steps we will replace this with real Medusa services and plugins.
 */
export class MedusaBridge {
  getStoreApiBaseUrl(): string {
    return "/store";
  }

  getAdminApiBaseUrl(): string {
    return "/admin";
  }
}

