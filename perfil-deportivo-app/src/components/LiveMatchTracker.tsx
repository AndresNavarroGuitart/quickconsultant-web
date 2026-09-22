"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import {
  computedStatValue,
  getPosition,
  getStatsForPosition,
  positionLabel,
} from "@/lib/athlete/sportsCatalog";
import {
  TONE_CLASSES,
  getLiveActions,
  getLivePositions,
  liveTotals,
  type LiveAction,
  type LiveIcon,
} from "@/lib/athlete/liveActions";

type Condition = "LOCAL" | "VISITANTE";

// Borrador del partido: se guarda en el celular a cada toque para que un
// refresh, un bloqueo de pantalla o un cierre del navegador no lo pierdan.
type Draft = {
  screen: "setup" | "live" | "done";
  position: string;
  rival: string;
  clubId: string;
  championship: string;
  condition: Condition;
  date: string;
  events: string[];
  elapsed: number;
  resumedAt: number | null;
  // Goles del equipo del jugador y del rival (independientes del boton
  // "Gol", que cuenta los goles del jugador).
  home: number;
  away: number;
};

type Props = {
  profileId: string;
  displayName: string;
  sport: string;
  profilePosition: string | null;
  clubOptions: { id: string; name: string }[];
  championshipSuggestions: string[];
};

const STORAGE_PREFIX = "potrero-live-draft-v1:";

function localDateISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function fmtClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const second = words[1] ? words[1][0] : (words[0][1] ?? "");
  return (first + second).toUpperCase();
}

function nonNegInt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function vibrate() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // no todos los navegadores lo soportan
  }
}

// Eventos para medir cuanta gente arranca y termina un partido en vivo.
function track(name: string) {
  if (process.env.NODE_ENV !== "production") return;
  try {
    sendGAEvent("event", name);
  } catch {
    // Analytics bloqueado: no afecta al partido
  }
}

function ActionIcon({ name }: { name: LiveIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block h-6 w-6 fill-none stroke-current"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "ball" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.4l3.4 2.5-1.3 4h-4.2l-1.3-4z" className="fill-current" strokeWidth={1.3} />
          <path d="M12 8.4V3.4M15.4 10.9L20 9.4M14.1 14.9l2.9 3.9M9.9 14.9L7 18.8M8.6 10.9L4 9.4" />
        </>
      )}
      {name === "boot" && (
        <>
          <path d="M4 4h6v5.5l7 2.6c1.7.6 3 1.9 3 3.4V17H4z" />
          <path d="M7 20.5V17M12 20.5V17M17 20.5V17M4 12h6" />
        </>
      )}
      {name === "head" && (
        <>
          <circle cx="8.5" cy="12.5" r="3.3" />
          <path d="M2.5 22c.4-3.7 2.9-5.6 6-5.6s5.6 1.9 6 5.6" />
          <circle cx="17" cy="5.5" r="3.5" />
          <path d="M14.6 8l-3 2.3" />
        </>
      )}
      {name === "shield" && <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />}
      {name === "clear" && (
        <>
          <circle cx="17" cy="8" r="4" />
          <path d="M3 10h8M2 14h9M5 18h7" />
        </>
      )}
      {name === "goal" && (
        <>
          <path d="M3 19V7h18v12" />
          <path d="M9 7v12M15 7v12M3 13h18" />
          <circle cx="12" cy="16" r="2.3" className="fill-current" stroke="none" />
        </>
      )}
      {name === "star" && (
        <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7L12 3z" />
      )}
    </svg>
  );
}

