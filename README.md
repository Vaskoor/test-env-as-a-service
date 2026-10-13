# Test Environment as a Service — Service Virtualization & Data Contracts

<div align="center">**One-click ephemeral test environments per PR — realistic data, mocked third parties, contract-verified stubs, time travel, and chaos.**</div>

## What it does
- **Kubernetes operator** spins up a full, isolated environment per pull request, tears it down on merge.
- **Service virtualization** — third-party APIs (Stripe, Twilio, SendGrid) stubbed with WireMock / Mountebank.
- **Synthetic data generation** — referential-integrity-safe rows (no PII).
- **Contract testing** — Pact consumer↔provider verification, broken contracts flagged.
- **Time travel + chaos** — freeze the clock, inject latency / faults mid-test.
- **Self-service API + dashboard** — one click per PR.

## Architecture
| Layer | Tech |
|-------|------|
| Orchestration | Kubernetes operator + Temporal workflows |
| Mesh | Envoy (per-env isolation) |
| Virtualization | WireMock, Mountebank |
| Data | Testcontainers + synthetic generator |
| Contracts | Pact |
| Chaos | Chaos Mesh |

## Run
```bash
npm install && npm run dev   # → http://localhost:4307
```
## Why it's OG
Platform engineering for QA — principal-level scope.
## License
MIT
