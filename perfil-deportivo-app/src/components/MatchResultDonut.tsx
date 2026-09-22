const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Separacion visual entre segmentos (en unidades del perimetro, no px).
const GAP = 3;

// Mismos colores que ya se usan para Ganado/Empate/Perdido en Partidos y en
// el historial de Estadisticas (RESULT_BADGE), para que el gráfico use el
// mismo código de color que el resto de la pantalla.
const SEGMENTS = [
  { key: "wins", label: "Ganados", stroke: "stroke-green-600", dot: "bg-green-600" },
  { key: "draws", label: "Empatados", stroke: "stroke-amber-500", dot: "bg-amber-500" },
  { key: "losses", label: "Perdidos", stroke: "stroke-red-600", dot: "bg-red-600" },
] as const;

export default function MatchResultDonut({
  wins,
  draws,
  losses,
}: {
  wins: number;
  draws: number;
  losses: number;
}) {
  const values = { wins, draws, losses };
  const total = wins + draws + losses;
  const present = SEGMENTS.filter((s) => values[s.key] > 0);
  const available = CIRCUMFERENCE - (present.length > 1 ? GAP * present.length : 0);

  const arcs = present.reduce<
    Array<(typeof present)[number] & { length: number; offset: number; value: number }>
  >((acc, s) => {
    const length = (values[s.key] / total) * available;
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.length + GAP : 0;
    return [...acc, { ...s, length, offset, value: values[s.key] }];
  }, []);

  return (
    <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={`${wins} partidos ganados, ${draws} empatados y ${losses} perdidos, de ${total} jugados en total`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-slate-100"
          />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
              strokeDashoffset={-a.offset}
              className={a.stroke}
            >
              <title>{`${a.label}: ${a.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-brand-700">{total}</span>
          <span className="text-[10px] text-slate-500">
            {total === 1 ? "Partido" : "Partidos"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <span className="font-semibold text-slate-900">{values[s.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
