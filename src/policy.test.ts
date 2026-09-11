import assert from "node:assert/strict";
import test from "node:test";
import { AMOUNT_ETH, assertPolicy, composeWorkflow, graphHash } from "./policy.js";

const task = {
  id: "0xb609dec4ba3d3eca26761b019263935bf1c8b158d48a9e5f7346855b70c75c6d",
  requester: "0x436326b6772851Ca8Bd84F27e48d77A8668b34Bd",
  description: "Four Bridge Forms and Where Their Loads Go",
  reward: "2000000",
  mode: "bounty",
  status: "open",
};

test("composes the reviewed fixed graph", () => {
  const workflow = composeWorkflow(task);
  assertPolicy(workflow);
  assert.equal(workflow.enabled, false);
  assert.equal(workflow.nodes.length, 2);
  assert.equal(workflow.nodes[1]?.data.config.amount, AMOUNT_ETH);
});

test("rejects a changed recipient or amount", () => {
  const workflow = composeWorkflow(task);
  workflow.nodes[1]!.data.config.amount = "1";
  assert.throws(() => assertPolicy(workflow), /amount/);
});

test("hash changes when the reviewed graph changes", () => {
  const workflow = composeWorkflow(task);
  const original = graphHash(workflow);
  workflow.nodes[1]!.data.config.recipientAddress = "0x0000000000000000000000000000000000000001";
  assert.notEqual(graphHash(workflow), original);
});
