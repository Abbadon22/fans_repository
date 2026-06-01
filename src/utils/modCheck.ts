import type { ModCheckResult } from "../types";

/** Нормализация ответа бэкенда (совместимость со старыми версиями). */
export function normalizeModCheck(raw: ModCheckResult): ModCheckResult {
  return {
    ok: raw.ok,
    missing: raw.missing ?? [],
    removed: raw.removed ?? [],
    pending_install: raw.pending_install ?? 0,
    skipped_server: raw.skipped_server ?? 0,
  };
}
