import Stripe from "stripe";
import type { PaymentGateway, PaymentAuthorizationInput, PaymentAuthorizationResult } from "../../domain/payments/PaymentGateway.js";
import { AppError } from "../../shared/errors/AppError.js";

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2024-12-18.acacia" as any, // use current API version
    });
  }

  async authorizePayment(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: input.amountInCents,
        currency: input.currencyCode,
        metadata: { orderId: input.orderId },
      });

      return {
        providerReference: paymentIntent.client_secret || paymentIntent.id,
        status: "requires_action"
      };
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      throw new AppError("Failed to authorize payment with Stripe", "PAYMENT_FAILED", 500);
    }
  }

  async capturePayment(paymentId: string): Promise<any> {
    // Skeleton: In a real app, you'd capture the Stripe PaymentIntent
    throw new Error("Method not implemented.");
  }
}
