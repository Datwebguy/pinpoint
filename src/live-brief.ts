export const TASKMARKET_API = "https://api.taskmarket.dev";
export const TASK_ID = "0x935a2d3c8c949e8c58feacc6f9469142a1ad0d4a07c2922d0797bf2929a0a7b9";
export const REQUESTER = "0x75A0C2d1Df51C07982De3Ff031E5232518676B19";

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
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`TaskMarket returned HTTP ${response.status}`);
  const task = (await response.json()) as unknown;
  if (!isTaskMarketTask(task)) throw new Error("TaskMarket returned an incomplete task record");
  if (task.id !== TASK_ID || task.requester.toLowerCase() !== REQUESTER.toLowerCase()) {
    throw new Error("Live TaskMarket brief identity changed; refusing to use a different recipient");
  }
  if (task.status !== "open") throw new Error(`TaskMarket brief is no longer open: ${task.status}`);
  return task;
}

function isTaskMarketTask(value: unknown): value is TaskMarketTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<TaskMarketTask>;
  return [task.id, task.requester, task.description, task.reward, task.mode, task.status].every(
    (field) => typeof field === "string",
  );
}
