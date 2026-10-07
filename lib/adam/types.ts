import type { AdamAsset } from "@/lib/types";

export interface AdamProvider {
  lookup(term: string): Promise<AdamAsset | null>;
  getById(id: string): Promise<AdamAsset | null>;
}
