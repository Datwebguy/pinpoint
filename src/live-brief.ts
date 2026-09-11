export const TASKMARKET_API = "https://api.taskmarket.dev";
export const TASK_ID = "0xb609dec4ba3d3eca26761b019263935bf1c8b158d48a9e5f7346855b70c75c6d";
export const REQUESTER = "0x436326b6772851Ca8Bd84F27e48d77A8668b34Bd";

export type TaskMarketTask = {
  id: string;
  requester: string;
  description: string;
  reward: string;
  mode: string;
  status: string;
};

export async function readLiveBrief(): Promise<TaskMarketTask> {
  const response = await fetch(`${TASKMARKET_API}/api/tasks/${TASK_ID}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TaskMarket returned HTTP ${response.status}`);
  const task = (await response.json()) as TaskMarketTask;
  if (task.id !== TASK_ID || task.requester.toLowerCase() !== REQUESTER.toLowerCase()) {
    throw new Error("Live TaskMarket brief identity changed; refusing to use a different recipient");
  }
  if (task.status !== "open") throw new Error(`TaskMarket brief is no longer open: ${task.status}`);
  return task;
}
