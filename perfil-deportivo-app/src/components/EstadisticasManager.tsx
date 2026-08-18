"use client";

import { useMemo, useState } from "react";
import { computeDetailedStats, type StatsMatchInput } from "@/lib/athlete/stats";
import { ALL_STAT_FIELDS } from "@/lib/athlete/positionStats";

type MatchRow = StatsMatchInput & {
  id: string;
  opponent: string;
  matchDate: string;
  club: { id: string; name: string } | null;
};

type Filter = "total" | "match" | "opponent" | "club";

const FILTER_LABEL: Record<Filter, string> = {
  total: "Total",
  match: "Por partido",
  opponent: "Por equipo",
  club: "Por club",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR");
}

export default function EstadisticasManager({ matches }: { matches: MatchRow[] }) {
  const [filter, setFilter] = useState<Filter>("total");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");

  const opponents = useMemo(
    () => Array.from(new Set(matches.map((m) => m.opponent))).sort(),
    [matches]
  );

  const clubs = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      if (m.club) map.set(m.club.id, m.club.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (filter === "match") {
      return selectedMatchId ? matches.filter((m) => m.id === selectedMatchId) : [];
    }
    if (filter === "opponent") {
      return selectedOpponent
        ? matches.filter((m) => m.opponent === selectedOpponent)
        : [];
    }
    if (filter === "club") {
      return selectedClubId
        ? matches.filter((m) => m.club?.id === selectedClubId)
        : [];
    }
    return matches;
  }, [filter, matches, selectedMatchId, selectedOpponent, selectedClubId]);

  const stats = computeDetailedStats(filteredMatches);
  const statTiles = ALL_STAT_FIELDS.filter(
    (f) => f.type === "number" && (stats.statSums[f.key] ?? 0) > 0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABEL) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === key
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700"
            }`}
          >
            {FILTER_LABEL[key]}
          </button>
        ))}
      </div>

      {filter === "match" && (
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
        >
          <option value="">Elegí un partido</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {formatDate(m.matchDate)} · vs {m.opponent}
            </option>
          ))}
        </select>
      )}

      {filter === "opponent" && (
        <select
          value={selectedOpponent}
          onChange={(e) => setSelectedOpponent(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
        >
          <option value="">Elegí un equipo rival</option>
          {opponents.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {filter === "club" && (
        <select
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
        >
          <option value="">Elegí un club</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Partidos jugados" value={stats.matchesPlayed} />
        <StatTile label="Puntos totales" value={stats.totalPoints} />
        <StatTile label="Ganados" value={stats.wins} />
        <StatTile label="Empatados" value={stats.draws} />
        <StatTile label="Perdidos" value={stats.losses} />
        <StatTile label="Minutos jugados" value={stats.minutesPlayed} />
        {stats.cleanSheets > 0 && (
          <StatTile label="Vallas invictas" value={stats.cleanSheets} />
        )}
      </div>

      {statTiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-700">
            Estadísticas detalladas
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statTiles.map((f) => (
              <StatTile key={f.key} label={f.label} value={stats.statSums[f.key] ?? 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}
