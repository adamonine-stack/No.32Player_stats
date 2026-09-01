import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const firebase = readFileSync(new URL("../js/core/firebase.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

test("Firestore startup remains compatible across browsers", () => {
  assert.match(firebase, /getFirestore\(app\)/);
  assert.doesNotMatch(firebase, /persistentLocalCache|persistentMultipleTabManager/);
  assert.match(app, /core\/firebase\.js\?v=20260901-startup-hotfix-v2/);
});
