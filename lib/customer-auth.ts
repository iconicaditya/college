/**
 * Demo-only frontend credential gate for the Customer dashboard.
 * Mirrors the Super Admin gate (lib/admin-auth.ts).
 */
export const CUSTOMER_USERNAME = "customer";
export const CUSTOMER_PASSWORD = "Nepal@1234";
export const CUSTOMER_SESSION_KEY = "nmc-customer-session";

export function isValidCustomerCredential(username: string, password: string) {
  return username === CUSTOMER_USERNAME && password === CUSTOMER_PASSWORD;
}