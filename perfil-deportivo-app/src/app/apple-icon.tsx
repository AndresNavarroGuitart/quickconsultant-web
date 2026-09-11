import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/appIcon";

// 180x180 es el tamano estandar que espera iOS para "Agregar a inicio". Sin
// transparencia (iOS pinta negro atras si la hay): el fondo de AppIconMark ya
// es opaco.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconMark size={180} />, size);
}
