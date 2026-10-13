// src/orchestrator/lifecycle.ts — env lifecycle management (K8s operator model)
// Spins up environments per PR, tracks status, tears down on merge/expiry.

import type { TestEnv, EnvStatus, ServiceInstance } from "../types.js";
import { PLATFORM_CONFIG } from "../config.js";
import { generate } from "../data/synthetic-generator.js";
import { createMock } from "../virtualization/wiremock.js";

const envs = new Map<string, TestEnv>();

/** Spin up a new environment for a PR. Returns the env (status: spinning-up). */
export function spinUpEnv(pr: string, branch: string): TestEnv {
  const id = `env-${pr.replace(/[^a-z0-9]/gi,"").toLowerCase()}-${Date.now().toString(36).slice(-4)}`;
  const t0 = Date.now();
  const tmpl = PLATFORM_CONFIG.envTemplate;

  const services: ServiceInstance[] = tmpl.services.map((s) => ({
    name: s.name, image: s.image, port: s.port, ready: false, replica: `${s.name}-${id}-0`,
  }));

  const mocks = tmpl.mocks.map((m) => createMock(m.name));

  const data = generate({ users: 500, orders: 1200, payments: 800 });

  const env: TestEnv = {
    id, pr, branch, status: "spinning-up", spinUpMs: 0,
    services, mocks, dataVersion: data.checksum,
    chaosConfig: null, url: `https://${id}.${PLATFORM_CONFIG.k8sNamespace}.k8s.local`,
  };
  envs.set(id, env);

  // Simulate async spin-up (K8s would do this via deployments)
  setTimeout(() => {
    const e = envs.get(id);
    if (!e) return;
    e.services.forEach(s => s.ready = true);
    e.status = "ready";
    e.spinUpMs = Date.now() - t0;
    e.readyAt = Date.now();
  }, 2000 + Math.floor(Math.random() * 3000));

  return env;
}

/** Get env status. */
export function getEnv(id: string): TestEnv | undefined {
  const env = envs.get(id);
  if (!env) return undefined;
  return { ...env, spinUpMs: env.status === "ready" ? env.spinUpMs : Date.now() - env.startedAt || 0 };
}

/** List all active environments. */
export function listEnvs(): TestEnv[] {
  return [...envs.values()].filter(e => e.status !== "terminated");
}

/** Tear down an environment. */
export function tearDownEnv(id: string): boolean {
  const env = envs.get(id);
  if (!env) return false;
  env.status = "tearing-down";
  env.terminatedAt = Date.now();
  setTimeout(() => { env.status = "terminated"; }, 1000);
  return true;
}

/** Get aggregate stats. */
export function stats() {
  const all = [...envs.values()];
  return {
    total: all.length,
    active: all.filter(e => e.status === "ready").length,
    spinning: all.filter(e => e.status === "spinning-up").length,
    terminated: all.filter(e => e.status === "terminated").length,
  };
}
