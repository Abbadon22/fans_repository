import { apiFetch } from "./client";
import type { MapConfig } from "../types";

export type ApiMode = "vanilla" | "alloc";

/** Определить тип API: vanilla (TFP v2.1+) или legacy Alloc. */
export async function detectApiMode(config: MapConfig): Promise<ApiMode> {
  if (config.apiMode === "vanilla" || config.apiMode === "alloc") {
    return config.apiMode;
  }

  try {
    await apiFetch<unknown>(config, "/api/player");
    return "vanilla";
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) {
      return "alloc";
    }
  }

  try {
    await apiFetch<unknown>(config, "/api/getplayersonline");
    return "alloc";
  } catch {
    return "vanilla";
  }
}
