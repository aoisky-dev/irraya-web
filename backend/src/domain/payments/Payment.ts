export type PaymentStatus = "requires_action" | "authorized" | "captured" | "failed";

export interface Payment {
  id: string;
  orderId: string;
  provider: "mock" | "stripe";
  amountInCents: number;
  currencyCode: "usd" | "inr";
  status: PaymentStatus;
  providerReference: string;
  createdAt: Date;
}

