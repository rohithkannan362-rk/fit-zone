/**
 * Password utilities for FitZone account management.
 */

/**
 * Generates a readable and secure temporary password combining a person's name
 * (or "Member") with a special symbol and a random 4-digit number.
 * Guarantees minimum 8 characters and prevents predictable patterns like "Rohith123".
 * Example output: "Rohith@4827", "Alex#9182", "Member!7382"
 */
export function generateSecureTemporaryPassword(fullName?: string): string {
  const cleanName = (fullName || "")
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z]/g, "");

  const base =
    cleanName.length >= 3
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 8).toLowerCase()
      : "Member";

  const symbols = ["@", "#", "!", "$", "&", "*"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const num = Math.floor(1000 + Math.random() * 9000);

  let password = `${base}${symbol}${num}`;
  while (password.length < 8) {
    const extraChars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    password += extraChars.charAt(Math.floor(Math.random() * extraChars.length));
  }
  return password;
}

/**
 * Validates a temporary or custom password according to application security requirements.
 */
export function validatePasswordSecurity(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  const weakPasswords = [
    "password",
    "12345678",
    "123456789",
    "fitzone123",
    "fitzone123!",
    "fitzone",
    "admin123",
    "qwertyui",
  ];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: "Please choose a stronger, less predictable password" };
  }
  return { isValid: true };
}
