import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PhoneLoginBody = {
  phone?: unknown
  password?: unknown
}

export async function POST(req: MedusaRequest<PhoneLoginBody>, res: MedusaResponse): Promise<void> {
  const body = (req.validatedBody ?? req.body ?? {}) as PhoneLoginBody
  const phone = typeof body.phone === "string" ? body.phone.trim().replace(/[\s()-]/g, "") : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!phone || !password) {
    res.status(400).json({ message: "Phone number and password are required." })
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Look up customer by phone number
    const { data: customers } = await query.graph({
      entity: "customer",
      filters: { phone },
      fields: ["id", "email"],
    })

    const customer = customers?.[0]
    if (!customer?.email) {
      res.status(401).json({ message: "No account found with this phone number." })
      return
    }

    // Authenticate using the emailpass provider with the customer's email
    const authModuleService = req.scope.resolve("auth") as any

    let authResult: any
    try {
      authResult = await authModuleService.authenticate("customer", "emailpass", {
        body: { email: customer.email, password },
      } as any)
    } catch {
      res.status(401).json({ message: "Incorrect password." })
      return
    }

    if (authResult?.error || !authResult?.authIdentity) {
      res.status(401).json({ message: authResult?.error || "Authentication failed." })
      return
    }

    // Generate a JWT token
    const { generateJwtToken } = await import("@medusajs/framework/utils") as any
    let token: string | undefined

    // Try multiple approaches to generate the token
    try {
      if (typeof generateJwtToken === "function") {
        token = generateJwtToken(
          { actor_id: customer.id, actor_type: "customer", auth_identity_id: authResult.authIdentity.id },
          { secret: process.env.JWT_SECRET || "supersecret", expiresIn: "7d" }
        )
      }
    } catch {
      // fall through
    }

    if (!token) {
      try {
        const configModule = req.scope.resolve("configModule") as any
        const jwtSecret = configModule?.projectConfig?.http?.jwtSecret || process.env.JWT_SECRET || "supersecret"
        const jwt = await import("jsonwebtoken") as any
        const sign = jwt.default?.sign || jwt.sign
        token = sign(
          { actor_id: customer.id, actor_type: "customer", auth_identity_id: authResult.authIdentity.id },
          jwtSecret,
          { expiresIn: "7d" }
        )
      } catch {
        // fall through
      }
    }

    if (!token) {
      res.status(500).json({ message: "Authentication succeeded but token generation failed." })
      return
    }

    res.status(200).json({ token })
  } catch (error: unknown) {
    console.error("[phone-login] Error:", error)
    res.status(500).json({ message: "Login failed. Please try again." })
  }
}
