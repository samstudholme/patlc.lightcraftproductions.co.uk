import type { AdamProvider } from "@/lib/adam/types";
import { env } from "@/lib/env";
import { LiveAdamProvider } from "@/lib/adam/live";
import { MockAdamProvider } from "@/lib/adam/mock";

let provider: AdamProvider | undefined;

export function adam(): AdamProvider {
  if (!provider) {
    provider = env.adamProvider() === "mock" ? new MockAdamProvider() : new LiveAdamProvider();
  }
  return provider;
}
