export const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include at least one special character.";

const SPECIAL_CHARACTER_PATTERN = /[!@#$%^&*(),.?":{}|<>\[\]\\\/;'`~_\-+=]/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/g;

export function getPasswordValidationError(password: string): string | null {
  if (password.length < 8) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return null;
}

export function assertValidPassword(password: string): void {
  const error = getPasswordValidationError(password);
  if (error) {
    throw new Error(error);
  }
}

export function sanitizeEmail(value: string | undefined): string | undefined {
  const sanitized = value?.replace(CONTROL_CHARACTER_PATTERN, "").trim().toLowerCase();
  return sanitized || undefined;
}

export function sanitizeDisplayName(value: string): string {
  return value.replace(CONTROL_CHARACTER_PATTERN, "").trim().replace(/\s+/g, " ");
}

export function sanitizePhoneInput(value: string | undefined): string | undefined {
  const sanitized = value?.replace(CONTROL_CHARACTER_PATTERN, "").trim();
  return sanitized || undefined;
}

