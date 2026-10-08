import { describe, expect, it } from "vitest";
import { healthSeries, healthSummary } from "./analytics";
import { paceChart, trendChart, volumeBars } from "./charts";

describe("real measurement charts", () => {
  it("keeps missing calendar days empty and counts only measured values", () => {
    const rows = [{ date: "2026-01-01", hrv: 60 }, { date: "2026-01-03", hrv: 70 }];
    const dates = ["2026-01-01", "2026-01-02", "2026-01-03"];
    expect(healthSeries(rows, dates, "hrv")).toEqual([60, null, 70]);
    expect(healthSummary(rows, dates, "hrv")).toEqual({ count: 2, mean: 65, latest: { date: "2026-01-03", value: 70 } });
    const output = trendChart([60, null, 70], { dates });
    expect(output.match(/class="chart-line /g)).toHaveLength(2);
    expect(output).not.toMatch(/NaN|Infinity/);
  });
  it("uses elapsed calendar time rather than equal spacing for irregular observations", () => {
    const output = trendChart([50, 52, 54], { dates: ["2026-01-01", "2026-01-02", "2026-01-11"] });
    expect(output).toContain('cx="106.2"');
  });
  it("does not invent a series for an empty or single measurement", () => {
    expect(trendChart([null])).toContain("Aucune mesure disponible");
    expect(trendChart([60])).not.toContain(" L ");
    expect(paceChart([{ date: "2026-01-01", paces: { ten: 270 } }], [], String, x => x)).toContain("Aucune distance sélectionnée");
  });
  it("distinguishes future days from zero completed volume and escapes chart text", () => {
    const output = volumeBars(["Lundi", '<img src=x onerror="alert(1)">'], [5, 6], [0, null]);
    expect(output).toContain("réalisé 0 km");
    expect(output).toContain("jour à venir");
    expect(output).not.toContain("<img");
    expect(output).not.toMatch(/NaN|Infinity/);
  });
});
