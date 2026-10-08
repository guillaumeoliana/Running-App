import type { SportCoreApi } from "./stride";

declare global {
  interface Window {
    STRIDE_SNAPSHOT?: Record<string, unknown>;
    SportCore: SportCoreApi;
    Stride?: {
      getState: () => unknown;
      getData: () => unknown;
      navigate: (page: string) => void;
    };
  }
}

export {};
