import type { User } from "../types";
import { assertValidPassword, sanitizeDisplayName, sanitizeEmail } from "../auth/validation";
import { medusaRequest } from "./client";

type MedusaCustomer = {
  id: string;
  email: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown>;
  addresses?: any[];
};

const mapCustomerToUser = (customer: MedusaCustomer): User => ({
  id: customer.id,
  email: customer.email,
  phone: customer.phone ?? undefined,
  firstName: customer.first_name ?? "",
  lastName: customer.last_name ?? "",
  role: (customer.metadata?.role as "admin" | "customer" | undefined) ?? "customer",
  createdAt: customer.created_at ?? new Date().toISOString(),
  addresses: customer.addresses ?? []
});

const isEmailIdentifier = (value: string): boolean => /.+@.+\..+/.test(value.trim());

const normalizePhone = (value: string): string => value.trim().replace(/[\s()-]/g, "");

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    const message = err.message.trim();
    return message.length > 0 ? message : "Unexpected auth error.";
  }
  return "Unexpected auth error.";
};

const LOGIN_FAILED_MESSAGE = "Account doesn't exist or password is incorrect.";

async function authTokenWithCandidates(paths: string[], payload: Record<string, unknown>): Promise<string> {
  let lastError = "";

  for (const path of paths) {
    try {
      const response = await medusaRequest<{ token?: string; access_token?: string; jwt?: string }>(path, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const token = response.token ?? response.access_token ?? response.jwt;
      if (token) return token;
    } catch (error: unknown) {
      lastError = toErrorMessage(error);
      // Try next candidate path.
    }
  }

  throw new Error(lastError || "Failed to authenticate with Medusa customer auth.");
}

type ContactChannel = "email" | "phone";

type StoreCustomerCreatePayload = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  metadata?: Record<string, unknown>;
};

export interface RegisterInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  verificationToken?: string;
  verificationChannel?: ContactChannel;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface VerificationRequestInput {
  channel: ContactChannel;
  value: string;
}

export interface VerificationConfirmInput extends VerificationRequestInput {
  code: string;
  requestId?: string;
}

export interface ChangePasswordInput {
  token: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}

async function createStoreCustomer(token: string, payload: StoreCustomerCreatePayload): Promise<MedusaCustomer> {
  const response = await medusaRequest<{ customer?: MedusaCustomer }>("/store/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.customer) {
    throw new Error("Account was created, but the customer profile was not returned.");
  }

  return response.customer;
}

export async function register(data: RegisterInput): Promise<User> {
  const auth = await registerWithAuth(data);
  return auth.user;
}

export async function registerWithAuth(data: RegisterInput): Promise<AuthResult> {
  assertValidPassword(data.passwordHash);

  const email = sanitizeEmail(data.email);
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  const firstName = sanitizeDisplayName(data.firstName);
  const lastName = sanitizeDisplayName(data.lastName);

  if (!email && !phone) {
    throw new Error("Provide an email or phone number to create an account.");
  }

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  const basePayload = {
    password: data.passwordHash,
    first_name: firstName,
    last_name: lastName,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(data.verificationToken ? { verification_token: data.verificationToken } : {}),
    ...(data.verificationChannel ? { verification_channel: data.verificationChannel } : {})
  };

  if (email) {
    let token: string | undefined;

    try {
      token = await authTokenWithCandidates(["/auth/customer/emailpass/register"], {
        email,
        password: data.passwordHash
      });
    } catch {
      // Fall through to compatible/custom registration endpoints below.
    }

    if (token) {
      const customer = await createStoreCustomer(token, {
        email,
        first_name: firstName,
        last_name: lastName,
        ...(phone ? { phone } : {}),
        metadata: {
          ...(data.verificationToken ? { verification_token: data.verificationToken } : {}),
          ...(data.verificationChannel ? { verification_channel: data.verificationChannel } : {})
        }
      });

      return { token, user: mapCustomerToUser(customer) };
    }
  }

  const registrationAttempts: Array<{ path: string; body: Record<string, unknown> }> = [];

  if (email) {
    registrationAttempts.push({ path: "/auth/customer/emailpass/register", body: basePayload });
  }
  if (phone) {
    registrationAttempts.push({ path: "/auth/customer/phonepass/register", body: basePayload });
  }
  registrationAttempts.push(
    { path: "/auth/customer/register", body: basePayload },
    { path: "/store/customers", body: basePayload }
  );

  let lastError = "";
  for (const attempt of registrationAttempts) {
    try {
      const response = await medusaRequest<{ token?: string; access_token?: string; jwt?: string }>(attempt.path, {
        method: "POST",
        body: JSON.stringify(attempt.body)
      });

      const token = response.token ?? response.access_token ?? response.jwt;
      if (token) {
        const user = await getMe(token);
        return { token, user };
      }
      break;
    } catch (error: unknown) {
      lastError = toErrorMessage(error);
    }
  }

  // Register endpoint may not always return a customer payload; fetch canonical profile via login.
  const loginIdentifier = email ?? phone;
  if (!loginIdentifier) {
    throw new Error(lastError || "Account was created but login identifier is missing.");
  }

  const loginResult = await login(loginIdentifier, data.passwordHash);
  return loginResult;
}

