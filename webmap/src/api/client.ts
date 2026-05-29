import type { MapConfig } from "../types";
import { getApiBase } from "../config";

export class MapApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "MapApiError";
  }
}

/** HTTP-клиент к Web Dashboard / Alloc ServerMap API. */
export async function apiFetch<T>(
  config: MapConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getApiBase(config);
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init?.headers);
  if (config.apiTokenName && config.apiTokenSecret) {
    headers.set("X-SDTD-API-TOKENNAME", config.apiTokenName);
    headers.set("X-SDTD-API-SECRET", config.apiTokenSecret);
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    throw new MapApiError(
      `API ${path}: HTTP ${response.status}`,
      response.status,
    );
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
