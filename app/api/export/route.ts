import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getAllHistory } from "@/lib/db";
import { enrich, getRegisterRows } from "@/lib/register";
import { requireApiSession } from "@/lib/security";
import type { RegisterRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request:NextRequest){
  if(!(await requireApiSession()))return NextResponse.json({error:"Unauthorised"},{status:401});
  const p=request.nextUrl.searchParams;const scope=p.get("scope")==="history"?"history":"current";
  let rows=scope==="history"?await enrich(await getAllHistory()):await getRegisterRows();
  const search=(p.get("search")||"").toLowerCase(),result=p.get("result")||"",tester=p.get("tester")||"",location=(p.get("location")||"").toLowerCase(),due=p.get("due")||"";
  rows=rows.filter(r=>(!search||`${r.assetNumber} ${r.assetName}`.toLowerCase().includes(search))&&(!result||r.result===result)&&(!tester||r.tester===tester)&&(!location||(r.location||"").toLowerCase().includes(location))&&(!due||r.nextDueDate<=due));
  const allowed:(keyof RegisterRow)[]=["assetNumber","assetName","serial","location","testDate","result","tester","nextDueDate","status","notes"];
  const sort=allowed.includes(p.get("sort") as keyof RegisterRow)?p.get("sort") as keyof RegisterRow:"assetNumber";const direction=p.get("dir")==="desc"?-1:1;
  rows.sort((a,b)=>String(a[sort]??"").localeCompare(String(b[sort]??""))*direction);
  const book=new ExcelJS.Workbook();book.creator="Lincoln College PAT Test & Trace";book.created=new Date();const sheet=book.addWorksheet(scope==="history"?"PAT History":"PAT Register",{views:[{state:"frozen",ySplit:1}]});
  sheet.columns=[{header:"Asset Number",key:"assetNumber",width:18},{header:"Asset Name",key:"assetName",width:32},{header:"Serial",key:"serial",width:20},{header:"Location",key:"location",width:25},{header:"Last Test",key:"testDate",width:14},{header:"Result",key:"result",width:10},{header:"Tester",key:"tester",width:20},{header:"Next Due",key:"nextDueDate",width:14},{header:"Notes",key:"notes",width:35}];
  for(const row of rows)sheet.addRow({assetNumber:row.assetNumber,assetName:row.assetName,serial:row.serial||"",location:row.location||"",testDate:new Date(row.testDate),result:row.result,tester:row.tester,nextDueDate:new Date(`${row.nextDueDate}T12:00:00`),notes:row.notes||""});
  sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF12233F"}};sheet.autoFilter={from:"A1",to:"I1"};sheet.getColumn("testDate").numFmt="dd/mm/yyyy";sheet.getColumn("nextDueDate").numFmt="dd/mm/yyyy";
  const output=await book.xlsx.writeBuffer();const filename=scope==="history"?"pat-history.xlsx":"pat-register.xlsx";
  return new NextResponse(new Uint8Array(output),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":`attachment; filename="${filename}"`,"cache-control":"no-store"}});
}
