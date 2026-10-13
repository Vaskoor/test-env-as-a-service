// src/server.ts — Test Environment as a Service — full API + dashboard
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { PLATFORM_CONFIG } from "./config.js";
import { spinUpEnv, getEnv, listEnvs, tearDownEnv, stats } from "./orchestrator/lifecycle.js";
import { generate, verifyIntegrity } from "./data/synthetic-generator.js";
import { verifyContract, buildContract } from "./contracts/pact.js";
import type { PactInteraction } from "./types.js";
import { applyChaos, defaultChaosExperiments } from "./chaos/chaos-injector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
const startedAt = Date.now();

app.get("/health", (_q,r) => r.json({ ok: true, version: PLATFORM_CONFIG.version, uptime: Math.round((Date.now()-startedAt)/1000) }));

app.get("/api/status", (_q,r) => {
  const envs = listEnvs();
  const s = stats();
  r.json({
    ok: true,
    activeEnvs: s.active,
    spinningUp: s.spinning,
    totalEnvs: s.total,
    avgSpinUp: envs.filter(e=>e.status==="ready").reduce((sum,e,i,arr)=>sum+e.spinUpMs/arr.length,0),
    envs: envs.map(e => ({
      pr: e.pr, branch: e.branch, status: e.status, spinUpMs: e.spinUpMs,
      services: e.services.length, mocks: e.mocks.length, chaos: e.chaosConfig?.type || "none",
    })),
    mocks: envs.flatMap(e => e.mocks).map(m => ({
      name: m.name, tool: m.tool, stubs: m.stubs.length, calls: m.calls,
    })),
  });
});

app.post("/api/envs", (req,r) => {
  const { pr, branch } = req.body || {};
  if (!pr) return r.status(400).json({ error: "pr required" });
  const env = spinUpEnv(pr || "PR-000", branch || "main");
  r.status(202).json({ id: env.id, pr: env.pr, status: env.status, poll: `/api/envs/${env.id}` });
});

app.get("/api/envs/:id", (req,r) => {
  const env = getEnv(req.params.id);
  if (!env) return r.status(404).json({ error: "env not found" });
  r.json(env);
});

app.delete("/api/envs/:id", (req,r) => {
  const ok = tearDownEnv(req.params.id);
  r.json({ ok, id: req.params.id });
});

app.post("/api/data/generate", (req,r) => {
  const { users=100, orders=300, payments=200 } = req.body || {};
  const data = generate({ users, orders, payments });
  const integrity = verifyIntegrity(data);
  r.json({ checksum: data.checksum, tables: data.tables.length, rows: data.tables.reduce((s,t)=>s+t.rows.length,0), integrity, data });
});

app.post("/api/contracts/verify", (req,r) => {
  const { consumer, provider, interactions, responses } = req.body || {};
  if (!interactions || !responses) return r.status(400).json({ error: "interactions + responses required" });
  const contract = buildContract(consumer||"unknown", provider||"unknown", interactions as PactInteraction[], "1.0");
  const result = verifyContract(contract, new Map(Object.entries(responses)));
  r.json({ contract, result });
});

app.post("/api/chaos", (req,r) => {
  const { type, target, value, durationSec } = req.body || {};
  if (!type || !target) return r.status(400).json({ error: "type + target required" });
  const result = applyChaos({ type, target, value: value||500, durationSec: durationSec||60 });
  r.json(result);
});

app.get("/api/chaos/presets", (_q,r) => r.json({ experiments: defaultChaosExperiments("payments-svc") }));

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_q,r) => r.sendFile(path.join(__dirname, "../public/index.html")));

app.listen(Number(process.env.PORT ?? PLATFORM_CONFIG.defaultPort), () =>
  console.log(`test-env-as-a-service → http://localhost:${PLATFORM_CONFIG.defaultPort}`));
