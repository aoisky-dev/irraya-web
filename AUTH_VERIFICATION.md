# Auth Verification Flow

This document tracks the current email/phone OTP verification design and implementation status.

## Current status

Account verification is **implemented on the backend as a detached/dev-ready flow**, but it is **not connected to active signup yet**.

Current production-facing behavior:

```text
/register
→ create Medusa customer account directly
→ login
→ redirect to /
```

Verification-facing behavior for later:

```text
/register
→ /verify
→ request email or phone OTP
→ verify OTP
→ create account
→ login
→ redirect to /
```

The `/verify` frontend page currently shows a disabled/coming-soon state because real mail and SMS providers are not configured yet.

Phone login is detached from the active UI until a phone auth provider is configured. Google and Apple sign-in are also detached from the active login/register UI until OAuth providers, callback handling, and production credentials are configured.

## Backend implementation

The backend now exposes detached Medusa custom auth routes:

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `POST` | `/auth/customer/verify/request` | Implemented, detached | Generates a 6-digit OTP, stores a hashed copy in memory, logs the OTP to the backend console |
| `POST` | `/auth/customer/verify/confirm` | Implemented, detached | Verifies the OTP and returns a signed `verification_token` |

Implementation files:

```text
backend/src/lib/auth-verification.ts
backend/src/api/auth/customer/verify/request/route.ts
backend/src/api/auth/customer/verify/confirm/route.ts
```

## Detached delivery mode

Because no mail/SMS providers are configured yet, OTP delivery is console-only:

```text
[Irraya OTP] email user@example.com code: 123456
[Irraya OTP] phone +919999999999 code: 654321
```

This lets us test the API flow without adding provider dependencies or secrets.

## Request examples

### Request an OTP

```bash
curl -X POST "http://localhost:9000/auth/customer/verify/request" \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","value":"user@example.com"}'
```

Response:

```json
{
  "request_id": "otp_xxxxx",
  "expires_at": "2026-07-11T00:00:00.000Z",
  "message": "Verification code generated. Delivery is currently console-only until mail/SMS providers are configured."
}
```

### Confirm an OTP

```bash
curl -X POST "http://localhost:9000/auth/customer/verify/confirm" \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","value":"user@example.com","request_id":"otp_xxxxx","code":"123456"}'
```

Response:

```json
{
  "verified": true,
  "verification_token": "signed-token"
}
```

## Optional backend environment variables

These are optional today. Defaults are used when missing.

```env
OTP_TTL_SECONDS=600
OTP_MAX_ATTEMPTS=5
VERIFICATION_TOKEN_TTL_SECONDS=900
VERIFICATION_TOKEN_SECRET=replace_with_strong_random_string
```

Future provider variables, not active yet:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=Irraya <no-reply@yourdomain.com>

SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_PHONE=
```

## Security notes before enabling in production

Before reconnecting verification to signup, complete these items:

1. Replace console delivery with a real mail provider and SMS provider.
2. Store OTPs in Redis or a database instead of in-memory storage.
3. Add resend cooldown and IP/contact rate limiting.
4. Enforce `verification_token` on the backend account creation route.
5. Add provider-specific delivery failure handling.
6. Add integration tests for request/confirm/account-creation enforcement.

## Re-enabling the frontend flow later

When providers are ready:

1. Reconnect `frontend/src/app/register/page.tsx` to save pending signup data and redirect to `/verify`.
2. Restore the active OTP form in `frontend/src/app/verify/page.tsx`.
3. Keep using the existing frontend API helpers in `frontend/src/lib/api/auth.ts`:
   - `requestSignupVerification`
   - `verifySignupCode`
4. Enforce the returned `verification_token` in backend customer creation.

