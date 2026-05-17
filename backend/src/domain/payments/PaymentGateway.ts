export interface PaymentAuthorizationInput {
  orderId: string;
  amountInCents: number;
  currencyCode: string;
}

export interface PaymentAuthorizationResult {
  providerReference: string;
  status: "requires_action" | "authorized";
}

export interface PaymentGateway {
  authorizePayment(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult>;
}

