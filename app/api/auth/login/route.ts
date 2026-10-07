import { NextResponse } from "next/server";
import { createSession, pinMatches, sameOrigin } from "@/lib/security";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const isForm = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") ?? false;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now(); const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 8) return NextResponse.json({ error: "Try later" }, { status: 429 });
  let pin = "";
  try {
    pin = isForm ? String((await request.formData()).get("pin") ?? "") : String((await request.json()).pin ?? "");
  } catch { /* invalid body */ }
  if (!pinMatches(pin)) {
    attempts.set(ip, entry && entry.reset > now ? { ...entry, count: entry.count + 1 } : { count: 1, reset: now + 5 * 60_000 });
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }
  attempts.delete(ip); await createSession();
  if (isForm) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  return NextResponse.json({ ok: true });
}