function ActionTile({
  action,
  count,
  onTap,
  onMinus,
}: {
  action: LiveAction;
  count: number;
  onTap: () => void;
  onMinus: () => void;
}) {
  const tone = TONE_CLASSES[action.tone];
  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={onTap}
        className={`relative flex min-w-0 flex-1 touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-2xl border-2 text-center font-bold leading-tight transition-transform active:scale-[0.97] ${tone.tile} ${
          action.small
            ? "min-h-[62px] px-0.5 py-2 text-[11px]"
            : "min-h-[72px] px-1.5 py-2 text-[12.5px]"
        }`}
      >
        <span
          className={`absolute -right-1.5 -top-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white px-1 text-xs font-extrabold tabular-nums text-white ${tone.badge}`}
        >
          {count}
        </span>
        <span className="relative block h-6 w-6">
          <ActionIcon name={action.icon} />
          {action.mark && (
            <span
              className={`absolute -bottom-1 -right-2 flex h-[15px] w-[15px] items-center justify-center rounded-full border-[1.5px] border-white ${
                action.mark === "ok" ? "bg-green-700" : "bg-red-700"
              }`}
            >
              <svg
                viewBox="0 0 15 15"
                aria-hidden="true"
                className="h-[11px] w-[11px] fill-none stroke-white"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {action.mark === "ok" ? (
                  <path d="M3.5 7.5l2.5 2.5 5-5.5" />
                ) : (
                  <path d="M4 4l7 7M11 4l-7 7" />
                )}
              </svg>
            </span>
          )}
        </span>
        <span>{action.label}</span>
      </button>
      <button
        type="button"
        disabled={count === 0}
        onClick={onMinus}
        aria-label={`Restar uno a ${action.label}`}
        className={`absolute -top-1.5 z-10 flex touch-manipulation items-center justify-center rounded-full border border-slate-900/15 bg-white/90 font-bold leading-none text-slate-500 opacity-90 after:absolute after:-inset-[5px] after:content-[''] active:bg-red-100 active:text-red-700 disabled:opacity-30 ${
          action.small ? "-left-px h-[18px] w-[18px] text-[13px]" : "-left-1.5 h-5 w-5 text-sm"
        }`}
      >
        −
      </button>
    </div>
  );
}

