import test from "node:test";
import assert from "node:assert/strict";
import { generateTicket, optimizeCart } from "./optimizer.js";

const lookup = (productId: string, retailerId: string) => {
  const table: Record<string, Record<string, number>> = {
    p1: { carrefour: 3, dia: 2.5 },
    p2: { carrefour: 4.2, dia: 4 }
  };

  return table[productId]?.[retailerId] ?? null;
};

test("optimizeCart devuelve items y total en min_cost_split", () => {
  const result = optimizeCart(["p1", "p2"], "28001", "min_cost_split", lookup);

  assert.equal(result.strategy, "min_cost_split");
  assert.equal(result.items.length, 2);
  assert.ok(result.total > 0);
});

test("generateTicket agrupa líneas por supermercado", () => {
  const ticket = generateTicket([
    {
      productId: "p1",
      productName: "Producto 1",
      assignment: { retailerId: "dia", retailerName: "DIA", price: 2.5 }
    },
    {
      productId: "p2",
      productName: "Producto 2",
      assignment: { retailerId: "dia", retailerName: "DIA", price: 4 }
    }
  ]);

  assert.equal(ticket.supermarkets.length, 1);
  assert.equal(ticket.supermarkets[0]?.retailerName, "DIA");
  assert.ok(ticket.grandTotal > 0);
});
