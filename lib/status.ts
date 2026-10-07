import type { AssetStatus, PatRecord } from "@/lib/types";

export function getStatus(record: PatRecord, today = new Date()): AssetStatus {
  if (record.result === "FAIL") return "Failed";
  const due = new Date(`${record.nextDueDate}T23:59:59`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (due < start) return "Overdue";
  const soon = new Date(start);
  soon.setDate(soon.getDate() + 30);
  return due <= soon ? "Due Soon" : "In Test";
}
