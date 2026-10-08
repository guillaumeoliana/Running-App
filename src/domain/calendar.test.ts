import { describe, expect, it } from "vitest";
import { mergeScheduledSessions, upcomingSessions } from "./calendar";
const local = [{ id: "easy", date: "2026-01-06", name: "Endurance", week: 1, kind: "easy", steps: [], corosId: "a" }, { id: "rest", date: "2026-01-08", name: "Repos", week: 1, kind: "rest", steps: [] }];
describe("live COROS calendar", () => {
  it("uses the actual calendar date while preserving the local log identity", () => {
    const rows = mergeScheduledSessions(local, [{ ...local[0], id: "remote", date: "2026-01-08" }]);
    expect(rows.filter(x => x.corosId === "a")).toHaveLength(1);
    expect(rows.find(x => x.id === "easy")?.date).toBe("2026-01-08");
  });
  it("retains multiple workouts on one day and excludes completed or unwanted copies from suggestions", () => {
    const rows = mergeScheduledSessions(local, [{ ...local[0], id: "remote", date: "2026-01-08" }, { ...local[0], id: "extra", corosId: "b", date: "2026-01-08", blocked: true }, { ...local[0], id: "done", corosId: "c", date: "2026-01-08", completed: true }]);
    expect(rows.filter(x => x.date === "2026-01-08")).toHaveLength(4);
    expect(upcomingSessions(rows, "2026-01-08", "easy").map(x => x.id)).toEqual(["easy"]);
  });
  it("prefers the selected workout only among uncompleted sessions on the same day", () => {
    const rows = [{ ...local[0], id: "first" }, { ...local[0], id: "selected" }, { ...local[0], id: "tomorrow", date: "2026-01-07" }];
    expect(upcomingSessions(rows, "2026-01-06", "selected").map(x => x.id)).toEqual(["selected", "first", "tomorrow"]);
  });
});
