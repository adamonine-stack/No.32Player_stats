import assert from "node:assert/strict";
import test from "node:test";
import { createListenerRegistry } from "../js/data/listener-registry.js";

test("listener registry prevents duplicates and unsubscribes replacements", () => {
  const registry=createListenerRegistry(),events=[];
  assert.equal(registry.set("stats",()=>{events.push("subscribe");return()=>events.push("unsubscribe")}),true);
  assert.equal(registry.set("stats",()=>{events.push("duplicate");return()=>{}}),false);
  assert.deepEqual(registry.keys(),["stats"]);
  assert.equal(registry.remove("stats"),true);
  assert.equal(registry.remove("stats"),false);
  assert.deepEqual(events,["subscribe","unsubscribe"]);
});
