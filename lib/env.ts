const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  pin: () => required("PAT_PIN"),
  sessionSecret: () => required("SESSION_SECRET"),
  companyId: () => required("ADAM_COMPANY_ID"),
  adamBaseUrl: () => required("ADAM_BASE_URL"),
  adamApiKey: () => required("ADAM_API_KEY"),
  adamProvider: () => process.env.ADAM_PROVIDER?.toLowerCase() || "mock",
  testers: () => (process.env.PAT_TESTERS || "PAT Tester").split(",").map((v) => v.trim()).filter(Boolean),
};
