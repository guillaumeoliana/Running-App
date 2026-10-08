import { afterEach, describe, expect, it } from "vitest";
import handler from "../api/snapshot";

const environment = (globalThis as any).process.env as Record<string, string | undefined>;
const originalSnapshot = environment.COROS_SNAPSHOT_JSON;

function request(method: string) {
  const result: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const response = {
    setHeader(name: string, value: string) { result.headers[name] = value; return this; },
    status(code: number) { result.status = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  };
  handler({ method }, response);
  return result;
}

afterEach(() => {
  if (originalSnapshot === undefined) delete environment.COROS_SNAPSHOT_JSON;
  else environment.COROS_SNAPSHOT_JSON = originalSnapshot;
});

describe("private COROS snapshot endpoint", () => {
  it("rejects non-GET requests", () => {
    delete environment.COROS_SNAPSHOT_JSON;
    const result = request("POST");
    expect(result.status).toBe(405);
    expect(result.headers.Allow).toBe("GET");
  });

  it("returns no-store snapshot data from the server environment", () => {
    const snapshot = { capturedAt: "2026-10-08T14:00:00.000Z", activities: [], health: [], fitness: { prediction10k: 2680 } };
    environment.COROS_SNAPSHOT_JSON = JSON.stringify(snapshot);
    const result = request("GET");
    expect(result.status).toBe(200);
    expect(result.headers["Cache-Control"]).toContain("no-store");
    expect(result.body).toEqual(snapshot);
  });

  it("fails closed when no snapshot is configured", () => {
    delete environment.COROS_SNAPSHOT_JSON;
    const result = request("GET");
    expect(result.status).toBe(503);
  });
});
