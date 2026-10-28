import crypto from "node:crypto";
import { verifyRazorpayWebhookSignature } from "../src/lib/razorpay";

async function run() {
  console.log("Running Razorpay Webhook HMAC Security Verification Tests...");

  const testSecret = "test_webhook_secret_key_12345";
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

  const validPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test123",
          amount: 50000,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(validPayload)
    .digest("hex");

  // Test 1: Valid signature matches
  const test1 = verifyRazorpayWebhookSignature(validPayload, validSignature);
  if (!test1) throw new Error("Test 1 Failed: Valid signature should verify as true");
  console.log("✓ Test 1 Passed: Valid HMAC signature matches raw payload.");

  // Test 2: Forged / tampered signature is rejected
  const fakeSignature = crypto
    .createHmac("sha256", "wrong_secret")
    .update(validPayload)
    .digest("hex");
  const test2 = verifyRazorpayWebhookSignature(validPayload, fakeSignature);
  if (test2) throw new Error("Test 2 Failed: Tampered signature should be rejected");
  console.log("✓ Test 2 Passed: Forged signature is strictly rejected.");

  // Test 3: Tampered payload with valid signature is rejected
  const tamperedPayload = validPayload.replace("50000", "10000");
  const test3 = verifyRazorpayWebhookSignature(tamperedPayload, validSignature);
  if (test3) throw new Error("Test 3 Failed: Modified payload should fail verification");
  console.log("✓ Test 3 Passed: Tampered payload fails HMAC verification.");

  // Test 4: Empty signature / body rejected
  const test4a = verifyRazorpayWebhookSignature("", validSignature);
  const test4b = verifyRazorpayWebhookSignature(validPayload, "");
  if (test4a || test4b) throw new Error("Test 4 Failed: Empty fields should be rejected");
  console.log("✓ Test 4 Passed: Empty body or signature safely rejected.");

  console.log("\nAll Razorpay Webhook HMAC security checks passed successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
