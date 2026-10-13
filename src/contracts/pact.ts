// src/contracts/pact.ts — consumer↔provider contract verification
// Models Pact-style contract testing: consumer expectations vs provider responses.

import type { DataContract, PactInteraction } from "../types.js";

/** Verify a consumer's contract against a provider's actual responses. */
export function verifyContract(
  contract: DataContract,
  providerResponses: Map<string, { status: number; body?: unknown; headers?: Record<string,string> }>,
): { verified: boolean; passed: number; failed: number; failures: { interaction: string; detail: string }[] } {
  const failures: { interaction: string; detail: string }[] = [];
  let passed = 0, failed = 0;

  for (const interaction of contract.interactions) {
    const key = `${interaction.request.method} ${interaction.request.path}`;
    const actual = providerResponses.get(key);

    if (!actual) {
      failed++;
      failures.push({ interaction: interaction.description, detail: `no response for ${key}` });
      continue;
    }

    // Check status code
    if (actual.status !== interaction.response.status) {
      failed++;
      failures.push({ interaction: interaction.description, detail: `status: expected ${interaction.response.status}, got ${actual.status}` });
      continue;
    }

    // Check body (shallow match — all keys in expected must be present in actual)
    if (interaction.response.body && typeof interaction.response.body === "object") {
      const expectedKeys = Object.keys(interaction.response.body as object);
      const actualBody = actual.body as Record<string, unknown> | undefined;
      if (!actualBody) {
        failed++;
        failures.push({ interaction: interaction.description, detail: "expected body but got none" });
        continue;
      }
      const missingKey = expectedKeys.find(k => !(k in actualBody));
      if (missingKey) {
        failed++;
        failures.push({ interaction: interaction.description, detail: `missing body key: ${missingKey}` });
        continue;
      }
    }

    passed++;
  }

  return { verified: failed === 0, passed, failed, failures };
}

/** Build a contract from consumer expectations. */
export function buildContract(consumer: string, provider: string, interactions: PactInteraction[], version: string): DataContract {
  return { consumer, provider, interactions, verified: false, version };
}
