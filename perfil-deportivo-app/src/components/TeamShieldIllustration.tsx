export default function TeamShieldIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 280"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Escudo deportivo con los colores de la marca"
    >
      <defs>
        <clipPath id="shieldClip">
          <path d="M120,8 L212,42 C212,42 214,140 214,150 C214,214 120,272 120,272 C120,272 26,214 26,150 C26,140 28,42 28,42 Z" />
        </clipPath>
      </defs>

      {/* Relleno recortado a la forma del escudo, con las mismas bandas
          onduladas que el resto de la identidad (WavyBanner). */}
      <g clipPath="url(#shieldClip)">
        <rect x="0" y="0" width="240" height="280" fill="var(--color-brand-700)" />
        {/* Cada banda se extiende hasta el borde inferior real (y=280), no
            hasta una línea intermedia: así los picos de la onda nunca dejan
            asomar la banda de atrás, sin importar la amplitud de la curva. */}
        <path
          d="M0,80 C40,50 80,110 120,80 C160,50 200,110 240,80 L240,280 L0,280 Z"
          fill="var(--color-brand-500)"
        />
        <path
          d="M0,150 C40,120 80,180 120,150 C160,120 200,180 240,150 L240,280 L0,280 Z"
          fill="var(--color-brand-400)"
        />
        <path
          d="M0,215 C40,195 80,235 120,215 C160,195 200,235 240,215 L240,280 L0,280 Z"
          fill="var(--color-accent-500)"
        />
        <circle cx="120" cy="70" r="26" fill="#ffffff" />
        <path
          d="M120 50l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z"
          fill="var(--color-accent-500)"
        />
      </g>

      {/* Contorno del escudo. */}
      <path
        d="M120,8 L212,42 C212,42 214,140 214,150 C214,214 120,272 120,272 C120,272 26,214 26,150 C26,140 28,42 28,42 Z"
        fill="none"
        stroke="var(--color-brand-900)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
