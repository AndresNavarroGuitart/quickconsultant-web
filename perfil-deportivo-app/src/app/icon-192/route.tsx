import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/appIcon";

// Ruta fija (no el file convention `icon.tsx`) para tener una URL estable
// que referenciar desde manifest.ts -- el "acceso directo" en Android/PC
// necesita 192x192 y 512x512 explicitos en el manifest. Nodejs a proposito
// (no edge): el bundler de Edge Functions de Netlify es fragil en este
// proyecto (ver notas de proxy.ts), asi que se evita por completo.
export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<AppIconMark size={192} />, {
    width: 192,
    height: 192,
  });
}
