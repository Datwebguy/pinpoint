import { mkdir, writeFile } from "node:fs/promises";
import { TASK_ID } from "./live-brief.js";

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(path.split(/[\\/]/).slice(0, -1).join("/") || ".", { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function explorerUrl(chainId: string, txHash: string): string {
  if (chainId === "84532") return `https://sepolia.basescan.org/tx/${txHash}`;
  if (chainId === "8453") return `https://basescan.org/tx/${txHash}`;
  return `https://blockscan.com/tx/${txHash}`;
}

export const proofContext = { project: "PINPOINT", liveProject: "Daydreams TaskMarket", taskId: TASK_ID };
