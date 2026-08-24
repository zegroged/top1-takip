import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = new TextEncoder().encode(env.SESSION_SECRET);

const ADMIN_COOKIE = "fayans_admin";
const CUSTOMER_COOKIE = "fayans_customer";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 gün (saniye)

export type AdminPayload = { adminId: string; username: string };
export type CustomerPayload = { customerId: string; customerNo: string };

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

async function verify<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

// ---------- Admin ----------
export async function setAdminSession(payload: AdminPayload): Promise<void> {
  const token = await sign(payload);
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions());
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verify<AdminPayload>(token);
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<AdminPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/giris");
  return session;
}

// ---------- Customer ----------
export async function setCustomerSession(payload: CustomerPayload): Promise<void> {
  const token = await sign(payload);
  (await cookies()).set(CUSTOMER_COOKIE, token, cookieOptions());
}

export async function getCustomerSession(): Promise<CustomerPayload | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return verify<CustomerPayload>(token);
}

export async function clearCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export async function requireCustomer(): Promise<CustomerPayload> {
  const session = await getCustomerSession();
  if (!session) redirect("/giris");
  return session;
}
