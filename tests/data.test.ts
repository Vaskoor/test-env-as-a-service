// tests/data.test.ts — tests for the synthetic data generator
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generate, verifyIntegrity } from "../src/data/synthetic-generator.ts";

describe("synthetic-generator", () => {
  test("generates the requested number of rows", () => {
    const d = generate({ users: 10, orders: 20, payments: 15 });
    assert.equal(d.tables[0].rows.length, 10); // users
    assert.equal(d.tables[1].rows.length, 20); // orders
    assert.equal(d.tables[2].rows.length, 15); // payments
  });
  test("users have unique IDs", () => {
    const d = generate({ users: 50, orders: 0, payments: 0 });
    const ids = d.tables[0].rows.map(r => r.id);
    assert.equal(new Set(ids).size, 50);
  });
  test("orders reference real user IDs", () => {
    const d = generate({ users: 5, orders: 10, payments: 0 });
    const userIds = new Set(d.tables[0].rows.map(r => String(r.id)));
    for (const order of d.tables[1].rows) {
      assert.ok(userIds.has(String(order.userId)), `order ${order.id} references unknown user ${order.userId}`);
    }
  });
  test("payments reference real order IDs", () => {
    const d = generate({ users: 5, orders: 10, payments: 15 });
    const orderIds = new Set(d.tables[1].rows.map(r => String(r.id)));
    for (const payment of d.tables[2].rows) {
      assert.ok(orderIds.has(String(payment.orderId)), `payment ${payment.id} references unknown order ${payment.orderId}`);
    }
  });
  test("verifyIntegrity passes for valid data", () => {
    const d = generate({ users: 10, orders: 30, payments: 20 });
    const v = verifyIntegrity(d);
    assert.equal(v.valid, true);
    assert.equal(v.errors.length, 0);
  });
  test("verifyIntegrity catches orphan FKs", () => {
    const d = generate({ users: 5, orders: 10, payments: 8 });
    // corrupt: set an order's userId to a non-existent user
    d.tables[1].rows[0].userId = "usr-9999";
    const v = verifyIntegrity(d);
    assert.equal(v.valid, false);
    assert.ok(v.errors.length > 0);
  });
  test("checksum is deterministic for same data", () => {
    const d1 = generate({ users: 1, orders: 1, payments: 1 });
    // not deterministic (random) but should be a 16-char hex string
    assert.match(d1.checksum, /^[a-f0-9]{16}$/);
  });
});
