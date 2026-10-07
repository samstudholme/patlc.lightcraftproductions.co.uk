import { getRegisterRows } from "@/lib/register";
import RegisterTable from "./register-table";
export const dynamic="force-dynamic";
export default async function RegisterPage(){const rows=await getRegisterRows();return <><div className="asset-title"><div><h1>PAT Register</h1><p className="muted">Latest PAT result for each recorded asset. Adam fields are read live.</p></div><div className="actions"><a className="button secondary" href="/api/export?scope=current">Export current</a><a className="button secondary" href="/api/export?scope=history">Export history</a></div></div><RegisterTable rows={rows}/></>}
