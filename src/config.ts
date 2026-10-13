// src/config.ts — platform configuration
export const PLATFORM_CONFIG = {
  version: "1.0.0",
  defaultPort: 4307,
  k8sNamespace: process.env.K8S_NAMESPACE || "qa-envs",
  maxEnvs: Number(process.env.MAX_ENVS || "20"),
  defaultTtlSec: Number(process.env.ENV_TTL || "3600"),
  wiremockUrl: process.env.WIREMOCK_URL || "http://localhost:8080",
  mountebankUrl: process.env.MOUNTEBANK_URL || "http://localhost:2525",
  envTemplate: {
    services: [
      { name: "api-gateway", image: "ghcr.io/app/gateway:latest", port: 3000 },
      { name: "auth-svc", image: "ghcr.io/app/auth:latest", port: 3001 },
      { name: "orders-svc", image: "ghcr.io/app/orders:latest", port: 3002 },
      { name: "payments-svc", image: "ghcr.io/app/payments:latest", port: 3003 },
      { name: "search-svc", image: "ghcr.io/app/search:latest", port: 3004 },
      { name: "web-frontend", image: "ghcr.io/app/web:latest", port: 3005 },
      { name: "notifications", image: "ghcr.io/app/notifications:latest", port: 3006 },
      { name: "db-migrations", image: "ghcr.io/app/migrations:latest", port: 0 },
    ],
    mocks: [
      { name: "stripe-api", tool: "wiremock" as const },
      { name: "twilio-sms", tool: "mountebank" as const },
      { name: "sendgrid", tool: "wiremock" as const },
    ],
  },
};
