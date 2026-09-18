import type { NextConfig } from "next";

// Origen de Supabase: el browser le habla directo para auth (login/signup/
// logout/cambio de password usan @supabase/ssr del lado del cliente) y para
// mostrar fotos del bucket de Storage -- sin esto la CSP rompe ambas cosas.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";
const isDev = process.env.NODE_ENV === "development";

// La app no usa scripts de terceros (sin GTM/analytics) ni
// dangerouslySetInnerHTML en ningun lado, pero el propio Next.js App Router
// necesita 'unsafe-inline' en script-src para sus scripts inline de
// streaming/hidratacion cuando no se usa el esquema de nonces (que exige
// desactivar el prerenderizado estatico de todas las paginas -- no vale la
// pena el costo de performance para esta app). 'unsafe-eval' solo hace
// falta en desarrollo, para el overlay de errores de React.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""};
  font-src 'self';
  connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

// Headers de seguridad aplicados a todas las respuestas.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // camera=self: la carga de fotos por partido usa la camara del celular.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
