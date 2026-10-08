import { escapeHtml as esc, trendChart, volumeBars } from "./charts";

type Health = { date: string; sleep?: number | null; hrv?: number | null; restingHR?: number | null };
type Activity = { id: string; date: string; name?: string; km: number; seconds: number; pace?: number; hr?: number | null };
type Fitness = { prediction5k?: number; prediction10k?: number; predictionHalf?: number; predictionMarathon?: number; vo2max?: number; thresholdPace?: number };
interface AnalyticsContext {
  data: { health: Health[]; fitness: Fitness; capturedAt: string; hrvBaseline?: number; recovery?: { percentage?: number }; activities: Activity[]; trainingLoad?: Array<{ date: string; shortTerm: number; longTerm: number; ratio?: number | null }> };
  days: number;
  today: string;
  dates: string[];
  weekDates: string[];
  planned: number[];
  actual: Array<number | null>;
  weekActivities: Activity[];
  nextSession: { id: string; name: string; date: string; minutes: number; km: number } | null;
  predictionHistory: Array<{ date: string; seconds: number }>;
  paceHistory: string;
}
const numeric = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const n = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const dateLabel = (date: string) => new Date(date + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const pace = (value: number | undefined) => numeric(value) && value > 0 ? `${Math.floor(Math.round(value) / 60)}:${String(Math.round(value) % 60).padStart(2, "0")}` : "—";
const clock = (seconds: number | undefined) => {
  if (!numeric(seconds) || seconds <= 0) return "—";
  const value = Math.round(seconds), h = Math.floor(value / 3600), m = Math.floor(value % 3600 / 60), s = String(value % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};
const sleepTime = (minutes: number | null) => minutes === null ? "—" : `${Math.floor(Math.round(minutes) / 60)}h${String(Math.round(minutes) % 60).padStart(2, "0")}`;

export function healthSeries(health: Health[], dates: string[], field: keyof Omit<Health, "date">) {
  const byDate = new Map(health.map(row => [row.date, row]));
  return dates.map(date => { const value = byDate.get(date)?.[field]; return numeric(value) ? value : null; });
}

export function healthSummary(health: Health[], dates: string[], field: keyof Omit<Health, "date">) {
  const values = healthSeries(health, dates, field).filter(numeric);
  const latest = [...health].filter(row => dates.includes(row.date) && numeric(row[field])).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  return { count: values.length, mean: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null, latest: latest ? { date: latest.date, value: latest[field] as number } : null };
}

function icon(name: string) {
  const paths: Record<string, string> = { run: "m4 18 5-6 4 3 7-11M4 21h16", moon: "M20 14a8 8 0 0 1-10-10A8 8 0 1 0 20 14Z", heart: "M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z", pulse: "M2 12h5l3-7 4 14 3-7h5", target: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l8-8" };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.run}"/></svg>`;
}

function kpi(label: string, value: string, unit: string, detail: string, glyph: string, tone: string, sub = "") {
  return `<article class="insight-kpi tone-${tone}"><div class="kpi-top"><span>${label}</span><span class="kpi-icon">${icon(glyph)}</span></div><div class="kpi-value">${esc(value)}<small>${unit}</small></div><div class="kpi-detail">${detail}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ""}</article>`;
}

function healthCard(context: AnalyticsContext, field: "sleep" | "hrv" | "restingHR", title: string, unit: string, tone: "blue" | "teal" | "violet") {
  const summary = healthSummary(context.data.health, context.dates, field);
  const raw = healthSeries(context.data.health, context.dates, field);
  const values = field === "sleep" ? raw.map(v => v === null ? null : v / 60) : raw;
  const format = field === "sleep" ? (v: number) => sleepTime(v * 60) : n;
  return `<article class="card health-chart-card tone-${tone}"><div class="card-head"><h2>${title}</h2><span class="data-coverage">${summary.count}/${context.days} ${field === "sleep" ? "nuits" : "jours"}</span></div><div class="health-chart-value">${summary.mean === null ? "—" : field === "sleep" ? sleepTime(summary.mean) : n(summary.mean)}<small>${field === "sleep" ? "" : unit}</small><span>Moyenne · ${context.days} jours</span></div>${trendChart(values, { dates: context.dates, labels: context.dates.map(dateLabel), unit, tone, format, reference: field === "hrv" ? context.data.hrvBaseline : null, referenceLabel: "Réf. COROS" })}<div class="chart-caption">${field === "sleep" ? "Durée dormie · nuit datée au réveil" : field === "hrv" ? "HRV nocturne officielle · référence COROS" : "Fréquence cardiaque au repos · COROS"}</div></article>`;
}

export function renderAnalytics(context: AnalyticsContext) {
  const { data, days, dates, today } = context;
  const sleep = healthSummary(data.health, dates, "sleep"), hrv = healthSummary(data.health, dates, "hrv"), rhr = healthSummary(data.health, dates, "restingHR");
  const distance = context.weekActivities.reduce((sum, a) => sum + a.km, 0), duration = context.weekActivities.reduce((sum, a) => sum + a.seconds, 0), target = context.planned.reduce((sum, v) => sum + v, 0);
  const recovery = numeric(data.recovery?.percentage) ? Math.max(0, Math.min(100, data.recovery.percentage)) : null;
  const hrvDelta = hrv.latest && numeric(data.hrvBaseline) ? hrv.latest.value - data.hrvBaseline : null;
  const latestDate = (summary: ReturnType<typeof healthSummary>) => summary.latest ? summary.latest.date === today ? "Aujourd’hui" : dateLabel(summary.latest.date) : "Aucune mesure";
  const periods = `<div class="period-picker" role="group" aria-label="Période d’analyse">${[7, 30].map(value => `<button data-action="analytics-period" data-days="${value}" class="${days === value ? "active" : ""}" aria-pressed="${days === value}">${value} jours</button>`).join("")}</div>`;
  const history = context.predictionHistory.filter(x => numeric(x.seconds) && x.seconds > 0).sort((a, b) => a.date.localeCompare(b.date));
  const latestLoad = [...(data.trainingLoad || [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const sessions = [...data.activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return `<div class="page-head analysis-heading"><div><div class="eyebrow">VUE D’ENSEMBLE</div><h1>Performance & récupération</h1><p class="subtitle">${dateLabel(dates[0])} — ${dateLabel(dates.at(-1)!)} · ${data.health.filter(h => dates.includes(h.date)).length} journées COROS disponibles</p></div>${periods}</div>
  <section class="performance-hero" aria-label="Objectif de course et récupération"><div class="hero-main"><div class="hero-label"><span class="hero-label-dot"></span>OBJECTIF 10 KM <span class="hero-source">ESTIMATION COROS</span></div><div class="performance-time">${clock(data.fitness.prediction10k)}<span>${numeric(data.fitness.prediction10k) ? pace(data.fitness.prediction10k / 10) : "—"} /km</span></div><div class="performance-facts"><div><span>VO₂max</span><strong>${data.fitness.vo2max ?? "—"}<small>ml/kg/min</small></strong></div><div><span>Allure au seuil</span><strong>${pace(data.fitness.thresholdPace)}<small>/km</small></strong></div><div><span>Plan 10 km</span><strong>12<small>semaines</small></strong></div></div></div><div class="hero-recovery"><div class="recovery-ring" style="--progress:${recovery ?? 0}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="51" class="ring-track"/><circle cx="60" cy="60" r="51" class="ring-progress" pathLength="100" stroke-dasharray="${recovery ?? 0} 100"/></svg><div><strong>${recovery ?? "—"}<small>${recovery === null ? "" : "%"}</small></strong><span>Récupération</span></div></div><div class="recovery-copy"><span class="hero-label">STATUT COROS</span><h2>Récupération physique</h2><p>Score de la montre au dernier bilan.<br>À croiser avec le sommeil et ton ressenti.</p><button class="hero-text-button" data-action="checkin">Renseigner mon ressenti <span>↗</span></button></div></div></section>
  <div class="insight-kpis">${kpi("Volume cette semaine", n(distance), "km", `${context.weekActivities.length} sortie${context.weekActivities.length > 1 ? "s" : ""} · ${duration ? clock(duration) : "0:00"} au total`, "run", "teal", `${n(target)} km prévus · semaine en cours`)}${kpi("Dernière nuit", sleepTime(sleep.latest?.value ?? null), "", latestDate(sleep), "moon", "blue", sleep.mean === null ? "Historique indisponible" : `${sleepTime(sleep.mean)} de moyenne sur ${sleep.count} nuits`)}${kpi("HRV nocturne", hrv.latest ? n(hrv.latest.value) : "—", "ms", `${latestDate(hrv)}${hrvDelta === null ? "" : ` · <span class="metric-delta">${hrvDelta >= 0 ? "+" : ""}${n(hrvDelta)} ms vs référence</span>`}`, "pulse", "teal", numeric(data.hrvBaseline) ? `Référence personnelle COROS : ${n(data.hrvBaseline)} ms` : "Référence COROS indisponible")}${kpi("FC au repos", rhr.latest ? n(rhr.latest.value) : "—", "bpm", latestDate(rhr), "heart", "violet", rhr.mean === null ? "Historique indisponible" : `${n(rhr.mean)} bpm de moyenne sur ${rhr.count} jours`)}</div>
  <div class="analysis-main-grid"><article class="card training-volume-card"><div class="card-head"><div><div class="eyebrow">RÉGULARITÉ</div><h2>Volume de course</h2></div><span class="date-chip">${dateLabel(context.weekDates[0])} — ${dateLabel(context.weekDates.at(-1)!)}</span></div><div class="volume-card-top"><div><strong>${n(distance)}<small>km</small></strong><span>réalisés cette semaine</span></div><div class="chart-key"><span><i class="key-planned"></i>Prévu</span><span><i class="key-actual"></i>Réalisé</span></div></div>${volumeBars(context.weekDates.map(date => new Date(date + "T12:00:00Z").toLocaleDateString("fr-FR", { weekday: "short" })), context.planned, context.actual)}<div class="chart-caption">${n(target)} km au programme · les jours à venir n’ont pas encore de volume réalisé.</div></article>
  <aside class="analysis-aside"><article class="card next-session-card"><div class="eyebrow">PROCHAINE SÉANCE</div>${context.nextSession ? `<span class="date-chip">${dateLabel(context.nextSession.date)}</span><h2>${esc(context.nextSession.name)}</h2><div class="next-session-stats"><strong>${context.nextSession.minutes}<small>min</small></strong><strong>${n(context.nextSession.km)}<small>km estimés</small></strong></div><button class="btn primary" data-action="session" data-id="${esc(context.nextSession.id)}">Détail de la séance <span>↗</span></button>` : '<h2>Aucune séance à venir</h2><p class="subtitle">Consulte ton programme pour la suite.</p><button class="btn primary" data-action="nav" data-page="plan">Voir le plan</button>'}</article><article class="card load-summary"><div class="card-head"><h2>Charge d’entraînement</h2><span class="pill">COROS</span></div>${latestLoad ? `<div class="load-numbers"><div><strong>${n(latestLoad.shortTerm)}</strong><span>Court terme</span></div><div><strong>${n(latestLoad.longTerm)}</strong><span>Long terme</span></div><div><strong>${numeric(latestLoad.ratio) ? latestLoad.ratio.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "—"}</strong><span>Ratio</span></div></div><p class="chart-caption">Bilan du ${dateLabel(latestLoad.date)} · charge officielle COROS</p>` : '<p class="subtitle">Le prochain bilan COROS complétera cet indicateur.</p>'}</article></aside></div>
  <div class="section-heading"><div><div class="eyebrow">RÉCUPÉRATION</div><h2>Les tendances derrière le score</h2></div><span>${days} jours · mesures disponibles uniquement</span></div><div class="health-charts-grid">${healthCard(context, "sleep", "Sommeil", "h", "blue")}${healthCard(context, "hrv", "Variabilité cardiaque", "ms", "teal")}${healthCard(context, "restingHR", "FC au repos", "bpm", "violet")}</div>
  <div class="section-heading"><div><div class="eyebrow">PERFORMANCE</div><h2>Repères de course</h2></div><span>Estimations COROS · chronos non mesurés</span></div><div class="race-predictions">${([["5 km", 5, "prediction5k"], ["10 km", 10, "prediction10k"], ["Semi-marathon", 21.0975, "predictionHalf"], ["Marathon", 42.195, "predictionMarathon"]] as const).map(([label, km, field]) => `<article class="race-card ${field === "prediction10k" ? "is-goal" : ""}"><div><span>${label}</span>${field === "prediction10k" ? '<span class="goal-chip">Objectif</span>' : icon("target")}</div><strong>${clock(data.fitness[field])}</strong><p>${numeric(data.fitness[field]) ? pace(data.fitness[field]! / km) : "—"} <span>/km</span></p></article>`).join("")}</div>
  <details class="card performance-detail"><summary><span><strong>Évolution des estimations</strong><small>Historique réel des allures COROS</small></span><span class="details-arrow">＋</span></summary><div class="detail-content">${context.paceHistory}${history.length >= 2 ? `<h3>Estimation 10 km</h3>${trendChart(history.map(x => x.seconds / 60), { dates: history.map(x => x.date), labels: history.map(x => dateLabel(x.date)), unit: "min / 10 km", format: value => clock(value * 60) })}` : '<p class="chart-caption">Une première référence disponible. La tendance se construira avec les prochains bilans.</p>'}</div></details>
  <article class="card analysis-activities"><div class="card-head"><div><div class="eyebrow">ACTIVITÉS RÉCENTES</div><h2>Dernières courses</h2></div><button class="btn ghost" data-action="nav" data-page="overview">Tout voir ↗</button></div>${sessions.length ? `<div class="activity-table-wrap"><table class="activity-table"><thead><tr><th>Activité</th><th>Distance</th><th>Durée</th><th>Allure</th><th>FC moyenne</th><th></th></tr></thead><tbody>${sessions.map(activity => `<tr><td><button class="activity-name" data-action="activity" data-id="${esc(activity.id)}"><span class="activity-table-icon">${icon("run")}</span><span><strong>${esc(activity.name || "Course à pied")}</strong><small>${dateLabel(activity.date)}</small></span></button></td><td>${n(activity.km)}<small> km</small></td><td>${clock(activity.seconds)}</td><td>${pace(activity.pace)}<small> /km</small></td><td>${activity.hr ?? "—"}<small> bpm</small></td><td><button class="table-open" data-action="activity" data-id="${esc(activity.id)}" aria-label="Détails ${esc(activity.name)} du ${dateLabel(activity.date)}">↗</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="subtitle">Aucune course disponible pour le moment.</p>'}</article>`;
}
