// src/data/synthetic-generator.ts — referential-integrity-safe synthetic data
// Generates Users → Orders → Payments with proper FK relationships.

import crypto from "crypto";
import type { SyntheticData } from "../types.js";

const FIRST_NAMES = ["Anjali","Bhaskar","Priya","Rohan","Sita","Kiran","Maya","Arjun","Dipak","Lakshmi"];
const LAST_NAMES = ["Kaphle","Sharma","Thapa","Rai","Gurung","Maharjan","Shrestha","Tamang"];
const PRODUCTS = ["Laptop Stand","Ergonomic Chair","Standing Desk","A4 Paper Ream","Wireless Mouse"];
const STATUSES = ["pending","shipped","delivered","cancelled"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }
function id(prefix: string, n: number): string { return `${prefix}-${String(n).padStart(4,"0")}`; }

/** Generate a full dataset with referential integrity: users → orders → payments. */
export function generate(count: { users: number; orders: number; payments: number }): SyntheticData {
  const users: Record<string,unknown>[] = [];
  const orders: Record<string,unknown>[] = [];
  const payments: Record<string,unknown>[] = [];

  for (let i = 1; i <= count.users; i++) {
    users.push({
      id: id("usr", i),
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      email: `user${i}@test.dev`,
      phone: `+977-98${Math.floor(10000000+Math.random()*89999999)}`,
      createdAt: new Date(Date.now()-Math.random()*90*86400000).toISOString(),
    });
  }

  for (let i = 1; i <= count.orders; i++) {
    const userId = pick(users).id;
    const product = pick(PRODUCTS);
    const qty = 1+Math.floor(Math.random()*5);
    const unitPrice = 100+Math.floor(Math.random()*5000);
    orders.push({
      id: id("ord", i),
      userId,  // FK → users.id
      product,
      quantity: qty,
      unitPrice,
      total: qty*unitPrice,
      status: pick(STATUSES),
      createdAt: new Date(Date.now()-Math.random()*30*86400000).toISOString(),
    });
  }

  for (let i = 1; i <= count.payments; i++) {
    const order = pick(orders);
    payments.push({
      id: id("pay", i),
      orderId: order.id,  // FK → orders.id
      userId: order.userId, // FK → users.id (transitive)
      amount: order.total,
      method: pick(["card","esewa","khalti","cod"]),
      status: pick(["captured","pending","refunded"]),
      createdAt: new Date(Date.now()-Math.random()*7*86400000).toISOString(),
    });
  }

  const tables = [
    { name: "users", rows: users },
    { name: "orders", rows: orders },
    { name: "payments", rows: payments },
  ];
  const relations = [
    { from: "orders", to: "users", fk: "userId" },
    { from: "payments", to: "orders", fk: "orderId" },
    { from: "payments", to: "users", fk: "userId" },
  ];

  return {
    tables,
    relations,
    checksum: crypto.createHash("sha256").update(JSON.stringify({tables})).digest("hex").slice(0,16),
  };
}

/** Verify referential integrity — every FK in child tables points to a real parent row. */
export function verifyIntegrity(data: SyntheticData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tables: Record<string, Set<string>> = {};
  for (const t of data.tables) {
    tables[t.name] = new Set(t.rows.map(r => String(r.id)));
  }
  for (const rel of data.relations) {
    const child = data.tables.find(t => t.name === rel.from);
    const parent = tables[rel.to];
    if (!child || !parent) { errors.push(`table not found: ${rel.from} or ${rel.to}`); continue; }
    for (const row of child.rows) {
      const fk = String(row[rel.fk] || "");
      if (!parent.has(fk)) errors.push(`orphan FK: ${rel.from}.${rel.fk}=${fk} not in ${rel.to}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
