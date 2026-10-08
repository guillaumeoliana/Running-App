import { describe, expect, it } from "vitest";
import { SportCore } from "./sport-core";

describe("SportCore", () => {
  it("formats running paces and computes the planned block duration", () => {
    expect(SportCore.pace(268)).toBe("4:28");
    expect(SportCore.time(268)).toBe("4’28");
    const firstSession = SportCore.plan()[0] as any;
    expect(firstSession.week).toBe(1);
    expect(SportCore.duration(firstSession)).toBeGreaterThan(0);
  });

  it("marks painful check-ins as a reason to avoid intensity", () => {
    expect(SportCore.readiness({ pain: 5, fatigue: 2, sleep: 8 }, null).level).toBe("red");
  });

  it("estimates strength volume and e1RM", () => {
    expect(SportCore.e1rm(60, 10)).toBe(80);
    expect(SportCore.volume({ exercises: [{ timed: false, sets: [{ kg: 60, reps: 10, done: true }] }] })).toBe(600);
  });
});
