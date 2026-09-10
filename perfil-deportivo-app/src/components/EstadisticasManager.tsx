"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeDetailedStats, type StatsMatchInput } from "@/lib/athlete/stats";
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

export default function EstadisticasManager({
  matches,
  sport,
}: {
  matches: MatchRow[];
  sport: string | null;
}) {
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
      Array.from(
        new Set(matches.map((m) => m.championship).filter((c): c is string => !!c))
      ).sort(),
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
      if (selectedOpponents.length > 0 && !selectedOpponents.includes(m.opponent))
        return false;
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

  const stats = computeDetailedStats(filteredMatches, sport);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MultiSelect
          label="Club"
          options={clubs.map((c) => ({ value: c.id, label: c.name }))}
          selected={selectedClubIds}
          onChange={setSelectedClubIds}
        />
        <MultiSelect
          label="Campeonato"
          options={championships.map((c) => ({ value: c, label: c }))}
          selected={selectedChampionships}
          onChange={setSelectedChampionships}
        />
        <MultiSelect
          label="Equipo rival"
          options={opponents.map((o) => ({ value: o, label: o }))}
          selected={selectedOpponents}
          onChange={setSelectedOpponents}
        />
        <MultiSelect
          label="Partido"
          options={matches.map((m) => ({
            value: m.id,
            label: `${formatDateOnly(m.matchDate)} · vs ${m.opponent}`,
          }))}
          selected={selectedMatchIds}
          onChange={setSelectedMatchIds}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="self-start text-xs font-medium text-slate-500 hover:text-red-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Partidos jugados" value={stats.matchesPlayed} />
        <StatTile label="Puntos totales" value={stats.totalPoints} />
        <StatTile label="Ganados" value={stats.wins} />
        <StatTile label="Empatados" value={stats.draws} />
        <StatTile label="Perdidos" value={stats.losses} />
        <StatTile label="Minutos jugados" value={stats.minutesPlayed} />
      </div>

      {stats.aggregated.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-700">
            Estadísticas detalladas
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.aggregated.map((a) => (
              <StatTile
                key={a.def.key}
                label={
                  a.def.type === "boolean"
                    ? `${a.def.label} (veces)`
                    : a.def.label
                }
                value={a.def.type === "percent" ? `${a.value}%` : a.value}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Option = { value: string; label: string };

// Desplegable con checkboxes: reemplaza las filas de "chips" que había antes.
// Cierra al clickear afuera o con Escape.
function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = selected.length;
  const disabled = options.length === 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className="flex items-center gap-1.5 truncate">
          {label}
          {count > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {count}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 max-h-60 w-full min-w-[180px] overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 block w-full rounded px-3 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              Limpiar ({selected.length})
            </button>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onChange(toggle(selected, opt.value))}
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-700">{value}</p>
    </div>
  );
}
