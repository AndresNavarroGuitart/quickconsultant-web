"use client";

import { useEffect, useRef } from "react";
import { formatDateOnly } from "@/lib/format";

type MatchResult = "WIN" | "LOSS" | "DRAW" | "NOT_STARTED";

type HistoryMatch = {
  id: string;
  opponent: string;
  matchDate: string;
  result: MatchResult;
  homeScore: number | null;
  awayScore: number | null;
  club: { name: string; logoUrl: string | null } | null;
};

const RESULT_BADGE: Record<MatchResult, { label: string; className: string }> = {
  WIN: { label: "Ganado", className: "bg-green-100 text-green-700" },
  LOSS: { label: "Perdido", className: "bg-red-100 text-red-700" },
  DRAW: { label: "Empate", className: "bg-yellow-100 text-yellow-800" },
  NOT_STARTED: { label: "Sin iniciar", className: "bg-slate-100 text-slate-500" },
};

function ClubBadge({ club }: { club: HistoryMatch["club"] }) {
  if (!club) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
        –
      </div>
    );
  }

  if (club.logoUrl) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700"
      title={club.name}
    >
      {club.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MatchHistoryCarousel({ matches }: { matches: HistoryMatch[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // La lista siempre se arma de mas viejo (izquierda) a mas nuevo (derecha);
  // al montar (o cuando cambian los partidos) la arrancamos scrolleada del
  // todo a la derecha para que se vean los ultimos por default, y el resto
  // queda oculto a la izquierda hasta que el usuario mueva la barra.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [matches]);

  if (matches.length === 0) {
    return <p className="text-sm text-slate-400">Todavía no cargaste partidos.</p>;
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto rounded-md border border-slate-200 bg-white p-4"
    >
      {matches.map((m) => {
        const badge = RESULT_BADGE[m.result];
        const hasScore = m.homeScore !== null && m.awayScore !== null;
        return (
          <div
            key={m.id}
            className="flex w-[132px] flex-none flex-col items-center gap-1.5 rounded-md border border-slate-100 px-3 py-3 text-center"
          >
            <ClubBadge club={m.club} />
            {hasScore && (
              <span className="text-xl font-bold tabular-nums text-slate-900">
                {m.homeScore}-{m.awayScore}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
              {badge.label}
            </span>
            <span className="w-full truncate text-xs font-semibold text-slate-900" title={m.opponent}>
              vs {m.opponent}
            </span>
            <span className="text-[10px] text-slate-400">{formatDateOnly(m.matchDate)}</span>
          </div>
        );
      })}
    </div>
  );
}
