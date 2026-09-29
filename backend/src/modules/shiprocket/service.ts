import { Logger } from "@medusajs/types"

export type ShiprocketConfig = {
  email?: string
  password?: string
  api_token?: string
  base_url?: string
}

// Module-level token cache so all ShiprocketService instances within the same
// Node.js process share one token and avoid a fresh /auth/login on every request.
const _sharedToken = { value: null as string | null }

export default class ShiprocketService {
  private config: ShiprocketConfig
  private logger: Logger

  constructor({ logger }: { logger: Logger }, options?: ShiprocketConfig) {
    this.logger = logger
    this.config = options || {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
      api_token: process.env.SHIPROCKET_API_TOKEN,
      base_url: process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in",
    }
    // Seed the shared token from a static API token if provided
    if (this.config.api_token && !_sharedToken.value) {
      _sharedToken.value = this.config.api_token
    }
  }

  private get token(): string | null {
    return _sharedToken.value
  }

  private set token(value: string | null) {
    _sharedToken.value = value
  }

  async login(): Promise<string> {
    if (!this.config.email || !this.config.password) {
      throw new Error("Shiprocket credentials are not configured")
    }

    const response = await fetch(`${this.config.base_url}/v1/external/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      this.logger.error(`Shiprocket login failed: ${error}`)
      throw new Error("Failed to authenticate with Shiprocket")
    }

    const data = await response.json()
    this.token = data.token
    return this.token as string
  }

  private async request(path: string, method: string = "GET", body?: any, retried = false): Promise<any> {
    if (!this.token) {
      await this.login()
    }

    const response = await fetch(`${this.config.base_url}/v1/external${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // On 401: attempt one re-login if we're using email/password auth (not a static API token)
    // The `retried` guard prevents an infinite loop if credentials are wrong.
    if (response.status === 401 && !this.config.api_token && !retried) {
      this.token = null
      await this.login()
      return this.request(path, method, body, true)
    }

    if (!response.ok) {
      const error = await response.text()
      this.logger.error(`Shiprocket request failed: ${error}`)
      throw new Error(`Shiprocket API error: ${response.status}`)
    }

    return response.json()
  }

  async createOrder(payload: any) {
    return this.request("/orders/create/adhoc", "POST", payload)
  }

  async cancelOrder(ids: number[]) {
    return this.request("/orders/cancel", "POST", { ids })
  }

  async createReturnOrder(payload: any) {
    return this.request("/orders/create/return", "POST", payload)
  }

  async checkServiceability(params: { pickup_postcode: string, delivery_postcode: string, weight: string | number, cod: 0 | 1 }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/courier/serviceability/?${query}`, "GET")
  }

  async generateInvoice(ids: (number | string)[]) {
    return this.request("/orders/print/invoice", "POST", { ids: ids.map(id => Number(id)) })
  }
}
