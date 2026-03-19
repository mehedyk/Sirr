export function validateUsername(username: string): boolean {
  // 3-20 chars, alphanumeric + underscores
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password validation is now handled by checkPasswordStrength() in CryptoService.
 * This legacy function remains for backwards compatibility.
 * Min 12 chars, at least one uppercase, one number, one special char.
 */
export function validatePassword(password: string): boolean {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
