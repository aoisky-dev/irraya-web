import type { PaymentGateway } from "./PaymentGateway.js";
import type { Payment } from "./Payment.js";

export class PaymentService {
  constructor(private readonly paymentGateway: PaymentGateway) {}

  async initializePayment(orderId: string, amountInCents: number): Promise<Payment> {
    const auth = await this.paymentGateway.authorizePayment({
      orderId,
      amountInCents,
      currencyCode: "inr"
    });

    return {
      id: `pay_${orderId}`,
      orderId,
      provider: "mock",
      amountInCents,
      currencyCode: "inr",
      status: auth.status,
      providerReference: auth.providerReference,
      createdAt: new Date()
    };
  }
}

