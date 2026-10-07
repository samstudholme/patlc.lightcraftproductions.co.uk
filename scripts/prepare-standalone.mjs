import { cpSync, mkdirSync } from "node:fs";

// Next's standalone output excludes browser assets by design. Copy them in so
// `npm start` behaves exactly like the final Docker image.
mkdirSync(".next/standalone/.next", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
cpSync("public", ".next/standalone/public", { recursive: true });
