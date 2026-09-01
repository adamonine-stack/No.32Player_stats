import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const firebase = readFileSync(new URL("../js/core/firebase.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

test("Firestore persistence is optional and startup waits for its safe fallback", () => {
  assert.match(firebase, /getFirestore\(app\)/);
  assert.match(firebase, /tryEnableFirestorePersistence\(enableIndexedDbPersistence,\s*db\)/);
  assert.doesNotMatch(firebase, /initializeFirestore|persistentLocalCache|persistentMultipleTabManager/);
  assert.match(app, /await firestorePersistenceReady;syncOnce\(\)/);
  assert.match(app, /core\/firebase\.js\?v=20260901-scoped-reads-v1/);
});
