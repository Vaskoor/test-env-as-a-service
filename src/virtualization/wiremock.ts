// src/virtualization/wiremock.ts — WireMock stub management
import type { WireMockStub, MockService } from "../types.js";

const DEFAULT_STUBS: WireMockStub[] = [
  { id: "stripe-charge", method: "POST", urlPattern: "/v1/charges", status: 200, body: '{"id":"ch_test_123","status":"succeeded"}', latencyMs: 50 },
  { id: "stripe-refund", method: "POST", urlPattern: "/v1/refunds", status: 200, body: '{"id":"re_test_456","status":"succeeded"}' },
  { id: "sendgrid-mail", method: "POST", urlPattern: "/v3/mail/send", status: 202, body: '' },
  { id: "sendgrid-template", method: "GET", urlPattern: "/v3/templates/.*", status: 200, body: '{"id":"tpl_789"}' },
];

/** Generate WireMock stubs for a mock service. */
export function generateStubs(name: string): WireMockStub[] {
  if (name.includes("stripe")) return DEFAULT_STUBS.filter(s => s.id.startsWith("stripe"));
  if (name.includes("sendgrid") || name.includes("mail")) return DEFAULT_STUBS.filter(s => s.id.startsWith("sendgrid"));
  return DEFAULT_STUBS;
}

/** Create a WireMock mock service definition. */
export function createMock(name: string, stubs?: WireMockStub[]): MockService {
  return { name, tool: "wiremock", stubs: stubs || generateStubs(name), calls: 0 };
}
