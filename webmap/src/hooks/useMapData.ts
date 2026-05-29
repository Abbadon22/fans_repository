import { useCallback, useEffect, useRef, useState } from "react";
import { MapApiError } from "../api/client";
import {
  detectApiMode,
  fetchHostiles,
  fetchLandClaims,
  fetchMapSettings,
  fetchPlayersLocation,
  fetchPlayersOnline,
  fetchStats,
  type ApiMode,
} from "../api/endpoints";
import type { MapConfig } from "../types";
import type {
  HostileEntity,
  LandClaim,
  OnlinePlayer,
  PlayerLocation,
  ServerStats,
} from "../types";

export interface MapDataState {
  online: OnlinePlayer[];
  locations: PlayerLocation[];
  claims: LandClaim[];
  hostiles: HostileEntity[];
  stats: ServerStats | null;
  apiMode: ApiMode | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const EMPTY: MapDataState = {
  online: [],
  locations: [],
  claims: [],
  hostiles: [],
  stats: null,
  apiMode: null,
  loading: true,
  error: null,
  lastUpdate: null,
};

/** Периодический опрос API карты (игроки, клеймы, враги). */
export function useMapData(config: MapConfig | null) {
  const [state, setState] = useState<MapDataState>(EMPTY);
  const [resolvedConfig, setResolvedConfig] = useState<MapConfig | null>(null);
  const running = useRef(false);
  const apiModeRef = useRef<ApiMode | null>(null);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;

    void (async () => {
      try {
        const mode = await detectApiMode(config);
        if (cancelled) return;
        apiModeRef.current = mode;
        const merged = await fetchMapSettings(config, mode);
        if (cancelled) return;
        setResolvedConfig(merged);
        setState((s) => ({ ...s, apiMode: mode, error: null }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: msg }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config]);

  const refresh = useCallback(async () => {
    const cfg = resolvedConfig;
    const mode = apiModeRef.current;
    if (!cfg || !mode || running.current) return;
    running.current = true;

    try {
      const [online, stats] = await Promise.all([
        fetchPlayersOnline(cfg, mode),
        fetchStats(cfg, mode).catch(() => null),
      ]);

      let locations: PlayerLocation[] = [];
      let claims: LandClaim[] = [];
      let hostiles: HostileEntity[] = [];

      if (cfg.showOfflinePlayers && mode === "alloc") {
        locations = await fetchPlayersLocation(cfg, mode).catch(() => []);
      } else if (cfg.showOfflinePlayers) {
        locations = online.map((p) => ({
          steamid: p.steamid,
          name: p.name,
          online: true,
          position: p.position,
        }));
      }

      if (cfg.showLandClaims) {
        claims = await fetchLandClaims(cfg, mode).catch(() => []);
      }

      if (cfg.showHostiles) {
        hostiles = await fetchHostiles(cfg, mode).catch(() => []);
      }

      setState({
        online: Array.isArray(online) ? online : [],
        locations,
        claims,
        hostiles,
        stats,
        apiMode: mode,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
      });
    } catch (e) {
      let msg =
        e instanceof MapApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);

      if (/ECONNREFUSED|Failed to fetch|NetworkError/i.test(msg)) {
        msg =
          `Нет соединения с Web Dashboard (${cfg.serverHost}:${cfg.webPort}). ` +
          "Откройте порт в панели хостинга.";
      } else if (/404/.test(msg) && mode === "alloc") {
        msg +=
          " Попробуйте apiMode: \"vanilla\" в config.json (у вас TFP Web Dashboard, не Alloc).";
      }

      setState((s) => ({
        ...s,
        loading: false,
        error: msg,
        lastUpdate: Date.now(),
      }));
    } finally {
      running.current = false;
    }
  }, [resolvedConfig]);

  useEffect(() => {
    if (!resolvedConfig || !apiModeRef.current) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), resolvedConfig.pollIntervalMs);
    return () => window.clearInterval(id);
  }, [resolvedConfig, refresh]);

  return { ...state, refresh, config: resolvedConfig };
}
