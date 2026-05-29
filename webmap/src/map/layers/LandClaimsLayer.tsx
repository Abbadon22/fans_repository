import L from "leaflet";
import { Rectangle, Tooltip } from "react-leaflet";
import { gameToLatLng } from "../coordinates";
import type { LandClaim } from "../../types";

interface LandClaimsLayerProps {
  claims: LandClaim[];
}

/** Слой land claim (прямоугольники). */
export function LandClaimsLayer({ claims }: LandClaimsLayerProps) {
  return (
    <>
      {claims.map((claim, i) => {
        const pos = claim.position;
        const size = claim.size ?? { x: 32, y: 1, z: 32 };
        const halfX = size.x / 2;
        const halfZ = size.z / 2;
        const bounds = L.latLngBounds(
          gameToLatLng(pos.x - halfX, pos.z - halfZ),
          gameToLatLng(pos.x + halfX, pos.z + halfZ),
        );

        return (
          <Rectangle
            key={`claim-${i}-${claim.owner}`}
            bounds={bounds}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
              weight: 2,
            }}
          >
            <Tooltip>
              {claim.name || claim.owner}
            </Tooltip>
          </Rectangle>
        );
      })}
    </>
  );
}
