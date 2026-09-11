import { createHash } from "node:crypto";
import { REQUESTER, TASK_ID, type TaskMarketTask } from "./live-brief.js";

export const CHAIN_ID = "84532";
export const AMOUNT_ETH = "0.0002";

export type WorkflowNode = {
  id: string;
  type: "trigger" | "action";
  position?: { x: number; y: number };
  data: {
    type: "trigger" | "action";
    label: string;
    description?: string;
    config: Record<string, unknown>;
    status: "idle";
  };
};

export type Workflow = {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: Array<{ id: string; source: string; target: string }>;
  enabled: false;
};

export function composeWorkflow(task: TaskMarketTask): Workflow {
  if (task.id !== TASK_ID || task.requester.toLowerCase() !== REQUESTER.toLowerCase()) {
    throw new Error("Policy refuses a changed TaskMarket brief or recipient");
  }

  return {
    name: "PINPOINT — Daydreams TaskMarket bridge brief proof",
    description: `Live Daydreams TaskMarket task ${TASK_ID} (“Four Bridge Forms and Where Their Loads Go”, open, 2 USDC). After human review, this disabled workflow performs exactly one fixed typed KeeperHub web3/transfer-funds action on Base Sepolia: 0.0002 native ETH to the task requester. Dry-run is required before any execute.`,
    nodes: [
      {
        id: "manual-review",
        type: "trigger",
        position: { x: 80, y: 140 },
        data: {
          type: "trigger",
          label: "Human-reviewed TaskMarket job",
          description: "Manual trigger after the live Daydreams TaskMarket brief is reviewed.",
          config: { triggerType: "manual" },
          status: "idle",
        },
      },
      {
        id: "fixed-proof-transfer",
        type: "action",
        position: { x: 420, y: 140 },
        data: {
          type: "action",
          label: "Fixed Base Sepolia proof transfer",
          description: "Fixed typed KeeperHub transfer: 0.0002 native ETH on Base Sepolia to the live TaskMarket requester. No runtime amount, chain, or recipient inputs.",
          config: {
            actionType: "web3/transfer-funds",
            network: CHAIN_ID,
            amount: AMOUNT_ETH,
            recipientAddress: REQUESTER,
          },
          status: "idle",
        },
      },
    ],
    edges: [{ id: "manual-to-proof", source: "manual-review", target: "fixed-proof-transfer" }],
    enabled: false,
  };
}

export function assertPolicy(workflow: { nodes: WorkflowNode[]; edges: Workflow["edges"]; enabled?: boolean }): void {
  if (workflow.enabled) throw new Error("Policy violation: workflow must remain disabled until review");
  if (workflow.nodes.length !== 2 || workflow.edges.length !== 1) throw new Error("Policy violation: graph shape changed");
  const trigger = workflow.nodes.find((node) => node.id === "manual-review");
  const action = workflow.nodes.find((node) => node.id === "fixed-proof-transfer");
  const config = action?.data.config;
  if (
    !trigger ||
    trigger.type !== "trigger" ||
    trigger.data.type !== "trigger" ||
    trigger.data.status !== "idle" ||
    trigger.data.config.triggerType !== "manual"
  ) {
    throw new Error("Policy violation: manual review trigger missing");
  }
  if (!action || action.type !== "action" || config?.actionType !== "web3/transfer-funds") {
    throw new Error("Policy violation: typed transfer action missing");
  }
  if (action.data.type !== "action" || action.data.status !== "idle") {
    throw new Error("Policy violation: transfer action state changed");
  }
  if (config.network !== CHAIN_ID || config.amount !== AMOUNT_ETH || config.recipientAddress !== REQUESTER) {
    throw new Error("Policy violation: chain, amount, or recipient changed");
  }
  const [edge] = workflow.edges;
  if (!edge || edge.id !== "manual-to-proof" || edge.source !== "manual-review" || edge.target !== "fixed-proof-transfer") {
    throw new Error("Policy violation: graph edge changed");
  }
  if (JSON.stringify(workflow).includes("{{")) throw new Error("Policy violation: dynamic template detected");
}

export function graphHash(workflow: unknown): string {
  const value = workflow as Partial<Workflow>;
  const graph = {
    name: value.name,
    description: value.description,
    nodes: value.nodes,
    edges: value.edges,
    enabled: value.enabled,
  };
  return createHash("sha256").update(canonicalJson(graph)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
