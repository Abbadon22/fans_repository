import { useCallback, useEffect, useState } from "react";
import type { CustomMarker } from "../types";

const STORAGE_KEY = "fans-map-custom-markers";

function loadMarkers(): CustomMarker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomMarker[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Пользовательские метки (localStorage). */
export function useCustomMarkers() {
  const [markers, setMarkers] = useState<CustomMarker[]>([]);

  useEffect(() => {
    setMarkers(loadMarkers());
  }, []);

  const persist = useCallback((next: CustomMarker[]) => {
    setMarkers(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addMarker = useCallback(
    (title: string, x: number, z: number, color = "#f59e0b") => {
      const marker: CustomMarker = {
        id: crypto.randomUUID(),
        title,
        x,
        z,
        color,
        createdAt: Date.now(),
      };
      persist([...markers, marker]);
      return marker;
    },
    [markers, persist],
  );

  const removeMarker = useCallback(
    (id: string) => {
      persist(markers.filter((m) => m.id !== id));
    },
    [markers, persist],
  );

  return { markers, addMarker, removeMarker };
}
