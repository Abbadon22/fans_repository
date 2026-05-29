import { CircleMarker, Tooltip } from "react-leaflet";
import { gameToLatLng } from "../coordinates";
import type { HostileEntity } from "../../types";

interface HostilesLayerProps {
  hostiles: HostileEntity[];
}

/** Слой враждебных сущностей. */
export function HostilesLayer({ hostiles }: HostilesLayerProps) {
  return (
    <>
      {hostiles.map((h) => (
        <CircleMarker
          key={`hostile-${h.entityid}`}
          center={gameToLatLng(h.position.x, h.position.z)}
          radius={4}
          pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.7, weight: 1 }}
        >
          <Tooltip>{h.name}</Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
