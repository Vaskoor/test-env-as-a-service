// src/types.ts — shared types for the Test Environment as a Service Platform

export type EnvStatus = "spinning-up" | "ready" | "degraded" | "tearing-down" | "terminated";

export interface TestEnv {
  id: string;
  pr: string;
  branch: string;
  status: EnvStatus;
  spinUpMs: number;
  readyAt?: number;
  terminatedAt?: number;
  services: ServiceInstance[];
  mocks: MockService[];
  dataVersion: string;
  chaosConfig: ChaosConfig | null;
  url: string;
}

export interface ServiceInstance {
  name: string;
  image: string;
  port: number;
  ready: boolean;
  replica: string; // k8s pod name
}

export interface MockService {
  name: string;
  tool: "wiremock" | "mountebank";
  stubs: WireMockStub[];
  calls: number;
}

export interface WireMockStub {
  id: string;
  method: string;
  urlPattern: string;
  status: number;
  body: string;
  latencyMs?: number;
}

export interface DataContract {
  consumer: string;
  provider: string;
  interactions: PactInteraction[];
  verified: boolean;
  version: string;
}

export interface PactInteraction {
  description: string;
  request: { method: string; path: string; headers?: Record<string,string>; body?: unknown };
  response: { status: number; headers?: Record<string,string>; body?: unknown };
}

export interface ChaosConfig {
  type: "latency" | "timeout" | "connection-reset" | "time-travel" | "cpu-stress";
  target: string; // service name
  value: number;
  durationSec: number;
}

export interface SyntheticData {
  tables: { name: string; rows: Record<string, unknown>[] }[];
  relations: { from: string; to: string; fk: string }[];
  checksum: string;
}
