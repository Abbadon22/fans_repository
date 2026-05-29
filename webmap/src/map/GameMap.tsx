import { useMemo } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { MapConfig } from "../types";
import type { MapDataState } from "../hooks/useMapData";
import type { CustomMarker } from "../types";
import { createMapBounds, createMapCrs, mapCenterLatLng } from "./coordinates";
import { mapTileUrlTemplate } from "../api/endpoints";
import { HostilesLayer } from "./layers/HostilesLayer";
import { LandClaimsLayer } from "./layers/LandClaimsLayer";
import { MarkersLayer } from "./layers/MarkersLayer";
import { PlayersLayer } from "./layers/PlayersLayer";
import { latLngToGame } from "./coordinates";

interface GameMapProps {
  config: MapConfig;
  data: MapDataState;
  markers: CustomMarker[];
  onAddMarker: (title: string, x: number, z: number) => void;
  onRemoveMarker: (id: string) => void;
  placingMarker: boolean;
}

function MapClickHandler({
  placing,
  onPick,
}: {
  placing: boolean;
  onPick: (x: number, z: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!placing) return;
      const { x, z } = latLngToGame(e.latlng);
      onPick(x, z);
    },
  });
  return null;
}

/** Основная Leaflet-карта (тайлы как в legacymap: tileSize=128, tms=true). */
export function GameMap({
  config,
  data,
  markers,
  onAddMarker,
  onRemoveMarker,
  placingMarker,
}: GameMapProps) {
  const crs = useMemo(() => createMapCrs(), []);
  const bounds = useMemo(() => createMapBounds(config.mapSize), [config.mapSize]);
  const center = useMemo(() => mapCenterLatLng(), []);

  return (
    <MapContainer
      crs={crs}
      center={center}
      zoom={2}
      minZoom={0}
      maxZoom={config.maxZoom}
      maxBounds={bounds}
      maxBoundsViscosity={1}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url={mapTileUrlTemplate(config)}
        tileSize={config.mapBlockSize}
        tms
        minZoom={0}
        maxZoom={config.maxZoom}
        minNativeZoom={0}
        maxNativeZoom={config.maxZoom}
        noWrap
        bounds={bounds}
      />

      <MapClickHandler
        placing={placingMarker}
        onPick={(x, z) => {
          const title = window.prompt("Название метки:", "Метка");
          if (title) onAddMarker(title, x, z);
        }}
      />

      <PlayersLayer
        online={data.online}
        locations={data.locations}
        showOffline={config.showOfflinePlayers}
      />
      {config.showLandClaims && <LandClaimsLayer claims={data.claims} />}
      {config.showHostiles && <HostilesLayer hostiles={data.hostiles} />}
      <MarkersLayer markers={markers} onRemove={onRemoveMarker} />
    </MapContainer>
  );
}
