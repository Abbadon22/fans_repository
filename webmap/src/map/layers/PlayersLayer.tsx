import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import { gameToLatLng } from "../coordinates";
import type { OnlinePlayer, PlayerLocation } from "../../types";

interface PlayersLayerProps {
  online: OnlinePlayer[];
  locations: PlayerLocation[];
  showOffline: boolean;
}

/** Слой игроков: онлайн (зелёный) и оффлайн (серый). */
export function PlayersLayer({ online, locations, showOffline }: PlayersLayerProps) {
  const onlineIds = new Set(online.map((p) => p.steamid));

  return (
    <>
      {online.map((p) => {
        const pos = p.position;
        if (!pos) return null;
        return (
          <CircleMarker
            key={`on-${p.steamid}`}
            center={gameToLatLng(pos.x, pos.z)}
            radius={7}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.85, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {p.name} (HP {p.health}, ping {p.ping}ms)
            </Tooltip>
            <Popup>
              <strong>{p.name}</strong>
              <br />
              Уровень: {p.level}
              <br />
              X: {Math.round(pos.x)}, Z: {Math.round(pos.z)}
            </Popup>
          </CircleMarker>
        );
      })}

      {showOffline &&
        locations
          .filter((p) => !onlineIds.has(p.steamid) && p.position)
          .map((p) => (
            <CircleMarker
              key={`off-${p.steamid}`}
              center={gameToLatLng(p.position.x, p.position.z)}
              radius={5}
              pathOptions={{ color: "#6b7280", fillColor: "#6b7280", fillOpacity: 0.6, weight: 1 }}
            >
              <Tooltip>{p.name} (оффлайн)</Tooltip>
            </CircleMarker>
          ))}
    </>
  );
}
