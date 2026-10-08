interface Session {
  id: string;
  date: string;
  name: string;
  week: number;
  kind: string;
  steps: unknown[];
  corosId?: string;
  completed?: boolean;
  blocked?: boolean;
  [key: string]: unknown;
}

export function mergeScheduledSessions(local: Session[], scheduled: Session[] = [], window?: { start: string; end: string }): Session[] {
  const visible = local.filter(row => !window || !row.corosId || row.date < window.start || row.date > window.end || scheduled.some(item => item.corosId === row.corosId));
  const rows = new Map(visible.map(row => [row.id, row]));
  for (const row of scheduled) {
    if (!row || typeof row.id !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Array.isArray(row.steps)) continue;
    const match = local.find(item => row.corosId && item.corosId === row.corosId);
    const id = match?.id ?? row.id;
    rows.set(id, { ...match, ...row, id });
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingSessions(sessions: Session[], today: string, preferredId?: string, loggedIds: string[] = []) {
  return sessions.filter(row => row.date >= today && row.kind !== "rest" && !row.completed && !row.blocked && !loggedIds.includes(row.id)).sort((a, b) => a.date.localeCompare(b.date) || Number(b.id === preferredId) - Number(a.id === preferredId));
}
