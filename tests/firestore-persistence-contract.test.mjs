import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const firebase = readFileSync(new URL("../js/core/firebase.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

test("Firestore keeps listener state in a persistent multi-tab cache", () => {
  assert.match(firebase, /initializeFirestore/);
  assert.match(firebase, /persistentLocalCache\(\{\s*tabManager:\s*persistentMultipleTabManager\(\)\s*\}\)/);
  assert.doesNotMatch(firebase, /getFirestore\(app\)/);
  assert.match(app, /core\/firebase\.js\?v=20260901-persistent-cache-v1/);
});
