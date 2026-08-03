import { afterEach, describe, expect, it, vi } from "vitest";
import { createRazorpayPaymentOrder, linkRazorpayPaymentToOrder, verifyRazorpayPayment } from "../src/lib/api/checkout";

describe("razorpay checkout api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a Razorpay payment order through the backend", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      razorpay_order_id: "order_rzp_123",
      amount: 125000,
      currency: "INR",
      key_id: "rzp_test_123",
      status: "created"
    }));
    vi.stubGlobal("fetch", fetchMock);

    const order = await createRazorpayPaymentOrder({
      cartId: "cart_123",
      amountInCents: 125000,
      currencyCode: "inr",
      customer: {
        name: "Test User",
        email: "test@example.com"
      }
    });

    expect(order).toEqual({
      razorpayOrderId: "order_rzp_123",
      amountInCents: 125000,
      currencyCode: "inr",
      keyId: "rzp_test_123",
      status: "created"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/payments/razorpay/orders");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      cart_id: "cart_123",
      amount: 125000,
      currency: "INR",
      customer: {
        name: "Test User",
        email: "test@example.com"
      }
    });
  });

  it("verifies Razorpay signed payment details through the backend", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      payment: {
        id: "pay_123",
        orderId: "cart_123",
        provider: "razorpay",
        amountInCents: 125000,
        status: "authorized",
        providerReference: "order_rzp_123",
        providerPaymentId: "pay_123"
      }
    }));
    vi.stubGlobal("fetch", fetchMock);

    const payment = await verifyRazorpayPayment({
      cartId: "cart_123",
      amountInCents: 125000,
      razorpayOrderId: "order_rzp_123",
      razorpayPaymentId: "pay_123",
      razorpaySignature: "signed"
    });

    expect(payment.provider).toBe("razorpay");
    expect(payment.status).toBe("authorized");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/payments/razorpay/verify");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      cart_id: "cart_123",
      amount: 125000,
      razorpay_order_id: "order_rzp_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "signed"
    });
  });

  it("links a verified Razorpay payment to the completed Medusa order", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      linked: true,
      metadata_attached: true
    }));
    vi.stubGlobal("fetch", fetchMock);

    await linkRazorpayPaymentToOrder({
      cartId: "cart_123",
      orderId: "order_123",
      amountInCents: 125000,
      currencyCode: "inr",
      razorpayOrderId: "order_rzp_123",
      razorpayPaymentId: "pay_123",
      status: "authorized"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/payments/razorpay/link-order");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      cart_id: "cart_123",
      order_id: "order_123",
      amount: 125000,
      currency: "INR",
      razorpay_order_id: "order_rzp_123",
      razorpay_payment_id: "pay_123",
      status: "authorized"
    });
  });
});

