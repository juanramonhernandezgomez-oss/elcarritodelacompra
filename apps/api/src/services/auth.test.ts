import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordHash, verifyPassword } from "./auth.js";

test("verifyPassword valida hash correcto", async () => {
  const plain = "secreto123";
  const { salt, passwordHash } = await createPasswordHash(plain);

  const ok = await verifyPassword(plain, salt, passwordHash);
  const bad = await verifyPassword("otra", salt, passwordHash);

  assert.equal(ok, true);
  assert.equal(bad, false);
});
