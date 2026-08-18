export default function SportSplashIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración de deportes: corredor, ciclista y nadador sobre manchas de color"
    >
      {/* Manchas de color, en dosis chicas y sueltas: la ilustración es el
          único lugar de la app donde el color se concentra; el resto del
          canvas queda blanco. */}
      <g opacity="0.85">
        <path
          d="M180 70c40-18 88-8 104 24 14 28-2 54-28 66-30 14-70 8-92-14-24-24-22-62 16-76Z"
          fill="var(--color-sport-yellow)"
        />
        <path
          d="M300 60c34-6 66 14 70 46 4 30-20 52-52 54-30 2-58-18-60-48-2-28 16-46 42-52Z"
          fill="var(--color-sport-pink)"
        />
        <path
          d="M340 170c30-10 62 6 70 34 8 26-10 50-38 58-26 8-54-4-64-30-10-26 4-54 32-62Z"
          fill="var(--color-sport-cyan)"
        />
        <path
          d="M120 190c-30 4-52 30-48 58 4 26 30 44 58 40 26-4 44-28 42-54-2-26-24-46-52-44Z"
          fill="var(--color-brand-400)"
        />
        <path
          d="M190 300c-26 10-38 40-26 64 12 24 42 34 66 22 22-10 32-38 22-60-10-24-38-36-62-26Z"
          fill="var(--color-sport-lime)"
        />
        <path
          d="M320 290c32-4 60 18 62 48 2 28-22 50-52 52-28 2-52-20-54-48-2-26 18-48 44-52Z"
          fill="var(--color-accent-400)"
        />
        <circle cx="250" cy="220" r="58" fill="var(--color-sport-red)" opacity="0.9" />
      </g>

      {/* Siluetas deportivas, simples y en negro, apoyadas sobre las manchas. */}
      <g fill="#111827">
        {/* Corredor */}
        <g transform="translate(150 150)">
          <circle cx="0" cy="-34" r="9" />
          <path d="M0 -24c-4 10-2 22 6 30l14 14-8 10-16-16c-10-10-14-24-10-38Z" />
          <path d="M6 6l16 10 14 26-10 6-14-24-18-10Z" />
          <path d="M4 4c-8 8-10 20-6 30l6 20-10 4-8-22c-6-16-2-30 8-40Z" />
          <path d="M-8 44l-16 22 8 8 18-20Z" />
        </g>

        {/* Nadador/buceador */}
        <g transform="translate(250 210)">
          <circle cx="-30" cy="-6" r="8" />
          <path d="M-24 -2c14 -6 30 -6 44 4 10 8 22 10 32 6l4 10c-14 6-28 4-40-6-10-8-22-8-32-2Z" />
          <path d="M-24 -2c-8 4-14 12-14 22h-10c0-14 8-26 20-32Z" />
        </g>

        {/* Ciclista (silueta simplificada de bici + ciclista) */}
        <g transform="translate(330 340)">
          <circle cx="-38" cy="10" r="16" fill="none" stroke="#111827" strokeWidth="4" />
          <circle cx="18" cy="10" r="16" fill="none" stroke="#111827" strokeWidth="4" />
          <path
            d="M-38 10l20-34h18l20 34M-18 -24h-14M0 -24l18 34"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="-14" cy="-40" r="7" />
          <path d="M-14 -33c-6 4-8 10-6 16l6 10-8 6-8-12c-4-8-2-18 6-24Z" />
        </g>

        {/* Jugador con raqueta */}
        <g transform="translate(190 350)">
          <circle cx="0" cy="-30" r="8" />
          <path d="M0 -22c-6 4-8 12-6 20l2 18-10 2-4-20c-2-12 2-22 12-28Z" />
          <path d="M2 -18l16-14 8 4-14 18Z" />
          <path
            d="M18 -32c8-8 20-8 26 0 6 8 4 18-4 24"
            fill="none"
            stroke="#111827"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M-4 -2l-14 8-4 26 10 2 6-22 12-6Z" />
        </g>
      </g>
    </svg>
  );
}
