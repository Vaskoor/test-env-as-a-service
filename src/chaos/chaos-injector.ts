// src/chaos/chaos-injector.ts — chaos injection for test environments
// Applies latency, timeout, connection-reset, time-travel, and CPU-stress faults.

import type { ChaosConfig } from "../types.js";

export interface ChaosResult {
  applied: boolean;
  detail: string;
  injectedAt: number;
  expiresAt: number;
}

/** Apply a chaos experiment to a target service (simulated). */
export function applyChaos(config: ChaosConfig): ChaosResult {
  const injectedAt = Date.now();
  const expiresAt = injectedAt + config.durationSec * 1000;

  switch (config.type) {
    case "latency":
      return { applied: true, detail: `+${config.value}ms latency on ${config.target} for ${config.durationSec}s`, injectedAt, expiresAt };
    case "timeout":
      return { applied: true, detail: `${config.target} requests will timeout after ${config.value}ms`, injectedAt, expiresAt };
    case "connection-reset":
      return { applied: true, detail: `${config.target} connections reset randomly (${config.value}% rate)`, injectedAt, expiresAt };
    case "time-travel":
      return { applied: true, detail: `${config.target} clock shifted ${config.value > 0 ? "+" : ""}${config.value}s (time travel)`, injectedAt, expiresAt };
    case "cpu-stress":
      return { applied: true, detail: `${config.target} CPU stressed at ${config.value}% for ${config.durationSec}s`, injectedAt, expiresAt };
    default:
      return { applied: false, detail: `unknown chaos type: ${config.type}`, injectedAt, expiresAt };
  }
}

/** Check if a chaos experiment is still active. */
export function isChaosActive(result: ChaosResult): boolean {
  return result.applied && Date.now() < result.expiresAt;
}

/** Generate a list of common chaos experiments. */
export function defaultChaosExperiments(target: string): ChaosConfig[] {
  return [
    { type: "latency", target, value: 500, durationSec: 60 },
    { type: "timeout", target, value: 2000, durationSec: 30 },
    { type: "connection-reset", target, value: 10, durationSec: 45 },
    { type: "time-travel", target, value: 86400, durationSec: 120 },
    { type: "cpu-stress", target, value: 85, durationSec: 30 },
  ];
}
