"use client";

import { useMemo, useState } from "react";
import { computeDetailedStats, type StatsMatchInput } from "@/lib/athlete/stats";
import { ALL_STAT_FIELDS } from "@/lib/athlete/positionStats";
import { formatDateOnly } from "@/lib/format";

type MatchRow = StatsMatchInput & {
  id: string;
  opponent: string;
  matchDate: string;
  championship: string | null;
  club: { id: string; name: string } | null;
};

// Los 4 filtros se combinan entre si (AND) y cada uno acepta elegir varios
// valores a la vez (OR dentro del mismo filtro): ej. Club "A" u "B", Y
// Campeonato "Liga 2026", da los partidos de A o B que fueron de esa liga.
function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function EstadisticasManager({ matches }: { matches: MatchRow[] }) {
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [selectedChampionships, setSelectedChampionships] = useState<string[]>([]);

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

  const championships = useMemo(
    () =>
      Array.from(new Set(matches.map((m) => m.championship).filter((c): c is string => !!c))).sort(),
    [matches]
  );

  const hasFilters =
    selectedMatchIds.length > 0 ||
    selectedOpponents.length > 0 ||
    selectedClubIds.length > 0 ||
    selectedChampionships.length > 0;

  function clearFilters() {
    setSelectedMatchIds([]);
    setSelectedOpponents([]);
    setSelectedClubIds([]);
    setSelectedChampionships([]);
  }

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedMatchIds.length > 0 && !selectedMatchIds.includes(m.id)) return false;
      if (selectedOpponents.length > 0 && !selectedOpponents.includes(m.opponent)) return false;
      if (
        selectedClubIds.length > 0 &&
        (!m.club || !selectedClubIds.includes(m.club.id))
      )
        return false;
      if (
        selectedChampionships.length > 0 &&
        (!m.championship || !selectedChampionships.includes(m.championship))
      )
        return false;
      return true;
    });
  }, [matches, selectedMatchIds, selectedOpponents, selectedClubIds, selectedChampionships]);

  const stats = computeDetailedStats(filteredMatches);
  const statTiles = ALL_STAT_FIELDS.filter(
    (f) => f.type === "number" && (stats.statSums[f.key] ?? 0) > 0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {clubs.length > 0 && (
          <FilterGroup label="Por club">
            {clubs.map((c) => (
              <FilterChip
                key={c.id}
                active={selectedClubIds.includes(c.id)}
                onClick={() => setSelectedClubIds((prev) => toggle(prev, c.id))}
              >
                {c.name}
              </FilterChip>
            ))}
          </FilterGroup>
        )}

        {championships.length > 0 && (
          <FilterGroup label="Por campeonato">
            {championships.map((c) => (
              <FilterChip
                key={c}
                active={selectedChampionships.includes(c)}
                onClick={() => setSelectedChampionships((prev) => toggle(prev, c))}
              >
                {c}
              </FilterChip>
            ))}
          </FilterGroup>
        )}

        {opponents.length > 0 && (
          <FilterGroup label="Por equipo">
            {opponents.map((o) => (
              <FilterChip
                key={o}
                active={selectedOpponents.includes(o)}
                onClick={() => setSelectedOpponents((prev) => toggle(prev, o))}
              >
                {o}
              </FilterChip>
            ))}
          </FilterGroup>
        )}

        {matches.length > 0 && (
          <FilterGroup label="Por partido">
            {matches.map((m) => (
              <FilterChip
                key={m.id}
                active={selectedMatchIds.includes(m.id)}
                onClick={() => setSelectedMatchIds((prev) => toggle(prev, m.id))}
              >
                {formatDateOnly(m.matchDate)} · vs {m.opponent}
              </FilterChip>
            ))}
          </FilterGroup>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-xs font-medium text-slate-500 hover:text-red-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

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

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "border border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
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
