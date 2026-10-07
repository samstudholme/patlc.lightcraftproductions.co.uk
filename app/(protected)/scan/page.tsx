import { getTesters } from "@/lib/db";
import ScanWorkflow from "./scan-workflow";

export const dynamic = "force-dynamic";
export default async function ScanPage() {
  return <ScanWorkflow initialTesters={await getTesters()} />;
}
