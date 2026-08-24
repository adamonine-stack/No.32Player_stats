import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync(new URL("../js/app.js",import.meta.url),"utf8");
assert.ok(!app.match(/import \{[^}]*hasTeamDetailRegistration[^}]*\} from/),"app startup must not depend on a newly cached calculation export");
assert.ok(app.includes("registered=playerItems.length>0"),"registered zero-value players remain visible without a new module export");
assert.ok(app.includes('from "./calculations/participation-calculations.js?v=20260824-compact-sub-time-v3"'),"new participation exports must use a cache-busted module URL");
console.log("startup import contract passed");
