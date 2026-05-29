import L from "leaflet";

/** Игровые координаты (x, z) → Leaflet LatLng (как в Alloc / legacymap). */
export function gameToLatLng(x: number, z: number): L.LatLng {
  return L.latLng(-z, x);
}

/** Leaflet LatLng → игровые координаты. */
export function latLngToGame(latlng: L.LatLng): { x: number; z: number } {
  return { x: latlng.lng, z: -latlng.lat };
}

/**
 * CRS как в Alloc ServerMap (map.js): transformation (1, 0, -1, 0).
 * @see https://7dtd.illy.bz/wiki/Integrated%20Webserver
 */
export function createMapCrs() {
  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, -1, 0),
    scale(zoom: number) {
      return Math.pow(2, zoom);
    },
    zoom(scale: number) {
      return Math.log(scale) / Math.LN2;
    },
  });
}

/** Границы мира по размеру карты (игровые координаты → lat/lng). */
export function createMapBounds(mapSize: number): L.LatLngBounds {
  const half = mapSize / 2;
  return L.latLngBounds(
    L.latLng(-half, -half),
    L.latLng(half, half),
  );
}

/** Центр карты в координатах Leaflet (спавн ≈ 0,0 в мире). */
export function mapCenterLatLng(): L.LatLng {
  return L.latLng(0, 0);
}