function Team({
  name,
  count,
  rival,
  onDelta,
}: {
  name: string;
  count: number;
  rival?: boolean;
  onDelta: (delta: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center text-xs font-bold">
      <span
        className={`flex h-[42px] w-[42px] items-center justify-center rounded-t-[14px] rounded-b-[20px] border-2 text-sm font-extrabold ${
          rival
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-brand-100 bg-brand-50 text-brand-700"
        }`}
      >
        {initials(name)}
      </span>
      <span className="max-w-full truncate">{name}</span>
      <div
        role="group"
        aria-label={`Goles de ${name}`}
        className="mt-0.5 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-[3px]"
      >
        <button
          type="button"
          onClick={() => onDelta(-1)}
          aria-label={`Restar un gol a ${name}`}
          className="h-[26px] w-[26px] touch-manipulation rounded-[9px] bg-white text-lg font-extrabold leading-none text-slate-900 ring-1 ring-slate-200"
        >
          −
        </button>
        <output className="min-w-5 text-center text-[22px] font-extrabold leading-none tabular-nums">
          {count}
        </output>
        <button
          type="button"
          onClick={() => onDelta(1)}
          aria-label={`Sumar un gol a ${name}`}
          className="h-[26px] w-[26px] touch-manipulation rounded-[9px] bg-brand-600 text-lg font-extrabold leading-none text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}

function StatRows({
  sport,
  position,
  totals,
  extra,
}: {
  sport: string;
  position: string;
  totals: Record<string, number>;
  extra?: { label: string; value: string };
}) {
  const defs = getStatsForPosition(sport, position);
  return (
    <div className="flex flex-col">
      {defs.map((def) => {
        const value = def.formula ? computedStatValue(def, totals) : (totals[def.key] ?? 0);
        const shown =
          value === null ? "—" : def.type === "percent" ? `${value}%` : String(value);
        return (
          <div
            key={def.key}
            className="flex items-baseline justify-between gap-2 border-t border-slate-100 py-2 text-[13px] first:border-t-0"
          >
            <span>
              {def.label}
              {def.formula && (
                <em className="ml-1.5 rounded-lg bg-brand-50 px-1.5 py-px text-[10px] font-bold not-italic text-brand-600">
                  se calcula solo
                </em>
              )}
            </span>
            <b className="text-sm tabular-nums">{shown}</b>
          </div>
        );
      })}
      {extra && (
        <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 py-2 text-[13px]">
          <span>
            {extra.label}
            <em className="ml-1.5 rounded-lg bg-brand-50 px-1.5 py-px text-[10px] font-bold not-italic text-brand-600">
              desde el reloj
            </em>
          </span>
          <b className="text-sm tabular-nums">{extra.value}</b>
        </div>
      )}
    </div>
  );
}

export default function LiveMatchTracker({
  profileId,
  displayName,
  sport,
  profilePosition,
  clubOptions,
  championshipSuggestions,
}: Props) {
  const router = useRouter();
  const storageKey = STORAGE_PREFIX + profileId;

  const livePositions = getLivePositions(sport);
  const profilePositionKey = getPosition(sport, profilePosition)?.key ?? "";
  const defaultPosition = livePositions.some((p) => p.key === profilePositionKey)
    ? profilePositionKey
    : livePositions.length === 1
      ? livePositions[0].key
      : "";

  function freshDraft(): Draft {
    return {
      screen: "setup",
      position: defaultPosition,
      rival: "",
      clubId: clubOptions.length === 1 ? clubOptions[0].id : "",
      championship: "",
      condition: "LOCAL",
      date: "",
      events: [],
      elapsed: 0,
      resumedAt: null,
      home: 0,
      away: 0,
    };
  }

  function restoreDraft(raw: unknown): Draft {
    const base = freshDraft();
    if (!raw || typeof raw !== "object") return base;
    const r = raw as Partial<Draft>;
    const position =
      typeof r.position === "string" && getLiveActions(sport, r.position) ? r.position : base.position;
    const screen =
      (r.screen === "live" || r.screen === "done") && getLiveActions(sport, position)
        ? r.screen
        : "setup";
    return {
      screen,
      position,
      rival: typeof r.rival === "string" ? r.rival : "",
      clubId:
        typeof r.clubId === "string" && clubOptions.some((c) => c.id === r.clubId)
          ? r.clubId
          : base.clubId,
      championship: typeof r.championship === "string" ? r.championship : "",
      condition: r.condition === "VISITANTE" ? "VISITANTE" : "LOCAL",
      date: typeof r.date === "string" ? r.date : "",
      events: Array.isArray(r.events)
        ? r.events.filter((e): e is string => typeof e === "string")
        : [],
      elapsed: nonNegInt(r.elapsed),
      resumedAt: typeof r.resumedAt === "number" ? r.resumedAt : null,
      home: nonNegInt(r.home),
      away: nonNegInt(r.away),
    };
  }

  const [draft, setDraft] = useState<Draft>(freshDraft);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [finishArmed, setFinishArmed] = useState(false);
  const [discardArmed, setDiscardArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipPersist = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recupera el borrador guardado en este celular (si lo hay). Va en un
  // efecto (no en el initializer de useState) a proposito: localStorage no
  // existe en el render de servidor, asi que arrancar con freshDraft() y
  // reemplazarlo aca evita un mismatch de hidratacion.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDraft(restoreDraft(JSON.parse(raw)));
    } catch {
      // borrador ilegible: se arranca de cero
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!ready || skipPersist.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // sin espacio / modo privado: el partido sigue andando sin borrador
    }
  }, [draft, ready, storageKey]);

  const running = draft.resumedAt !== null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  // Que la pantalla no se apague mientras el reloj corre.
  useEffect(() => {
    if (draft.screen !== "live" || !running) return;
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
    };
    if (!nav.wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request("screen");
        if (cancelled) void s.release().catch(() => {});
        else sentinel = s;
      } catch {
        // permiso denegado o bateria baja: se sigue sin bloqueo
      }
    };
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [draft.screen, running]);

  useEffect(() => {
    if (!finishArmed) return;
    const id = setTimeout(() => setFinishArmed(false), 4000);
    return () => clearTimeout(id);
  }, [finishArmed]);

  useEffect(() => {
    if (!discardArmed) return;
    const id = setTimeout(() => setDiscardArmed(false), 4000);
    return () => clearTimeout(id);
  }, [discardArmed]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  if (!ready) {
    return <p className="text-sm text-slate-400">Cargando…</p>;
  }

  const actions = getLiveActions(sport, draft.position) ?? [];
  const actionById = new Map(actions.map((a) => [a.id, a]));
  const counts: Record<string, number> = {};
  for (const id of draft.events) counts[id] = (counts[id] ?? 0) + 1;
  const totals = liveTotals(sport, draft.position, draft.events);

  const elapsedMs =
    draft.elapsed + (draft.resumedAt ? Math.max(0, tick - draft.resumedAt) : 0);
  const minutes = Math.max(1, Math.round(elapsedMs / 60000));

  const ownName = clubOptions.find((c) => c.id === draft.clubId)?.name ?? "Mi equipo";
  const rivalName = draft.rival.trim() || "Rival";
  const result =
    draft.home > draft.away ? "WIN" : draft.home < draft.away ? "LOSS" : "DRAW";

  const canStart =
    getLiveActions(sport, draft.position) !== null &&
    draft.rival.trim() !== "" &&
    draft.clubId !== "";

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function flash(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }

  function start() {
    if (!canStart) return;
    setDraft((d) => ({
      ...d,
      rival: d.rival.trim(),
      screen: "live",
      date: localDateISO(),
      events: [],
      elapsed: 0,
      resumedAt: Date.now(),
      home: 0,
      away: 0,
    }));
    track("live_match_started");
  }

  function tap(action: LiveAction) {
    // Tocar una jugada con el reloj en pausa lo reanuda.
    setDraft((d) => ({
      ...d,
      events: [...d.events, action.id],
      resumedAt: d.resumedAt ?? Date.now(),
    }));
    vibrate();
    flash(`+1 ${action.label}`);
  }

  function minusOne(action: LiveAction) {
    setDraft((d) => {
      const i = d.events.lastIndexOf(action.id);
      if (i === -1) return d;
      const events = d.events.slice();
      events.splice(i, 1);
      return { ...d, events };
    });
    flash(`−1 ${action.label}`);
  }

  function undo() {
    const last = draft.events[draft.events.length - 1];
    if (!last) return;
    setDraft((d) => ({ ...d, events: d.events.slice(0, -1) }));
    flash(`Se deshizo: ${actionById.get(last)?.label ?? "última acción"}`);
  }

  function goalDelta(side: "home" | "away", delta: number) {
    setDraft((d) => ({ ...d, [side]: Math.max(0, d[side] + delta) }));
    vibrate();
  }

  function togglePause() {
    setDraft((d) =>
      d.resumedAt
        ? { ...d, elapsed: d.elapsed + (Date.now() - d.resumedAt), resumedAt: null }
        : { ...d, resumedAt: Date.now() }
    );
  }

  function finish() {
    if (!finishArmed) {
      setFinishArmed(true);
      return;
    }
    setFinishArmed(false);
    setDraft((d) => ({
      ...d,
      elapsed: d.elapsed + (d.resumedAt ? Date.now() - d.resumedAt : 0),
      resumedAt: null,
      screen: "done",
    }));
    window.scrollTo({ top: 0 });
  }

  function discard() {
    if (!discardArmed) {
      setDiscardArmed(true);
      return;
    }
    setDiscardArmed(false);
    setError(null);
    setDraft(freshDraft());
    window.scrollTo({ top: 0 });
  }

  async function save() {
    setSaving(true);
    setError(null);

    // homeScore/awayScore son Local - Visitante: el equipo del jugador va de
    // un lado u otro segun la condicion elegida.
    const own = draft.home;
    const other = draft.away;
    const homeScore = draft.condition === "LOCAL" ? own : other;
    const awayScore = draft.condition === "LOCAL" ? other : own;

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opponent: draft.rival.trim(),
        clubId: draft.clubId,
        matchDate: draft.date || localDateISO(),
        result,
        condition: draft.condition,
        pointsScored: 0,
        homeScore,
        awayScore,
        championship: draft.championship.trim() || null,
        notes: null,
        position: draft.position,
        minutesPlayed: minutes,
        stats: totals,
      }),
    }).catch(() => null);

    setSaving(false);

    if (!res || !res.ok) {
      const body = res ? await res.json().catch(() => ({})) : {};
      setError(
        typeof body.error === "string"
          ? body.error
          : "No se pudo guardar el partido. Probá de nuevo, no perdiste nada de lo registrado."
      );
      return;
    }

    skipPersist.current = true;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignorar
    }
    track("live_match_saved");
    router.push("/partidos");
    router.refresh();
  }

  const mainActions = actions.filter((a) => !a.small);
  const smallActions = actions.filter((a) => a.small);
  const inputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  // ---------- 1. Antes de empezar ----------
  if (draft.screen === "setup") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Partido en vivo</h1>

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-slate-500">Jugador</span>
            <span className="text-sm font-semibold text-slate-900">{displayName}</span>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="live-position" className="text-sm font-medium text-slate-700">
              Posición en este partido
            </label>
            <select
              id="live-position"
              value={draft.position}
              onChange={(e) => patch({ position: e.target.value })}
              className={inputClass}
            >
              <option value="">Elegí la posición</option>
              {livePositions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="live-club" className="text-sm font-medium text-slate-700">
              Club
            </label>
            <select
              id="live-club"
              value={draft.clubId}
              onChange={(e) => patch({ clubId: e.target.value })}
              className={inputClass}
            >
              <option value="">Elegí el club</option>
              {clubOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {clubOptions.length === 0 && (
              <p className="text-xs text-slate-500">
                Todavía no cargaste ningún club.{" "}
                <Link href="/clubes" className="font-medium text-brand-600 hover:underline">
                  Agregá uno en la sección Clubes
                </Link>{" "}
                para poder registrar el partido.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="live-rival" className="text-sm font-medium text-slate-700">
              Rival
            </label>
            <input
              id="live-rival"
              value={draft.rival}
              onChange={(e) => patch({ rival: e.target.value })}
              maxLength={120}
              autoComplete="off"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="live-championship" className="text-sm font-medium text-slate-700">
              Campeonato
            </label>
            <input
              id="live-championship"
              value={draft.championship}
              onChange={(e) => patch({ championship: e.target.value })}
              list="live-championship-suggestions"
              maxLength={120}
              autoComplete="off"
              placeholder="Torneo Apertura, Liga local..."
              className={inputClass}
            />
            <datalist id="live-championship-suggestions">
              {championshipSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Condición</span>
            <div className="grid grid-cols-2 gap-2">
              {(["LOCAL", "VISITANTE"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={draft.condition === c}
                  onClick={() => patch({ condition: c })}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
                    draft.condition === c
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {c === "LOCAL" ? "Local" : "Visitante"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Cada toque suma 1 a esa acción y la app arma sola los porcentajes. Lo que
          registres queda guardado en este celular hasta que termines el partido.
        </p>

        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className="rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Empezar partido
        </button>
        <Link
          href="/partidos"
          className="self-center text-xs text-slate-500 underline hover:text-slate-700"
        >
          Volver a Partidos
        </Link>
      </div>
    );
  }

  // ---------- 3. Fin del partido ----------
  if (draft.screen === "done") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-7 w-7 fill-none stroke-current"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Resumen final</h1>
          <p className="text-xs text-slate-500">
            Revisá los números. Si algo no coincide, lo corregís después desde el partido.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Resultado del partido</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 text-center">
              <span className="truncate text-[13px] font-bold">{ownName}</span>
              <b className="text-[32px] font-extrabold leading-none tracking-tight tabular-nums">
                {draft.home} - {draft.away}
              </b>
              <span className="truncate text-[13px] font-bold">{rivalName}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Resultado</span>
            <div className="grid grid-cols-3 gap-2" role="img" aria-label="Resultado calculado con los goles">
              {[
                { key: "WIN", label: "Ganado", on: "border-green-500 bg-green-100 text-green-900" },
                { key: "DRAW", label: "Empate", on: "border-slate-400 bg-slate-100 text-slate-700" },
                { key: "LOSS", label: "Perdido", on: "border-red-500 bg-red-100 text-red-900" },
              ].map((r) => (
                <div
                  key={r.key}
                  className={`rounded-xl border-2 px-1 py-2.5 text-center text-[13px] font-bold ${
                    result === r.key ? r.on : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {r.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Se calcula solo con los goles de cada equipo (el marcador del partido).
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-4 py-1">
          <StatRows
            sport={sport}
            position={draft.position}
            totals={totals}
            extra={{ label: "Minutos jugados", value: `${minutes}'` }}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar y cerrar"}
        </button>
        <button
          type="button"
          onClick={() => patch({ screen: "live" })}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-500 disabled:opacity-60"
        >
          Seguir registrando
        </button>
        <button
          type="button"
          onClick={discard}
          disabled={saving}
          className="self-center text-xs text-slate-500 underline hover:text-slate-700"
        >
          {discardArmed ? "¿Seguro? Se pierde todo lo registrado" : "Descartar partido"}
        </button>
      </div>
    );
  }

  // ---------- 2. En vivo ----------
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-2.5">
        <h1 className="text-base font-extrabold text-slate-900">Partido en vivo</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
            running ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-500"
          }`}
        >
          <i
            className={`block h-[7px] w-[7px] rounded-full bg-current ${running ? "animate-pulse" : ""}`}
          />
          {running ? "En vivo" : "En pausa"}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Team name={ownName} count={draft.home} onDelta={(d) => goalDelta("home", d)} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[38px] font-extrabold leading-none tracking-tight tabular-nums">
            {fmtClock(elapsedMs)}
          </span>
          <button
            type="button"
            onClick={togglePause}
            className="touch-manipulation rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900"
          >
            {running ? "Pausar" : "Reanudar"}
          </button>
        </div>
        <Team name={rivalName} rival count={draft.away} onDelta={(d) => goalDelta("away", d)} />
      </div>

      <div className="relative flex items-center justify-between gap-2 rounded-xl bg-green-100 px-3 py-2 text-[13px] font-bold text-green-900">
        <span className="truncate">Registrando a {displayName}</span>
        <span className="shrink-0 text-xs font-medium opacity-85">
          {positionLabel(sport, draft.position)}
        </span>
        <div
          aria-live="polite"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900 text-[13.5px] font-bold text-white transition-opacity duration-150 ${
            toast ? "opacity-100" : "opacity-0"
          }`}
        >
          {toast}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {mainActions.map((a) => (
          <ActionTile
            key={a.id}
            action={a}
            count={counts[a.id] ?? 0}
            onTap={() => tap(a)}
            onMinus={() => minusOne(a)}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {smallActions.map((a) => (
          <ActionTile
            key={a.id}
            action={a}
            count={counts[a.id] ?? 0}
            onTap={() => tap(a)}
            onMinus={() => minusOne(a)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={undo}
        disabled={draft.events.length === 0}
        className="touch-manipulation rounded-2xl border border-slate-200 bg-white py-3 text-[13.5px] font-bold text-slate-900 disabled:opacity-45"
      >
        ↶ Deshacer última acción
      </button>

      <details open className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-extrabold">
          Resumen en vivo
        </summary>
        <div className="px-3.5 pb-2">
          <StatRows sport={sport} position={draft.position} totals={totals} />
        </div>
      </details>

      <button
        type="button"
        onClick={finish}
        className="touch-manipulation rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-900"
      >
        {finishArmed ? "¿Seguro? Tocá de nuevo para finalizar" : "Finalizar partido"}
      </button>
      <button
        type="button"
        onClick={discard}
        className="self-center text-xs text-slate-500 underline hover:text-slate-700"
      >
        {discardArmed ? "¿Seguro? Se pierde todo lo registrado" : "Descartar partido"}
      </button>
    </div>
  );
}
