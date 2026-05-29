import { useEffect, useState } from "react";
import { loadMapConfig } from "./config";
import { MapSidebar } from "./components/MapSidebar";
import { GameMap } from "./map/GameMap";
import { useCustomMarkers } from "./hooks/useCustomMarkers";
import { useMapData } from "./hooks/useMapData";
import type { MapConfig } from "./types";

export default function App() {
  const [config, setConfig] = useState<MapConfig | null>(null);
  const [placingMarker, setPlacingMarker] = useState(false);
  const { markers, addMarker, removeMarker } = useCustomMarkers();
  const { config: mapConfig, ...data } = useMapData(config);

  useEffect(() => {
    void loadMapConfig().then(setConfig);
  }, []);

  if (!config || !mapConfig) {
    return <div className="loading-screen">Загрузка конфигурации карты…</div>;
  }

  return (
    <div className="app-layout">
      <MapSidebar
        data={data}
        mapConfig={mapConfig}
        markers={markers}
        placingMarker={placingMarker}
        onTogglePlacing={() => setPlacingMarker((v) => !v)}
        onRefresh={() => void data.refresh()}
      />
      <main className="map-pane">
        <GameMap
          config={mapConfig}
          data={data}
          markers={markers}
          onAddMarker={(title, x, z) => {
            addMarker(title, x, z);
            setPlacingMarker(false);
          }}
          onRemoveMarker={removeMarker}
          placingMarker={placingMarker}
        />
      </main>
    </div>
  );
}
