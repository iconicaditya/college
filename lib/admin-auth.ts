/**
 * Demo-only frontend credential gate. Replace with the project's real
 * authentication provider and server-side session checks before production.
 */
export const ADMIN_USERNAME = "superadmin";
export const ADMIN_PASSWORD = "Nepal@1234";
export const ADMIN_SESSION_KEY = "nmc-super-admin-session";

export function isValidAdminCredential(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
