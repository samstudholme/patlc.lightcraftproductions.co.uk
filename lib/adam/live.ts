import type { AdamProvider } from "@/lib/adam/types";
import type { AdamAsset } from "@/lib/types";
import { env } from "@/lib/env";

type Json = Record<string, unknown>;

const text = (value: unknown) => value == null ? null : String(value);

/**
 * Live Adam adapter. This is intentionally the only module aware of Adam's wire format.
 * Every request includes companyId and every response is independently checked. If Adam
 * does not return a company identifier, this adapter fails closed.
 */
export class LiveAdamProvider implements AdamProvider {
  private async request(path: string, params: Record<string, string>) {
    const companyId = env.companyId();
    const url = new URL(path, `${env.adamBaseUrl().replace(/\/$/, "")}/`);
    url.searchParams.set("companyId", companyId);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.adamApiKey()}`, Accept: "application/json", "X-Company-ID": companyId },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Adam RMS lookup failed (${response.status})`);
    return response.json() as Promise<unknown>;
  }

  private parse(candidate: unknown): AdamAsset | null {
    if (!candidate || typeof candidate !== "object") return null;
    const row = candidate as Json;
    const returnedCompany = text(row.companyId ?? row.company_id ?? (row.company as Json | undefined)?.id);
    if (returnedCompany !== env.companyId()) return null; // Security boundary: fail closed.
    const id = text(row.id ?? row.assetId);
    const assetNumber = text(row.assetNumber ?? row.asset_number ?? row.tag);
    const name = text(row.name ?? row.description);
    if (!id || !assetNumber || !name) return null;
    return {
      id, assetNumber, name,
      barcode: text(row.barcode),
      manufacturer: text(row.manufacturer ?? (row.make as Json | undefined)?.name),
      model: text(row.model),
      serial: text(row.serial ?? row.serialNumber),
      location: text(typeof row.location === "object" ? (row.location as Json)?.name : row.location),
      category: text(typeof row.category === "object" ? (row.category as Json)?.name : row.category),
    };
  }

  async lookup(term: string) {
    const json = await this.request("assets", { search: term, limit: "10" });
    if (!json) return null;
    const root = json as Json;
    const rows = Array.isArray(json) ? json : (root.data ?? root.assets ?? root.results);
    if (!Array.isArray(rows)) return null;
    const exact = rows.map((row) => this.parse(row)).filter((row): row is AdamAsset => Boolean(row))
      .find((row) => row.assetNumber.toLowerCase() === term.toLowerCase() || row.barcode?.toLowerCase() === term.toLowerCase());
    return exact ?? null;
  }

  async getById(id: string) {
    // The company boundary is included even for primary-key reads and verified again on response.
    return this.parse(await this.request(`assets/${encodeURIComponent(id)}`, {}));
  }
}
