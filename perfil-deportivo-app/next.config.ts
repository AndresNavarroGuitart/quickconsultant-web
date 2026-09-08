import type { NextConfig } from "next";

// Headers de seguridad aplicados a todas las respuestas. No incluyen un
// Content-Security-Policy: Next.js/Tailwind inyectan estilos y scripts
// inline en el render, y armar una CSP estricta sin romperlos requiere mas
// pruebas de las que da esta pasada — queda para una iteracion aparte.
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
