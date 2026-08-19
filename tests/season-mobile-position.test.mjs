import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync(new URL("../styles/seasons.css",import.meta.url),"utf8");
const mobile=css.slice(css.indexOf("@media(max-width:800px)"));

assert.match(mobile,/#view\{position:relative\}/,"the switcher is anchored to the view");
assert.match(mobile,/\.season-switcher\{position:absolute;/,"the switcher does not consume vertical layout space on mobile");
assert.match(mobile,/top:0;right:8px/,"the compact selector stays at the top right");
assert.doesNotMatch(mobile,/\.season-switcher\{position:relative/,"the old flow layout is not restored");
console.log("season mobile position: ok");
