import { Logger } from "@medusajs/types"

export type ShiprocketConfig = {
  email?: string
  password?: string
  api_token?: string
  base_url?: string
}

export default class ShiprocketService {
  private config: ShiprocketConfig
  private token: string | null = null
  private logger: Logger

  constructor({ logger }: { logger: Logger }, options?: ShiprocketConfig) {
    this.logger = logger
    this.config = options || {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
      api_token: process.env.SHIPROCKET_API_TOKEN,
      base_url: process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in",
    }
    if (this.config.api_token) {
      this.token = this.config.api_token;
    }
  }

  async login() {
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
    return this.token
  }

  private async request(path: string, method: string = "GET", body?: any): Promise<any> {
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

    if (response.status === 401 && !this.config.api_token) {
      // Only try re-login if we are not using a static API token
      await this.login()
      return this.request(path, method, body) // Retry once
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
