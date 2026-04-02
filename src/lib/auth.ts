import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Credentials = {
  username: string;
  password: string;
};

type LoginResult = {
  ok: boolean;
  reason?: "missing-config" | "invalid-credentials";
};

export const AUTH_COOKIE_NAME = "kmlt_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const SESSION_VALUE = "authenticated";
const TEMP_SESSION_VALUE = "temporary-authenticated";

function getConfigValue(name: string): string {
  return String(process.env[name] ?? "").trim();
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getStoredCredentials(): Credentials | null {
  const username = getConfigValue("DASHBOARD_USERNAME") || getConfigValue("LEAGUE_DASHBOARD_USERNAME");
  const password = getConfigValue("DASHBOARD_PASSWORD") || getConfigValue("LEAGUE_DASHBOARD_PASSWORD");

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function hasStoredCredentials(): boolean {
  return getStoredCredentials() !== null;
}

function getSessionSecret(credentials: Credentials): string {
  const explicitSecret = getConfigValue("DASHBOARD_AUTH_SECRET");
  if (explicitSecret) {
    return explicitSecret;
  }

  return `${credentials.username}:${credentials.password}`;
}

function createSessionToken(credentials: Credentials): string {
  const signature = createHmac("sha256", getSessionSecret(credentials)).update(SESSION_VALUE).digest("base64url");
  return `${SESSION_VALUE}.${signature}`;
}

function isSessionTokenValid(token: string): boolean {
  const credentials = getStoredCredentials();
  if (!credentials) {
    return safeCompare(token, TEMP_SESSION_VALUE);
  }

  const expected = createSessionToken(credentials);
  return safeCompare(token, expected);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return isSessionTokenValid(token);
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

export async function loginWithCredentials(username: string, password: string): Promise<LoginResult> {
  const credentials = getStoredCredentials();
  if (!credentials) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, TEMP_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return { ok: true };
  }

  if (!safeCompare(username, credentials.username) || !safeCompare(password, credentials.password)) {
    return { ok: false, reason: "invalid-credentials" };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(credentials), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true };
}

export async function logoutSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
