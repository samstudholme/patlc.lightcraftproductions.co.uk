import { NextRequest, NextResponse } from "next/server";
import { adam } from "@/lib/adam";
import { requireApiSession } from "@/lib/security";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!(await requireApiSession())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length > 120) return NextResponse.json({ error: "Enter a valid asset number or barcode" }, { status: 400 });
  try {
    const asset = await adam().lookup(query);
    return asset ? NextResponse.json({ asset }) : NextResponse.json({ error: "Asset not found for Lincoln College" }, { status: 404 });
  } catch (error) {
    console.error("Adam lookup error", error);
    return NextResponse.json({ error: "Adam RMS is unavailable. No PAT record has been saved." }, { status: 502 });
  }
}
