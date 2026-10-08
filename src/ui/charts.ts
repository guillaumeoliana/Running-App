export const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const number = (value: number) => value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
let chartId = 0;

export interface ChartOptions {
  labels?: string[];
  dates?: string[];
  unit?: string;
  height?: number;
  forecast?: boolean;
  min?: number;
  max?: number;
  reference?: number | null;
  referenceLabel?: string;
  tone?: "teal" | "blue" | "violet" | "orange";
  format?: (value: number) => string;
}

export function trendChart(values: Array<number | null>, options: ChartOptions = {}) {
  const { labels = [], dates = [], unit = "", height = 230, forecast = false, reference, referenceLabel = "Référence", tone = "teal", format = number } = options;
  const available = values.filter((value): value is number => Number.isFinite(value));
  if (!available.length) return '<div class="chart-empty"><svg viewBox="0 0 80 36" aria-hidden="true"><path d="M1 30h78M8 20l17-8 16 5 18-13 13 4"/></svg><strong>Aucune mesure disponible</strong><span>Les prochaines données apparaîtront ici.</span></div>';
  const bounds = [...available, ...(Number.isFinite(reference) ? [reference as number] : [])];
  const padding = Math.max((Math.max(...bounds) - Math.min(...bounds)) * .2, Math.abs(bounds[0]) * .02, .5);
  const rawLow = Math.min(...bounds) - padding, rawHigh = Math.max(...bounds) + padding;
  const magnitude = 10 ** Math.floor(Math.log10((rawHigh - rawLow) / 4));
  const relativeStep = (rawHigh - rawLow) / 4 / magnitude;
  const step = (relativeStep <= 1 ? 1 : relativeStep <= 2 ? 2 : relativeStep <= 5 ? 5 : 10) * magnitude;
  const low = options.min ?? Math.floor(rawLow / step) * step;
  const high = options.max ?? Math.ceil(rawHigh / step) * step;
  const span = high - low || 1;
  const tickCount = Math.min(6, Math.max(1, Math.round(span / step)));
  const left = 52, right = 594, top = 26, bottom = height - 34;
  const timestamps = dates.map(date => Date.parse(date + "T12:00:00Z"));
  const dateAxis = timestamps.length === values.length && timestamps.every(Number.isFinite) && timestamps.at(-1)! > timestamps[0];
  const X = (i: number) => values.length === 1 ? (left + right) / 2 : left + (dateAxis ? (timestamps[i] - timestamps[0]) / (timestamps.at(-1)! - timestamps[0]) : i / (values.length - 1)) * (right - left);
  const Y = (value: number) => bottom - (value - low) / span * (bottom - top);
  const segments: Array<Array<[number, number]>> = [];
  let segment: Array<[number, number]> = [];
  values.forEach((value, i) => {
    if (!Number.isFinite(value)) { if (segment.length) segments.push(segment); segment = []; }
    else segment.push([X(i), Y(value as number)]);
  });
  if (segment.length) segments.push(segment);
  const id = `trend-fill-${++chartId}`;
  return `<div class="chart-frame tone-${tone}"><svg class="chart professional-chart" viewBox="0 0 630 ${height}" role="img" aria-label="${escapeHtml(unit)} : ${available.length} mesures"><title>${escapeHtml(unit)}</title><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".14"/><stop offset="100%" stop-color="currentColor" stop-opacity=".01"/></linearGradient></defs>${Array.from({ length: tickCount + 1 }, (_, i) => low + span * i / tickCount).map(value => `<line class="grid" x1="${left}" x2="${right}" y1="${Y(value)}" y2="${Y(value)}"/><text x="${left - 12}" y="${Y(value) + 4}" text-anchor="end">${escapeHtml(format(value))}</text>`).join("")}${Number.isFinite(reference) ? `<line class="chart-reference" x1="${left}" x2="${right}" y1="${Y(reference!)}" y2="${Y(reference!)}"/><text class="reference-label" x="${right}" y="${Y(reference!) - 8}" text-anchor="end">${escapeHtml(referenceLabel)} ${escapeHtml(format(reference!))}</text>` : ""}${segments.map(points => {
    const path = points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
    return `${points.length > 1 && !forecast ? `<path d="${path} L ${points.at(-1)![0]} ${bottom} L ${points[0][0]} ${bottom} Z" fill="url(#${id})"/>` : ""}<path d="${path}" class="chart-line ${forecast ? "is-forecast" : ""}"/>`;
  }).join("")}${values.map((value, i) => {
    if (!Number.isFinite(value)) return "";
    const detail = `${labels[i] || dates[i] || `Mesure ${i + 1}`} · ${format(value!)} ${unit}`;
    return `<circle class="chart-dot" cx="${X(i)}" cy="${Y(value!)}" r="3.5"/><circle class="chart-hit" cx="${X(i)}" cy="${Y(value!)}" r="12" tabindex="0" role="button" aria-label="${escapeHtml(detail)}" data-chart-value="${escapeHtml(detail)}"><title>${escapeHtml(detail)}</title></circle>`;
  }).join("")}${labels.map((label, i) => labels.length <= 5 || i === 0 || i === labels.length - 1 || i % Math.ceil(labels.length / 4) === 0 ? `<text x="${X(i)}" y="${height - 9}" text-anchor="${i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}">${escapeHtml(label)}</text>` : "").join("")}</svg></div>`;
}

