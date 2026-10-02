import { useCallback, useEffect, useRef, useState } from 'react';

interface MapReadyState {
  mapReady: boolean;
  mapFailed: boolean;
  handleMapReady: () => void;
}

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Detecta se o mapa chegou a renderizar.
 *
 * No Android o Google Maps desenha a superfície mesmo quando os tiles não
 * carregam (chave expirada, sem internet ou Play Services desatualizado).
 * `onMapReady` não dispara nesse caso, então um timeout é a única forma de
 * avisar o usuário em vez de deixar um retângulo preto na tela.
 */
export function useMapReady(timeoutMs: number = DEFAULT_TIMEOUT_MS): MapReadyState {
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mapReady) clear();
    return clear;
  }, [mapReady, clear]);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setMapFailed(true);
    }, timeoutMs);

    return clear;
  }, [clear, timeoutMs]);

  const handleMapReady = useCallback(() => {
    clear();
    setMapReady(true);
    setMapFailed(false);
  }, [clear]);

  return { mapReady, mapFailed, handleMapReady };
}