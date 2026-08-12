import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/shot-registration.css", import.meta.url), "utf8");
const start = app.indexOf("function shotManagementHtml");
const end = app.indexOf("async function persistShotCollections", start);
const shotManagement = app.slice(start, end);

assert.ok(shotManagement.includes('class="shot-total-item"'));
assert.ok(shotManagement.includes("<output>"));
assert.doesNotMatch(shotManagement, /input[^>]+readonly/);
assert.match(css, /\.shot-total-item output[\s\S]*pointer-events:none/);

console.log("shot total display contract: ok");
