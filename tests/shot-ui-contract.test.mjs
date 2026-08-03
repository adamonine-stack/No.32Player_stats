import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/shot-registration.css", import.meta.url), "utf8");

assert.match(app, /selectedShotId=normalizedEditing\?\.id\|\|''/);
assert.match(app, /data-select-shot=/);
assert.match(app, /shot-selection-ring/);
assert.match(app, /shot-foul-ring/);
assert.match(app, /event\.stopPropagation\(\)/);
assert.match(app, /id="shotWasFouled"/);
assert.match(app, /data-shot-filter-foul/);
assert.match(app, /表示ポイント：/);
assert.match(app, /FG試投：/);
assert.doesNotMatch(app, /analysis-points-tappable/);
assert.match(app, /court-analysis-button/);
assert.match(app, />コート分析</);
assert.match(app, /analysis-shot-filter-details/);
assert.match(app, /data-shot-analysis-filter/);
assert.match(app, /data-analysis-shot-type/);
assert.match(app, /selectedType/);
assert.match(app, /shot-analysis-conditions/);
assert.match(app, /displayShots=selectedType/);
assert.match(app, /viewBox="0 0 100 108"/);
assert.match(app, /バックコート3P/);
assert.doesNotMatch(app, /data-shot-area="long_range_3p"/);
assert.match(app, /<th>No\.<\/th>/);
assert.match(css, /\.shot-list-row\.selected/);
assert.match(css, /\.shot-foul-ring/);
assert.match(css, /\.shot-selection-ring/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.analysis-shot-heading/);
assert.match(css, /\.analysis-shot-filter-details/);
assert.doesNotMatch(css, /\.analysis-points-tappable/);

console.log("shot UI contract: ok");
