import { NextResponse } from "next/server";
import { adam } from "@/lib/adam";
import { createPatTest, isActiveTester } from "@/lib/db";
import { requireApiSession, sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!(await requireApiSession())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!(await sameOrigin())) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const adamAssetId = String(body.adamAssetId ?? "");
  const tester = String(body.tester ?? "");
  const result = body.result === "PASS" || body.result === "FAIL" ? body.result : null;
  const failureReason = String(body.failureReason ?? "").trim() || null;
  const notes = String(body.notes ?? "").trim() || null;
  const nextDueDate = String(body.nextDueDate ?? "");
  if (!adamAssetId || !(await isActiveTester(tester)) || !result || !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate))
    return NextResponse.json({ error: "Invalid PAT details" }, { status: 400 });
  if (result === "FAIL" && !failureReason) return NextResponse.json({ error: "A failure reason is required" }, { status: 400 });
  try {
    // Re-read by ID before writing; the client cannot submit an asset outside the company boundary.
    const asset = await adam().getById(adamAssetId);
    if (!asset) return NextResponse.json({ error: "Asset is not available to this company" }, { status: 403 });
    const record = await createPatTest({ adamAssetId: asset.id, assetNumber: asset.assetNumber, assetName: asset.name, tester, result, failureReason, notes, nextDueDate });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("PAT save error", error);
    return NextResponse.json({ error: "Could not verify the asset or save the PAT record" }, { status: 502 });
  }
}
