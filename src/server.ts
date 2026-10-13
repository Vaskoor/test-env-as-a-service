import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
const startedAt = Date.now();
let tick = 0;
const envs = [
  { pr: "PR #482", branch: "feat/refund", status: "ready", spinUpMs: 42000, services: 8, mocks: 3, data: "synthetic 2k rows", chaos: "none" },
  { pr: "PR #483", branch: "fix/auth-leak", status: "ready", spinUpMs: 38000, services: 8, mocks: 3, data: "synthetic 2k rows", chaos: "latency 200ms" },
  { pr: "PR #484", branch: "feat/search-v2", status: "spinning-up", spinUpMs: 0, services: 5, mocks: 2, data: "—", chaos: "—" },
  { pr: "PR #485", branch: "chore/deps", status: "ready", spinUpMs: 31000, services: 8, mocks: 3, data: "synthetic 2k rows", chaos: "none" },
];
const contracts = [
  { consumer: "web-frontend", provider: "payment-svc", verified: true, version: "1.4.0" },
  { consumer: "mobile-app", provider: "auth-svc", verified: true, version: "2.1.0" },
  { consumer: "web-frontend", provider: "search-svc", verified: false, version: "0.9.0" },
];
const mocks = [
  { name: "stripe-api", tool: "WireMock", stubs: 42, calls: 1820 },
  { name: "twilio-sms", tool: "Mountebank", stubs: 18, calls: 340 },
  { name: "sendgrid", tool: "WireMock", stubs: 24, calls: 920 },
];
function sim() {
  tick++;
  return {
    envs, contracts, mocks,
    activeEnvs: envs.filter(e => e.status === "ready").length,
    avgSpinUp: 37,
    totalServices: 8, totalMocks: 3,
    syntheticRows: 2000,
  };
}
app.get("/api/status", (_q, r) => r.json({ ok: true, uptime: Math.round((Date.now() - startedAt) / 1000), ...sim() }));
app.get("/health", (_q, r) => r.json({ ok: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_q, r) => r.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(Number(process.env.PORT ?? 4307), () => console.log("test-env-as-a-service → http://localhost:4307"));
