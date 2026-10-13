// tests/contracts.test.ts — tests for the Pact contract verifier
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { verifyContract, buildContract } from "../src/contracts/pact.ts";
import type { PactInteraction } from "../src/types.ts";

describe("pact contract verification", () => {
  const interactions: PactInteraction[] = [
    {
      description: "GET /users/:id returns a user",
      request: { method: "GET", path: "/users/1" },
      response: { status: 200, body: { id: "1", name: "test" } },
    },
    {
      description: "POST /users creates a user",
      request: { method: "POST", path: "/users", body: { name: "new" } },
      response: { status: 201, body: { id: "2" } },
    },
  ];

  test("passes when provider responses match", () => {
    const contract = buildContract("web", "users-svc", interactions, "1.0");
    const responses = new Map([
      ["GET /users/1", { status: 200, body: { id: "1", name: "test", email: "x@y.com" } }],
      ["POST /users", { status: 201, body: { id: "2", name: "new" } }],
    ]);
    const result = verifyContract(contract, responses);
    assert.equal(result.verified, true);
    assert.equal(result.passed, 2);
    assert.equal(result.failed, 0);
  });

  test("fails on status mismatch", () => {
    const contract = buildContract("web", "users-svc", interactions, "1.0");
    const responses = new Map([
      ["GET /users/1", { status: 404 }],
      ["POST /users", { status: 201, body: { id: "2" } }],
    ]);
    const result = verifyContract(contract, responses);
    assert.equal(result.verified, false);
    assert.equal(result.failed, 1);
    assert.match(result.failures[0].detail, /status/);
  });

  test("fails on missing body key", () => {
    const contract = buildContract("web", "users-svc", interactions, "1.0");
    const responses = new Map([
      ["GET /users/1", { status: 200, body: { id: "1" } }], // missing "name"
      ["POST /users", { status: 201, body: { id: "2" } }],
    ]);
    const result = verifyContract(contract, responses);
    assert.equal(result.verified, false);
    assert.match(result.failures[0].detail, /missing body key/);
  });

  test("fails when no response for interaction", () => {
    const contract = buildContract("web", "users-svc", interactions, "1.0");
    const responses = new Map([
      ["GET /users/1", { status: 200, body: { id: "1", name: "x" } }],
      // POST /users missing
    ]);
    const result = verifyContract(contract, responses);
    assert.equal(result.verified, false);
    assert.equal(result.failed, 1);
    assert.match(result.failures[0].detail, /no response/);
  });
});
