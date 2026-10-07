import { adam } from "@/lib/adam";
import { getLatestTests } from "@/lib/db";
import { getStatus } from "@/lib/status";
import type { PatRecord, RegisterRow } from "@/lib/types";

export async function enrich(records: PatRecord[]): Promise<RegisterRow[]> {
  const unique = [...new Set(records.map((row) => row.adamAssetId))];
  const pairs = await Promise.all(unique.map(async (id) => {
    try { return [id, await adam().getById(id)] as const; }
    catch (error) { console.error(`Could not refresh Adam asset ${id}`, error); return [id, null] as const; }
  }));
  const assets = new Map(pairs);
  return records.map((record) => {
    const asset = assets.get(record.adamAssetId);
    return { ...record, serial: asset?.serial ?? null, location: asset?.location ?? null, status: getStatus(record) };
  });
}

export async function getRegisterRows() {
  return enrich(await getLatestTests());
}
