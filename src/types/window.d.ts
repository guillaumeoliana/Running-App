import type { SportCoreApi } from "./stride";

declare global {
  interface Window {
    supabase?: { createClient: (url: string, key: string, options?: unknown) => any };
    STRIDE_SNAPSHOT: Record<string, unknown>;
    SportCore: SportCoreApi;
    Stride?: {
      getState: () => unknown;
      getData: () => unknown;
      navigate: (page: string) => void;
    };
  }
}

export {};
