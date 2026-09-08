"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPositionsForSport } from "@/lib/athlete/positions";
import { getStatFieldsForPosition, type MatchStatKey } from "@/lib/athlete/positionStats";
import MatchPhotos from "@/components/MatchPhotos";
import { formatDateOnly } from "@/lib/format";

type ClubOption = { id: string; name: string };

type MatchResult = "WIN" | "LOSS" | "DRAW";
type MatchCondition = "LOCAL" | "VISITANTE";

type MatchStats = Partial<Record<MatchStatKey, number | boolean | null>>;

type Match = {
  id: string;
  opponent: string;
  matchDate: string;
  result: MatchResult;
  condition: MatchCondition | null;
  pointsScored: number;
  championship: string | null;
  notes: string | null;
  position: string | null;
  minutesPlayed: number | null;
  club: { id: string; name: string } | null;
  photos: { id: string; url: string }[];
} & MatchStats;

const RESULT_LABEL: Record<MatchResult, string> = {
  WIN: "Ganado",
  LOSS: "Perdido",
  DRAW: "Empate",
};

export default function PartidosManager({
  initialMatches,
  clubOptions,
  sport,
}: {
  initialMatches: Match[];
  clubOptions: ClubOption[];
  sport: string | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const positionOptions = getPositionsForSport(sport);

  // El form de alta/edicion arranca oculto: solo se ve el boton "Agregar
  // partido", que lo despliega. Al guardar, cancelar o borrar el partido en
  // edicion se vuelve a ocultar (ver resetForm).
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState("");
  const [clubId, setClubId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [result, setResult] = useState<MatchResult>("WIN");
  const [condition, setCondition] = useState<MatchCondition | "">("");
  const [pointsScored, setPointsScored] = useState("0");
  const [championship, setChampionship] = useState("");
  const [notes, setNotes] = useState("");
  const [position, setPosition] = useState("");
  const [minutesPlayed, setMinutesPlayed] = useState("");
  const [statValues, setStatValues] = useState<Record<string, string>>({});
  const [statBooleans, setStatBooleans] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeStatFields = getStatFieldsForPosition(position);

  function handlePositionChange(value: string) {
    setPosition(value);
    setStatValues({});
    setStatBooleans({});
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setOpponent("");
    setClubId("");
    setMatchDate("");
    setResult("WIN");
    setCondition("");
    setPointsScored("0");
    setChampionship("");
    setNotes("");
    handlePositionChange("");
    setMinutesPlayed("");
  }

  function handleEdit(m: Match) {
    setError(null);
    setShowForm(true);
    setEditingId(m.id);
    setOpponent(m.opponent);
    setClubId(m.club?.id ?? "");
    setMatchDate(m.matchDate.slice(0, 10));
    setResult(m.result);
    setCondition(m.condition ?? "");
    setPointsScored(String(m.pointsScored));
    setChampionship(m.championship ?? "");
    setNotes(m.notes ?? "");
    setPosition(m.position ?? "");
    setMinutesPlayed(m.minutesPlayed !== null ? String(m.minutesPlayed) : "");

    const fields = getStatFieldsForPosition(m.position);
    const values: Record<string, string> = {};
    const booleans: Record<string, boolean> = {};
    for (const field of fields) {
      const value = m[field.key];
      if (field.type === "boolean") {
        booleans[field.key] = value === true;
      } else if (typeof value === "number") {
        values[field.key] = String(value);
      }
    }
    setStatValues(values);
    setStatBooleans(booleans);

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const statsPayload: Record<string, number | boolean | null> = {};
    for (const field of activeStatFields) {
      if (field.type === "boolean") {
        statsPayload[field.key] = statBooleans[field.key] ?? false;
      } else {
        const raw = statValues[field.key] ?? "";
        statsPayload[field.key] = raw === "" ? null : Number(raw);
      }
    }

    const res = await fetch(
      editingId ? `/api/matches/${editingId}` : "/api/matches",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent,
          clubId: clubId || null,
          matchDate,
          result,
          condition: condition || null,
          pointsScored: Number(pointsScored) || 0,
          championship: championship || null,
          notes: notes || null,
          position: position || null,
          minutesPlayed: minutesPlayed === "" ? null : Number(minutesPlayed),
          ...statsPayload,
        }),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo guardar");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });

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
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Agregar partido
        </button>
      )}

      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          {editingId && (
            <p className="text-sm font-medium text-brand-700 sm:col-span-2">
              Editando partido
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Contrincante
            </label>
            <input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Club (opcional)
            </label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Sin club</option>
              {clubOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Campeonato (opcional)
            </label>
            <input
              value={championship}
              onChange={(e) => setChampionship(e.target.value)}
              placeholder="Torneo Apertura, Liga local..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Posición
            </label>
            <select
              value={position}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Sin especificar</option>
              {positionOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Minutos jugados
            </label>
            <input
              type="number"
              min={0}
              max={600}
              value={minutesPlayed}
              onChange={(e) => setMinutesPlayed(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Fecha</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Resultado
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as MatchResult)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="WIN">Ganado</option>
              <option value="LOSS">Perdido</option>
              <option value="DRAW">Empate</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Condición
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as MatchCondition | "")}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Sin especificar</option>
              <option value="LOCAL">Local</option>
              <option value="VISITANTE">Visitante</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Puntos</label>
            <input
              type="number"
              min={0}
              value={pointsScored}
              onChange={(e) => setPointsScored(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {activeStatFields.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-slate-200 border-l-4 border-l-brand-500 bg-white p-3 sm:col-span-2">
              <p className="text-xs font-medium text-brand-700">
                Estadísticas de {position.toLowerCase()}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {activeStatFields.map((field) =>
                  field.type === "boolean" ? (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-3"
                    >
                      <input
                        type="checkbox"
                        checked={statBooleans[field.key] ?? false}
                        onChange={(e) =>
                          setStatBooleans((prev) => ({
                            ...prev,
                            [field.key]: e.target.checked,
                          }))
                        }
                      />
                      {field.label}
                    </label>
                  ) : (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-500">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={statValues[field.key] ?? ""}
                        onChange={(e) =>
                          setStatValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar partido"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {initialMatches.length === 0 && (
          <p className="text-sm text-slate-400">Todavía no cargaste partidos.</p>
        )}
        {initialMatches.map((m) => {
          const fields = getStatFieldsForPosition(m.position);
          const summary = fields
            .filter((f) => {
              const value = m[f.key];
              return f.type === "boolean" ? value === true : value !== null && value !== undefined;
            })
            .map((f) => (f.type === "boolean" ? f.label : `${f.label}: ${m[f.key]}`))
            .join(" · ");

          return (
            <div
              key={m.id}
              className={`rounded-md border bg-white px-4 py-3 ${
                editingId === m.id ? "border-brand-300" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    vs {m.opponent}{" "}
                    <span
                      className={
                        m.result === "WIN"
                          ? "text-brand-600"
                          : m.result === "LOSS"
                            ? "text-red-600"
                            : "text-slate-500"
                      }
                    >
                      ({RESULT_LABEL[m.result]})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateOnly(m.matchDate)}
                    {m.club && ` · ${m.club.name}`}
                    {m.championship && ` · ${m.championship}`}
                    {m.condition && ` · ${m.condition === "LOCAL" ? "Local" : "Visitante"}`}
                    {m.position && ` · ${m.position}`}
                    {m.minutesPlayed !== null && ` · ${m.minutesPlayed}'`} ·{" "}
                    {m.pointsScored} pts
                  </p>
                  {summary && <p className="text-xs text-slate-400">{summary}</p>}
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(m)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => handleDelete(m.id)}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                  >
                    Borrar
                  </button>
                </div>
              </div>

              <MatchPhotos matchId={m.id} photos={m.photos} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
