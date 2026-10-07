import { NextResponse } from "next/server";
import { addTester } from "@/lib/db";
import { requireApiSession, sameOrigin } from "@/lib/security";

export async function POST(request:Request){
  if(!(await requireApiSession()))return NextResponse.json({error:"Unauthorised"},{status:401});
  if(!(await sameOrigin()))return NextResponse.json({error:"Invalid origin"},{status:403});
  try{
    const body=await request.json();const name=await addTester(String(body.name??""));
    return NextResponse.json({name},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not add tester"},{status:400})}
}
