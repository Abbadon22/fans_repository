import type { MapDataState } from "../hooks/useMapData";
import type { CustomMarker, MapConfig } from "../types";
import { ConnectionHelp } from "./ConnectionHelp";

interface MapSidebarProps {
  data: MapDataState;
  mapConfig: MapConfig | null;
  markers: CustomMarker[];
  placingMarker: boolean;
  onTogglePlacing: () => void;
  onRefresh: () => void;
}

export function MapSidebar({
  data,
  mapConfig,
  markers,
  placingMarker,
  onTogglePlacing,
  onRefresh,
}: MapSidebarProps) {
  const timeLabel = data.lastUpdate
    ? new Date(data.lastUpdate).toLocaleTimeString("ru-RU")
    : "—";

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Fans Server Map</h1>
        <p>
          7D2D · {data.apiMode === "vanilla" ? "Vanilla API" : data.apiMode === "alloc" ? "Alloc API" : "Web Dashboard"}
        </p>
      </header>

      {data.error &&
        (/ECONNREFUSED|Failed to fetch|NetworkError/i.test(data.error) && mapConfig ? (
          <ConnectionHelp host={mapConfig.serverHost} port={mapConfig.webPort} />
        ) : (
          <div className="alert error">{data.error}</div>
        ))}

      <section className="panel">
        <h2>Статус</h2>
        <p>Обновлено: {timeLabel}</p>
        <p>Онлайн: {data.online.length}</p>
        {data.stats?.players && (
          <p>
            Слоты: {data.stats.players.online} / {data.stats.players.max}
          </p>
        )}
        {data.stats?.gametime && (
          <p>
            Время в игре: {data.stats.gametime.days}д {data.stats.gametime.hours}ч{" "}
            {data.stats.gametime.minutes}м
          </p>
        )}
        <button type="button" onClick={onRefresh} disabled={data.loading}>
          {data.loading ? "Загрузка…" : "Обновить"}
        </button>
        <p className="muted map-hint">
          Серые тайлы — зона ещё не отрендерена. Включите EnableMapRendering и пройдитесь по миру
          или выполните visitmap в консоли сервера.
        </p>
      </section>

      <section className="panel">
        <h2>Игроки онлайн</h2>
        <ul className="player-list">
          {data.online.length === 0 && <li className="muted">Никого нет</li>}
          {data.online.map((p) => (
            <li key={p.steamid}>
              <span className="dot online" />
              {p.name}
              <span className="muted"> ({Math.round(p.position?.x ?? 0)}, {Math.round(p.position?.z ?? 0)})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Метки</h2>
        <button type="button" className={placingMarker ? "active" : ""} onClick={onTogglePlacing}>
          {placingMarker ? "Кликните на карту…" : "Добавить метку"}
        </button>
        <ul className="marker-list">
          {markers.map((m) => (
            <li key={m.id}>
              <span className="dot" style={{ background: m.color }} />
              {m.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel legend">
        <h2>Легенда</h2>
        <p><span className="dot online" /> Игрок онлайн</p>
        <p><span className="dot offline" /> Игрок оффлайн</p>
        <p><span className="dot hostile" /> Враг</p>
        <p><span className="swatch claim" /> Land claim</p>
        <p><span className="dot marker" /> Ваша метка</p>
      </section>
    </aside>
  );
}
