export const COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brasil" },
  { code: "UY", name: "Uruguay" },
  { code: "CL", name: "Chile" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "PE", name: "Perú" },
  { code: "CO", name: "Colombia" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
  { code: "IT", name: "Italia" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Alemania" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Reino Unido" },
  { code: "NL", name: "Países Bajos" },
  { code: "CA", name: "Canadá" },
  { code: "JP", name: "Japón" },
  { code: "CN", name: "China" },
] as const;

export function countryFlagEmoji(code: string | null | undefined): string | null {
  if (!code || code.length !== 2) return null;
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
