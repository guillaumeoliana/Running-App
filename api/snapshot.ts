// This is a server-only Vercel Function. Never rename this variable with a VITE_ prefix.
declare const process: { env: { COROS_SNAPSHOT_JSON?: string } };
export default function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const serialized = process.env.COROS_SNAPSHOT_JSON;
  if (!serialized) {
    return res.status(503).json({ error: "COROS snapshot is not configured" });
  }

  try {
    const snapshot = JSON.parse(serialized);
    if (!snapshot || typeof snapshot !== "object" || !snapshot.capturedAt || !snapshot.fitness || !Array.isArray(snapshot.activities) || !Array.isArray(snapshot.health)) {
      return res.status(500).json({ error: "COROS snapshot has an invalid format" });
    }
    return res.status(200).json(snapshot);
  } catch {
    return res.status(500).json({ error: "COROS snapshot is invalid JSON" });
  }
}
