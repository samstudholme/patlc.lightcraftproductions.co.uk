import type { AdamProvider } from "@/lib/adam/types";
import type { AdamAsset } from "@/lib/types";

const assets: AdamAsset[] = [
  { id: "lc-1001", assetNumber: "LC1001", barcode: "5010000001001", name: "Dell Latitude 5440", manufacturer: "Dell", model: "Latitude 5440", serial: "DL5440-001", location: "Main Building / IT", category: "Laptop" },
  { id: "lc-1002", assetNumber: "LC1002", barcode: "5010000001002", name: "Samsung 43-inch Display", manufacturer: "Samsung", model: "BE43T-H", serial: "SM43-002", location: "Room A12", category: "Display" },
  { id: "lc-1003", assetNumber: "LC1003", barcode: "5010000001003", name: "Bosch Cordless Drill Charger", manufacturer: "Bosch", model: "GAL 18V-40", serial: "BSH-003", location: "Workshop", category: "Power Tool" },
];

export class MockAdamProvider implements AdamProvider {
  async lookup(term: string) {
    const value = term.trim().toLowerCase();
    return assets.find((asset) => asset.assetNumber.toLowerCase() === value || asset.barcode?.toLowerCase() === value) ?? null;
  }
  async getById(id: string) {
    return assets.find((asset) => asset.id === id) ?? null;
  }
}
