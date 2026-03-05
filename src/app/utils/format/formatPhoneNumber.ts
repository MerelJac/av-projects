// src/lib/normalizePhone.ts
export function normalizePhoneNumber(
  input: string | null | undefined,
  countryCode: string = "+1" // default: US
): string | null {
  if (!input) return null;

  // Remove everything except digits
  const digits = input.replace(/\D/g, "");

  if (digits.length === 0) return null;

  // If already includes country code (e.g. 11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Standard US number (10 digits)
  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  // Already looks like E.164 without +
  if (digits.length > 11) {
    return `+${digits}`;
  }

  // Invalid / unsupported format
  return null;
}


export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith("+1")) return phone;

  const digits = phone.replace(/\D/g, "").slice(1);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
