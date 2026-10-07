import { Pool } from "pg";
import { env } from "@/lib/env";
import type { PatRecord, PatResult } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __patPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __patSchemaReady: Promise<void> | undefined;
}

const pool = global.__patPool ?? new Pool({ connectionString: env.databaseUrl(), max: 10 });
if (process.env.NODE_ENV !== "production") global.__patPool = pool;

const initialise = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pat_tests (
      id BIGSERIAL PRIMARY KEY,
      adam_asset_id TEXT NOT NULL,
      asset_number TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      tester TEXT NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
      failure_reason TEXT,
      notes TEXT,
      next_due_date DATE NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pat_tests_asset_idx ON pat_tests (adam_asset_id, test_date DESC);
    CREATE INDEX IF NOT EXISTS pat_tests_date_idx ON pat_tests (test_date DESC);
    CREATE INDEX IF NOT EXISTS pat_tests_due_idx ON pat_tests (next_due_date);
    CREATE TABLE IF NOT EXISTS pat_testers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  for (const name of env.testers()) {
    await pool.query("INSERT INTO pat_testers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
  }
};

const ready = () => (global.__patSchemaReady ??= initialise());

const mapRecord = (row: Record<string, unknown>): PatRecord => ({
  id: Number(row.id),
  adamAssetId: String(row.adam_asset_id),
  assetNumber: String(row.asset_number),
  assetName: String(row.asset_name),
  testDate: new Date(String(row.test_date)).toISOString(),
  tester: String(row.tester),
  result: row.result as PatResult,
  failureReason: row.failure_reason ? String(row.failure_reason) : null,
  notes: row.notes ? String(row.notes) : null,
  nextDueDate: String(row.next_due_date).slice(0, 10),
});

export async function createPatTest(input: Omit<PatRecord, "id" | "testDate">) {
  await ready();
  const result = await pool.query(
    `INSERT INTO pat_tests
      (adam_asset_id, asset_number, asset_name, tester, result, failure_reason, notes, next_due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [input.adamAssetId, input.assetNumber, input.assetName, input.tester, input.result,
      input.failureReason, input.notes, input.nextDueDate],
  );
  return mapRecord(result.rows[0]);
}

export async function getHistory(adamAssetId: string) {
  await ready();
  const result = await pool.query("SELECT * FROM pat_tests WHERE adam_asset_id=$1 ORDER BY test_date DESC", [adamAssetId]);
  return result.rows.map(mapRecord);
}

export async function getAllHistory() {
  await ready();
  const result = await pool.query("SELECT * FROM pat_tests ORDER BY test_date DESC");
  return result.rows.map(mapRecord);
}

export async function getLatestTests() {
  await ready();
  const result = await pool.query(`
    SELECT DISTINCT ON (adam_asset_id) * FROM pat_tests
    ORDER BY adam_asset_id, test_date DESC, id DESC
  `);
  return result.rows.map(mapRecord);
}

export async function getDashboardCounts() {
  await ready();
  const result = await pool.query(`
    WITH latest AS (
      SELECT DISTINCT ON (adam_asset_id) * FROM pat_tests ORDER BY adam_asset_id, test_date DESC, id DESC
    )
    SELECT
      (SELECT COUNT(*) FROM pat_tests WHERE test_date >= CURRENT_DATE) AS tests_today,
      (SELECT COUNT(*) FROM pat_tests WHERE test_date >= CURRENT_DATE AND result='PASS') AS pass_today,
      (SELECT COUNT(*) FROM pat_tests WHERE test_date >= CURRENT_DATE AND result='FAIL') AS fail_today,
      (SELECT COUNT(*) FROM latest WHERE result='PASS' AND next_due_date < CURRENT_DATE) AS overdue,
      (SELECT COUNT(*) FROM latest WHERE result='PASS' AND next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS due_soon
  `);
  const row = result.rows[0];
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])) as {
    tests_today: number; pass_today: number; fail_today: number; overdue: number; due_soon: number;
  };
}

export async function getTesters() {
  await ready();
  const result = await pool.query("SELECT name FROM pat_testers WHERE active=TRUE ORDER BY name");
  return result.rows.map((row) => String(row.name));
}

export async function addTester(name: string) {
  await ready();
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 80) throw new Error("Tester name must be between 2 and 80 characters");
  const result = await pool.query(
    "INSERT INTO pat_testers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET active=TRUE RETURNING name",
    [clean],
  );
  return String(result.rows[0].name);
}

export async function isActiveTester(name: string) {
  await ready();
  const result = await pool.query("SELECT 1 FROM pat_testers WHERE name=$1 AND active=TRUE", [name]);
  return result.rowCount === 1;
}

export async function databaseIsReady() {
  await ready();
  await pool.query("SELECT 1");
  return true;
}
