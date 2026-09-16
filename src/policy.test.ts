import assert from "node:assert/strict";
import test from "node:test";
import { AMOUNT_ETH, assertPolicy, composeWorkflow, graphHash } from "./policy.js";

const task = {
  id: "0x935a2d3c8c949e8c58feacc6f9469142a1ad0d4a07c2922d0797bf2929a0a7b9",
  requester: "0x75A0C2d1Df51C07982De3Ff031E5232518676B19",
  description: "Execute one bounded onchain action through KeeperHub",
  reward: "10000",
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
