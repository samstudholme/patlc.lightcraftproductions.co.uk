import { NextResponse } from "next/server";
import { destroySession, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
