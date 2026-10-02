import { Platform } from "react-native";

/**
 * Tipo de navegación inferior que usa un Android.
 */
export type NavStyle = "gesture" | "buttons" | "none";

export interface NavigationInfo {
  style: NavStyle;
  /** true solo en Android con navegación por gestos. */
  usesGestures: boolean;
}

/**
 * Detecta automáticamente el modo de navegación inferior del Android.
 *
 * Android no expone una API pública para preguntar si el aparelho usa gestos o
 * botones clásicos. La heurística estándar se basa en el inset inferior que
 * reporta el SO a través del Safe Area:
 *
 *  - Gestos: la píldora flota sobre el contenido y se puede ocultar, por lo
 *    que el OS reporta un inset bottom ~0.
 *  - Botones: hay una barra persistente y el OS reserva su altura (≈24px+).
 *
 * En iOS y en React Native Web no existe esta barra inferior gestionable, por
 * lo que se devuelve `none` y la interfaz no crea espacios artificiales.
 */
export function resolveNavigation(bottomInset: number): NavigationInfo {
  const os = Platform.OS;
  if (os !== "android") {
    return { style: "none", usesGestures: false };
  }
  const usesGestures = bottomInset <= 1;
  return { style: usesGestures ? "gesture" : "buttons", usesGestures };
}