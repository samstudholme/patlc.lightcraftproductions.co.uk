import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

const COOKIE = "pat_session_v2";

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret()).update(payload).digest("base64url");
}

export function pinMatches(candidate: string) {
  const expected = Buffer.from(env.pin());
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual) && /^\d{4}$/.test(candidate);
}

export async function createSession() {
  const expires = Date.now() + 12 * 60 * 60 * 1000;
  const payload = String(expires);
  const configuredOrigin = process.env.APP_ORIGIN;
  const secure = configuredOrigin ? configuredOrigin.startsWith("https://") : process.env.NODE_ENV === "production";
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "strict", secure, path: "/", expires,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthenticated() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function requirePageSession() {
  if (!(await isAuthenticated())) redirect("/login");
}

export async function requireApiSession() {
  return isAuthenticated();
}

export async function sameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true;
  const expected = process.env.APP_ORIGIN;
  return expected ? origin === expected : new URL(origin).host === h.get("host");
}
