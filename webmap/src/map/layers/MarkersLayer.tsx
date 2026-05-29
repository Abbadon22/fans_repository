import { CircleMarker, Popup } from "react-leaflet";
import { gameToLatLng } from "../coordinates";
import type { CustomMarker } from "../../types";

interface MarkersLayerProps {
  markers: CustomMarker[];
  onRemove: (id: string) => void;
}

/** Пользовательские метки. */
export function MarkersLayer({ markers, onRemove }: MarkersLayerProps) {
  return (
    <>
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={gameToLatLng(m.x, m.z)}
          radius={6}
          pathOptions={{
            color: m.color,
            fillColor: m.color,
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <strong>{m.title}</strong>
            <br />
            X: {Math.round(m.x)}, Z: {Math.round(m.z)}
            <br />
            <button type="button" onClick={() => onRemove(m.id)}>
              Удалить
            </button>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
