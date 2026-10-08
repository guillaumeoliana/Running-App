export interface SportCoreApi {
  START: string;
  addDays: (date: string, days: number) => string;
  pace: (secondsPerKm: number) => string;
  time: (seconds: number) => string;
  paces: Record<string, [number, number]>;
  plan: () => unknown[];
  firstWeekCurrent: (plan: unknown[]) => unknown[];
  duration: (session: any, ranges?: any) => number;
  distance: (session: any, ranges?: any) => number;
  sRPE: (minutes: number, rpe: number) => number;
  readiness: (checkin: any, health: any, hrvBaseline?: number) => any;
  e1rm: (kg: number, reps: number) => number | null;
  volume: (log: any) => number;
  toCourse: (session: any, ranges?: any) => unknown;
}
