import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/payments/razorpay/webhook",
      methods: ["POST"],
      bodyParser: {
        preserveRawBody: true
      }
    }
  ]
})

