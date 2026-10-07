export type PatResult = "PASS" | "FAIL";

export type AdamAsset = {
  id: string;
  assetNumber: string;
  barcode: string | null;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial: string | null;
  location: string | null;
  category: string | null;
};

export type PatRecord = {
  id: number;
  adamAssetId: string;
  assetNumber: string;
  assetName: string;
  testDate: string;
  tester: string;
  result: PatResult;
  failureReason: string | null;
  notes: string | null;
  nextDueDate: string;
};

export type AssetStatus = "In Test" | "Due Soon" | "Overdue" | "Failed";

export type RegisterRow = PatRecord & {
  serial: string | null;
  location: string | null;
  status: AssetStatus;
};
