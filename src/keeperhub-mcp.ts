const MCP_URL = process.env.KEEPERHUB_MCP_URL ?? "https://app.keeperhub.com/mcp";
const MCP_TIMEOUT_MS = 30_000;

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type McpEnvelope = {
  result?: { content?: Array<{ type: string; text?: string }> };
  error?: { code?: number; message?: string; data?: unknown };
};

export class KeeperHubMcp {
  private sessionId?: string;

  constructor(
    private readonly token = requiredEnv("KEEPERHUB_API_KEY"),
    private readonly url = MCP_URL,
  ) {}

  async connect(): Promise<void> {
    const response = await this.request({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "pinpoint", version: "0.1.0" },
      },
    });

    this.sessionId = response.headers.get("Mcp-Session-Id") ?? undefined;
    if (!this.sessionId) throw new Error("KeeperHub did not return an MCP session id");

    await this.request({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  async call<T = Json>(name: string, arguments_: Record<string, unknown>): Promise<T> {
    if (!this.sessionId) await this.connect();
    const envelope = await this.requestJson<McpEnvelope>({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: arguments_ },
    });

    if (envelope.error) {
      throw new Error(`KeeperHub MCP ${name} failed: ${JSON.stringify(envelope.error)}`);
    }

    const text = envelope.result?.content?.find((item) => item.type === "text")?.text;
    if (!text) return envelope.result as T;

    let parsed: { isError?: boolean; [key: string]: unknown };
    try {
      parsed = JSON.parse(text) as { isError?: boolean; [key: string]: unknown };
    } catch {
      throw new Error(`KeeperHub tool ${name} returned non-JSON content: ${text}`);
    }
    if (parsed.isError) throw new Error(`KeeperHub tool ${name} returned an error: ${text}`);
    return parsed as T;
  }

  private async request(body: Record<string, unknown>): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "Mcp-Protocol-Version": "2025-06-18",
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(MCP_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`KeeperHub MCP HTTP ${response.status}: ${await response.text()}`);
    return response;
  }

  private async requestJson<T>(body: Record<string, unknown>): Promise<T> {
    const response = await this.request(body);
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    if (contentType.includes("text/event-stream")) {
      const data = text
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean)
        .at(-1);
      if (!data) throw new Error("KeeperHub returned an empty MCP event stream");
      return JSON.parse(data) as T;
    }
    return JSON.parse(text) as T;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required and must never be committed to the repository`);
  return value;
}
