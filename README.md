# Test Environment as a Service

<div align="center">

**One-click ephemeral test environments per PR — realistic data, mocked third parties, contract-verified stubs, time travel, and chaos.**

![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## Overview

A Kubernetes-operator-based platform that spins up a **full isolated test environment per pull request** — complete with synthetic data (referential-integrity-safe), mocked third-party APIs (WireMock/Mountebank), Pact contract verification, time-travel, and chaos injection — then tears it down on merge.

```
PR opened ──▶ K8s operator spins up full env
                 │
       ┌─────────┼──────────────────────────┐
       ▼         ▼                          ▼
  8 services   3 mocks (WireMock/     Synthetic data
  (API gateway, Mountebank):           (500 users → 1200 orders
   auth, orders,   stripe, twilio,      → 800 payments, FK-safe)
   payments...)    sendgrid
       │                                 │
       ▼                                 ▼
  Pact contracts                   Chaos injection
  (consumer↔provider                (latency, timeout,
   verification)                     time-travel, CPU)
       │
       ▼
  Env ready → run tests → PR merges → env terminated
```

## Architecture

```
src/
├── types.ts                        # TestEnv, MockService, DataContract, ChaosConfig, SyntheticData
├── config.ts                       # Platform config + env template (8 services, 3 mocks)
├── orchestrator/
│   └── lifecycle.ts                # K8s operator model: spin-up → ready → teardown per PR
├── virtualization/
│   └── wiremock.ts                 # WireMock stub generation (stripe/sendgrid presets)
├── data/
│   └── synthetic-generator.ts      # Referential-integrity-safe data gen (users→orders→payments) + verifier
├── contracts/
│   └── pact.ts                     # Consumer↔provider contract verification (status + body match)
├── chaos/
│   └── chaos-injector.ts           # 5 chaos types: latency, timeout, reset, time-travel, CPU stress
└── server.ts                       # Express API: /api/envs, /api/data/generate, /api/contracts/verify, /api/chaos
```

## Core Modules

### Orchestrator (`orchestrator/lifecycle.ts`)
- Models a **K8s operator** that manages environment lifecycle: spin-up (async, ~2-5s simulated), ready, degraded, tearing-down, terminated.
- Each env gets a unique namespace with 8 services + 3 mocks + a synthetic data version.
- Auto-teardown on merge or TTL expiry.

### Synthetic Data Generator (`data/synthetic-generator.ts`)
- Generates **users → orders → payments** with proper foreign keys (orders.userId → users.id, payments.orderId → orders.id, payments.userId → users.id).
- `verifyIntegrity()` walks every FK relationship + reports orphan rows — catches data corruption.
- Generates a SHA-256 checksum so you can detect data drift across envs.

### Contract Testing (`contracts/pact.ts`)
- `buildContract()` creates a Pact-style contract from consumer interactions.
- `verifyContract()` checks provider responses against the contract: status code match + body key presence.
- Reports per-interaction pass/fail with specific failure details.

### Service Virtualization (`virtualization/wiremock.ts`)
- Generates WireMock stubs for common third-party APIs (Stripe charges/refunds, SendGrid mail/templates).
- Each stub has method, URL pattern, status, body, optional latency.

### Chaos Injection (`chaos/chaos-injector.ts`)
- 5 chaos types: latency (+Nms), timeout (after Nms), connection-reset (N% rate), time-travel (clock shift ±Ns), CPU-stress (N%).
- `isChaosActive()` checks if the experiment is still within its duration window.
- `defaultChaosExperiments()` generates a preset list for a target service.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + version + uptime |
| `GET` | `/api/status` | All envs + mocks + spin-up stats |
| `POST` | `/api/envs` | Spin up a new env for a PR |
| `GET` | `/api/envs/:id` | Get env state (poll for readiness) |
| `DELETE` | `/api/envs/:id` | Tear down an env |
| `POST` | `/api/data/generate` | Generate synthetic data (users/orders/payments) |
| `POST` | `/api/contracts/verify` | Verify a Pact contract against provider responses |
| `POST` | `/api/chaos` | Apply a chaos experiment to a service |
| `GET` | `/api/chaos/presets` | List preset chaos experiments |

## Tests

```bash
npm test    # 11 unit tests
```

- `tests/data.test.ts` — 7 tests: row counts, unique IDs, FK validity, integrity verification, checksum format
- `tests/contracts.test.ts` — 4 tests: full match, status mismatch, missing body key, missing response

## Docker

```bash
docker compose -f docker/docker-compose.yml up -d   # WireMock + Mountebank + Postgres + Pact Broker
```

## Run

```bash
npm install
npm test          # 11 tests
npm run dev       # → http://localhost:4307
```

## Stack
Kubernetes · Envoy · WireMock · Mountebank · Testcontainers · Temporal · Pact · Postgres

## License
MIT
