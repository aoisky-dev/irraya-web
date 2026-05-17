import type {
  PaymentAuthorizationInput,
  PaymentAuthorizationResult,
  PaymentGateway
} from "../../domain/payments/PaymentGateway.js";

export class MockPaymentGateway implements PaymentGateway {
  async authorizePayment(
    input: PaymentAuthorizationInput
  ): Promise<PaymentAuthorizationResult> {
    return {
      providerReference: `mock_${input.orderId}`,
      status: "authorized"
    };
  }
}

