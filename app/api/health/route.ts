import { NextResponse } from "next/server";
import { databaseIsReady } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await databaseIsReady();
    return NextResponse.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ status: "unhealthy" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