export function volumeBars(labels: string[], planned: number[], actual: Array<number | null>) {
  const top = Math.max(5, Math.ceil(Math.max(...planned, ...actual.filter((x): x is number => Number.isFinite(x))) / 5) * 5);
  const baseline = 219, scale = 174 / top, step = 552 / Math.max(labels.length, 1), X = (i: number) => 56 + step * (i + .5), width = Math.min(18, step * .26);
  return `<svg class="chart professional-chart volume-bars" viewBox="0 0 630 258" role="img" aria-label="Distance prévue et réalisée en kilomètres"><title>Volume de course · kilomètres</title>${Array.from({ length: 4 }, (_, i) => top * i / 3).map(value => `<line class="grid" x1="52" x2="606" y1="${baseline - value * scale}" y2="${baseline - value * scale}"/><text x="40" y="${baseline - value * scale + 4}" text-anchor="end">${number(value)}</text>`).join("")}${labels.map((label, i) => {
    const known = actual[i] !== null, value = actual[i] ?? 0;
    const detail = `${label} · prévu ${number(planned[i])} km · ${known ? `réalisé ${number(value)} km` : "jour à venir"}`;
    return `<rect class="bar-planned" x="${X(i) - width - 2}" y="${baseline - planned[i] * scale}" width="${width}" height="${planned[i] * scale}" rx="4"/><rect class="bar-actual" x="${X(i) + 2}" y="${baseline - value * scale}" width="${width}" height="${value * scale}" rx="4"/><rect class="bar-hit" x="${X(i) - step / 2 + 2}" y="28" width="${step - 4}" height="199" rx="6" tabindex="0" role="button" aria-label="${escapeHtml(detail)}" data-chart-value="${escapeHtml(detail)}"/><text x="${X(i)}" y="246" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("")}</svg>`;
}

export function paceChart(history: Array<{ date: string; paces: Record<string, number> }>, series: Array<{ key: string; label: string; color: string }>, format: (value: number) => string, label: (date: string) => string) {
  const rows = history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const values = rows.flatMap(row => series.map(item => row.paces[item.key]).filter(Number.isFinite));
  if (!values.length) return '<div class="chart-empty"><strong>Aucune distance sélectionnée</strong><span>Active une distance pour afficher ses repères.</span></div>';
  const low = Math.floor((Math.min(...values) - 10) / 15) * 15, high = Math.ceil((Math.max(...values) + 10) / 15) * 15;
  const start = Date.parse(rows[0].date), end = Date.parse(rows.at(-1)!.date);
  const X = (date: string) => start === end ? 322 : 58 + (Date.parse(date) - start) / (end - start) * 528;
  const Y = (value: number) => 222 - (value - low) / (high - low) * 183;
  return `<svg class="chart professional-chart pace-comparison" viewBox="0 0 630 258" role="img" aria-label="Allures estimées COROS en minutes par kilomètre"><title>Historique des allures COROS · dates réelles</title>${Array.from({ length: 5 }, (_, i) => low + (high - low) * i / 4).map(value => `<line class="grid" x1="58" x2="586" y1="${Y(value)}" y2="${Y(value)}"/><text x="45" y="${Y(value) + 4}" text-anchor="end">${format(value)}</text>`).join("")}${series.map(item => {
    const points = rows.map(row => Number.isFinite(row.paces[item.key]) ? row : null);
    let pen = false;
    const path = points.map(row => { if (!row) { pen = false; return ""; } const command = pen ? "L" : "M"; pen = true; return `${command} ${X(row.date)} ${Y(row.paces[item.key])}`; }).join(" ");
    return `<path d="${path}" fill="none" stroke="${item.color}" stroke-width="2.4"/>${points.filter(row => row !== null).map(row => {
      const detail = `${label(row!.date)} · ${item.label} · ${format(row!.paces[item.key])}/km`;
      return `<circle cx="${X(row!.date)}" cy="${Y(row!.paces[item.key])}" r="4" fill="${item.color}"/><circle class="chart-hit" cx="${X(row!.date)}" cy="${Y(row!.paces[item.key])}" r="12" tabindex="0" role="button" aria-label="${escapeHtml(detail)}" data-chart-value="${escapeHtml(detail)}"/>`;
    }).join("")}`;
  }).join("")}${rows.filter((_, i) => rows.length < 6 || i === 0 || i === rows.length - 1 || i % Math.ceil(rows.length / 4) === 0).map(row => `<text x="${X(row.date)}" y="248" text-anchor="middle">${escapeHtml(label(row.date))}</text>`).join("")}</svg>`;
}
