import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Extract token from header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing Bearer token" })
  }
  const token = authHeader.split(" ")[1]

  const configModule = req.scope.resolve("configModule") as any
  const jwtSecret = configModule?.projectConfig?.http?.jwtSecret || process.env.JWT_SECRET

  let decoded: any
  try {
    decoded = jwt.verify(token, jwtSecret)
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" })
  }

  const authIdentityId = decoded.auth_identity_id
  const userMeta = decoded.user_metadata || {}
  const email = userMeta.email

  if (!authIdentityId || !email) {
    return res.status(400).json({ message: "Token missing auth_identity_id or email" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    filters: { email },
    fields: ["id"],
  })
  
  const customer = customers?.[0]
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" })
  }
  
  const newToken = jwt.sign(
    { actor_id: customer.id, actor_type: "customer", auth_identity_id: authIdentityId },
    jwtSecret,
    { expiresIn: "7d" }
  )
  
  return res.json({ token: newToken })
}
