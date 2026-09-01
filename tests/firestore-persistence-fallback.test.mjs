import assert from "node:assert/strict";
import test from "node:test";
import { tryEnableFirestorePersistence } from "../js/core/firestore-persistence.js";

test("persistence success is reported", async () => {
  assert.equal(await tryEnableFirestorePersistence(async db => assert.equal(db, "db"), "db"), true);
});

test("persistence failure falls back without rejecting app startup", async () => {
  const warnings = [];
  const result = await tryEnableFirestorePersistence(
    async () => { throw Object.assign(new Error("IndexedDB unavailable"), { code: "unimplemented" }); },
    "db",
    (...args) => warnings.push(args)
  );
  assert.equal(result, false);
  assert.equal(warnings.length, 1);
});