export async function login(identifier: string, passwordHash: string): Promise<{ token: string; user: User }> {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier) {
    throw new Error("Email or phone number is required.");
  }

  try {
    const token = isEmailIdentifier(normalizedIdentifier)
      ? await authTokenWithCandidates(["/auth/customer/emailpass", "/auth/customer/emailpass/login", "/store/auth"], {
          email: normalizedIdentifier,
          password: passwordHash
        })
      : await authTokenWithCandidates(
          ["/auth/customer/phonepass", "/auth/customer/phonepass/login", "/auth/customer/smspass", "/auth/customer/password"],
          {
            phone: normalizePhone(normalizedIdentifier),
            identifier: normalizePhone(normalizedIdentifier),
            password: passwordHash
          }
        );

    const user = await getMe(token);
    return { token, user };
  } catch {
    throw new Error(LOGIN_FAILED_MESSAGE);
  }
}

export async function requestSignupVerification(input: VerificationRequestInput): Promise<{ requestId?: string; message?: string }> {
  const value = input.channel === "phone" ? normalizePhone(input.value) : input.value.trim();
  const attempts = [
    "/auth/customer/verify/request",
    `/auth/customer/${input.channel}/verify/request`,
    `/auth/customer/${input.channel}/otp/request`
  ];

  let lastError = "";
  for (const path of attempts) {
    try {
      return await medusaRequest<{ request_id?: string; id?: string; message?: string }>(path, {
        method: "POST",
        body: JSON.stringify({
          channel: input.channel,
          value,
          [input.channel]: value
        })
      }).then((response) => ({
        requestId: response.request_id ?? response.id,
        message: response.message
      }));
    } catch (error: unknown) {
      lastError = toErrorMessage(error);
    }
  }

  throw new Error(lastError || "Failed to send verification code.");
}

export async function verifySignupCode(input: VerificationConfirmInput): Promise<{ verificationToken?: string; verified: boolean }> {
  const value = input.channel === "phone" ? normalizePhone(input.value) : input.value.trim();
  const attempts = [
    "/auth/customer/verify/confirm",
    `/auth/customer/${input.channel}/verify/confirm`,
    `/auth/customer/${input.channel}/otp/verify`
  ];

  let lastError = "";
  for (const path of attempts) {
    try {
      const response = await medusaRequest<{ verified?: boolean; token?: string; verification_token?: string }>(path, {
        method: "POST",
        body: JSON.stringify({
          channel: input.channel,
          value,
          code: input.code.trim(),
          request_id: input.requestId,
          [input.channel]: value
        })
      });

      return {
        verified: response.verified ?? Boolean(response.token || response.verification_token),
        verificationToken: response.token ?? response.verification_token
      };
    } catch (error: unknown) {
      lastError = toErrorMessage(error);
    }
  }

  throw new Error(lastError || "Failed to verify code.");
}

export async function changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
  const email = sanitizeEmail(input.email);
  if (!input.token) {
    throw new Error("You must be signed in to change your password.");
  }
  if (!email) {
    throw new Error("Account email is required to change password.");
  }
  if (!input.currentPassword) {
    throw new Error("Current password is required.");
  }
  if (input.currentPassword === input.newPassword) {
    throw new Error("New password must be different from current password.");
  }

  assertValidPassword(input.newPassword);

  const response = await medusaRequest<{ message?: string }>("/store/customers/me/password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.token}`
    },
    body: JSON.stringify({
      email,
      current_password: input.currentPassword,
      new_password: input.newPassword
    })
  });

  return { message: response.message || "Password changed successfully." };
}


export async function saveCustomerAddress(token: string, address: {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postal_code: string;
  country_code: string;
}): Promise<void> {
  await medusaRequest("/store/customers/me/addresses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(address)
  });
}

export async function getMe(token: string): Promise<User> {
  const response = await medusaRequest<{ customer?: MedusaCustomer }>("/store/customers/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.customer) {
    throw new Error("Failed to load customer profile from Medusa.");
  }

  return mapCustomerToUser(response.customer);
}
