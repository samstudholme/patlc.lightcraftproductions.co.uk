import Link from "next/link";
import { getDashboardCounts } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const counts = await getDashboardCounts();
  const cards = [["Tests today",counts.tests_today],["Pass today",counts.pass_today],["Fail today",counts.fail_today],["Overdue",counts.overdue],["Due soon",counts.due_soon]];
  return <><div className="asset-title"><div><h1>Dashboard</h1><p className="muted">Current PAT position</p></div><Link className="button" href="/scan">Start scanning</Link></div>
    <section className="grid">{cards.map(([label,value])=><article className="card metric" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section></>;
}
