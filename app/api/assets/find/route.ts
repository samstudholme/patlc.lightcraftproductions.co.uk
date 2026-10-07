import { NextRequest, NextResponse } from "next/server";
import { adam } from "@/lib/adam";
import { getHistory } from "@/lib/db";
import { getStatus } from "@/lib/status";
import { requireApiSession } from "@/lib/security";

export const dynamic = "force-dynamic";
export async function GET(request:NextRequest) {
  if (!(await requireApiSession())) return NextResponse.json({error:"Unauthorised"},{status:401});
  const q=request.nextUrl.searchParams.get("q")?.trim();
  if(!q||q.length>120)return NextResponse.json({error:"Enter an asset number or barcode"},{status:400});
  try {
    const asset=await adam().lookup(q); if(!asset)return NextResponse.json({error:"Asset not found for Lincoln College"},{status:404});
    const history=await getHistory(asset.id); const latest=history[0]??null;
    return NextResponse.json({asset,history,status:latest?getStatus(latest):"Never tested"});
  } catch(error){console.error("Find asset error",error);return NextResponse.json({error:"Adam RMS is unavailable"},{status:502})}
}
