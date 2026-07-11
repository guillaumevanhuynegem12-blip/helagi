// Form validation shared by the auth pages (client) and the auth API routes
// (server). Client-side checks are for friendly immediate feedback; the server
// runs the same checks again because the client can't be trusted.
//
// Deliberately minimal: an account is just an email + password. Helagi does
// not ask for names, birth dates, or any medical information at signup.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;
export const EMAIL_MAX_LENGTH = 254;

// Pragmatic email shape check (proper validation happens implicitly by the
// user being able to type it — we never send verification emails today).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Both validators return a user-facing error message, or null when valid.

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || email.trim().length === 0) {
    return "Please enter your email address.";
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return "This email address is too long.";
  }
  if (!EMAIL_RE.test(email.trim())) {
    return "Please enter a valid email address (like name@example.com).";
  }
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Please enter a password.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return "This password is too long.";
  }
  return null;
}
