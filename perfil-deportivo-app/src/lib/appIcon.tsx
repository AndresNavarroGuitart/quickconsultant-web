// Marca usada para el favicon, el apple-touch-icon y los iconos del manifest
// (acceso directo en el celular/PC). Reutiliza el mismo circulo+estrella de
// TeamShieldIllustration.tsx (recortado del escudo completo, viewBox 80 30 80
// 80 centra justo esa insignia) para que el icono de la app coincida con la
// identidad visual del resto del sitio, en vez de inventar un simbolo nuevo.
export function AppIconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3badea 0%, #114f92 100%)",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="80 30 80 80"
      >
        <circle cx="120" cy="70" r="26" fill="#ffffff" />
        <path
          d="M120 50l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z"
          fill="#f97316"
        />
      </svg>
    </div>
  );
}
