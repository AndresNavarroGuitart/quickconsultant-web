"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AthleteClub = {
  id: string;
  startDate: string;
  endDate: string | null;
  sport: string;
  league: string | null;
  role: string | null;
  jerseyNumber: number | null;
  club: { id: string; name: string; city: string | null };
};

const SPORT_OPTIONS = [
  "Fútbol",
  "Hockey",
  "Tenis",
  "Rugby",
  "Natación",
  "Vóley",
  "Otro",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR");
}

export default function ClubesManager({
  initialClubs,
}: {
  initialClubs: AthleteClub[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [sport, setSport] = useState(SPORT_OPTIONS[0]);
  const [customSport, setCustomSport] = useState("");
  const [league, setLeague] = useState("");
  const [role, setRole] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setClubName("");
    setCity("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(true);
    setSport(SPORT_OPTIONS[0]);
    setCustomSport("");
    setLeague("");
    setRole("");
    setJerseyNumber("");
  }

  function handleEdit(ac: AthleteClub) {
    setError(null);
    setEditingId(ac.id);
    setClubName(ac.club.name);
    setCity(ac.club.city ?? "");
    setStartDate(ac.startDate.slice(0, 10));
    setIsCurrent(ac.endDate === null);
    setEndDate(ac.endDate ? ac.endDate.slice(0, 10) : "");
    if (SPORT_OPTIONS.includes(ac.sport)) {
      setSport(ac.sport);
      setCustomSport("");
    } else {
      setSport("Otro");
      setCustomSport(ac.sport);
    }
    setLeague(ac.league ?? "");
    setRole(ac.role ?? "");
    setJerseyNumber(ac.jerseyNumber !== null ? String(ac.jerseyNumber) : "");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      clubName,
      city: city || null,
      startDate,
      endDate: isCurrent ? null : endDate || null,
      sport: sport === "Otro" ? customSport : sport,
      league: league || null,
      role: role || null,
      jerseyNumber: jerseyNumber === "" ? null : Number(jerseyNumber),
    };

    const res = await fetch(
      editingId ? `/api/athlete-clubs/${editingId}` : "/api/athlete-clubs",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      setError(
        typeof responseBody.error === "string" ? responseBody.error : "No se pudo guardar"
      );
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/athlete-clubs/${id}`, { method: "DELETE" });

    setBusyId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo borrar");
      return;
    }

    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        {editingId && (
          <p className="text-sm font-medium text-brand-700 sm:col-span-2">
            Editando club
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Club</label>
          <input
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            required
            minLength={2}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Ciudad</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Hasta (opcional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isCurrent}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => {
                setIsCurrent(e.target.checked);
                if (e.target.checked) setEndDate("");
              }}
            />
            Actualmente
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Deporte</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {SPORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {sport === "Otro" && (
            <input
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              required
              placeholder="Especificá el deporte"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Campeonato/Liga
          </label>
          <input
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Posición (opcional)
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Titular, suplente, capitán..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Camiseta
          </label>
          <input
            type="number"
            min={0}
            max={999}
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar club"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {initialClubs.length === 0 && (
          <p className="text-sm text-slate-400">Todavía no cargaste clubes.</p>
        )}
        {initialClubs.map((ac) => (
          <div
            key={ac.id}
            className={`flex items-center justify-between rounded-md border bg-white px-4 py-3 ${
              editingId === ac.id ? "border-brand-300" : "border-slate-200"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {ac.club.name}
                {ac.club.city && (
                  <span className="text-slate-400"> · {ac.club.city}</span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(ac.startDate)} —{" "}
                {ac.endDate ? formatDate(ac.endDate) : "actualidad"}
                {` · ${ac.sport}`}
                {ac.league && ` · ${ac.league}`}
                {ac.role && ` · ${ac.role}`}
                {ac.jerseyNumber !== null && ` · #${ac.jerseyNumber}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => handleEdit(ac)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={busyId === ac.id}
                onClick={() => handleDelete(ac.id)}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
