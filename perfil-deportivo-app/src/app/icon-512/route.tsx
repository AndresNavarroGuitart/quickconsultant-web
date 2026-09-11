import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/appIcon";

// Ver comentario en icon-192/route.tsx (misma razon para nodejs en vez de edge).
export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<AppIconMark size={512} />, {
    width: 512,
    height: 512,
  });
}
