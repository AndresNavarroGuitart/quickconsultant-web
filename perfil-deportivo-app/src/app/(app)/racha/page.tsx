import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import {
  getGamificationStats,
  getLeaderboard,
  type LeaderboardRow,
} from "@/lib/gamification/stats";
import type { Badge, BadgeId } from "@/lib/gamification/badges";
import { ShieldIcon, FlameIcon, LockIcon, ChevronDownIcon } from "@/components/icons";

// Iconos puntuales de esta pagina, copiados 1 a 1 del mockup (Artifact
// "Racha Potrero") para mantener la misma estetica exacta que se aprobo ahi.
function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}
function ClubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5-9 9" />
    </svg>
  );
}
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 4h16v12H4z" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  );
}
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" strokeWidth={2.2} />
    </svg>
  );
}

const BADGE_ICONS: Record<BadgeId, (props: { className?: string }) => ReactElement> = {
  primer_paso: MonitorIcon,
  constante: FlameIcon,
  fotografo: CameraIcon,
  trotamundos: ClubIcon,
  perfil_completo: PersonIcon,
  cronista: CalendarIcon,
};

const MEDALS: Record<number, { border: string; barBg: string; ink: string; barHeight: number }> = {
  1: { border: "#d4af37", barBg: "#fdf6e0", ink: "#92720f", barHeight: 64 },
  2: { border: "#9aa5b1", barBg: "#f1f4f7", ink: "#5b6572", barHeight: 46 },
  3: { border: "#c98a4b", barBg: "#fbf0e6", ink: "#8a5a2b", barHeight: 34 },
};

const POINTS_ROWS: { icon: (p: { className?: string }) => ReactElement; label: string; sub: string; value: number }[] = [
  { icon: PersonIcon, label: "Completar tu perfil", sub: "Deporte, posición, altura y foto", value: 20 },
  { icon: ClubIcon, label: "Agregar un club", sub: "Por cada club que sumes a tu historial", value: 20 },
  { icon: CalendarIcon, label: "Cargar un partido", sub: "Con el formulario, después de jugar", value: 25 },
  { icon: ClockIcon, label: "Registrar en vivo", sub: "Tocando cada jugada durante el partido", value: 50 },
  { icon: CameraIcon, label: "Subir una foto", sub: "De un partido o tu avatar", value: 10 },
];

function fmt(n: number) {
  return n.toLocaleString("es-AR");
}

function PodiumSlot({ row }: { row: LeaderboardRow }) {
  const medal = MEDALS[row.rank];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-slate-400"
          style={{ borderColor: medal.border }}
        >
          <PersonIcon className="h-[22px] w-[22px]" />
        </div>
        <div
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10.5px] font-extrabold text-white"
          style={{ background: medal.border }}
        >
          {row.rank}
        </div>
      </div>
      <div className="text-center font-extrabold text-[13px] tabular-nums text-slate-900">
        {fmt(row.points)}
        <span className="block text-[9.5px] font-medium text-slate-400">puntos</span>
        {row.isMe && <span className="block text-[9.5px] font-bold text-accent-600">Vos</span>}
      </div>
      <div
        className="flex w-full items-start justify-center rounded-t-[10px] pt-1.5"
        style={{ background: medal.barBg, height: medal.barHeight }}
      >
        <b className="text-[11px]" style={{ color: medal.ink }}>
          {row.rank}°
        </b>
      </div>
    </div>
  );
}

function RankRow({ row, label }: { row: LeaderboardRow; label: string }) {
  if (row.isMe) {
    return (
      <div className="my-0.5 flex items-center gap-2.5 rounded-[10px] bg-brand-50 px-2 py-2">
        <span className="w-[22px] shrink-0 text-center text-[12.5px] font-bold tabular-nums text-brand-700">
          {row.rank}
        </span>
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-brand-600 bg-brand-600 text-white">
          <PersonIcon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-bold text-brand-900">{label}</span>
        <span className="ml-auto text-[13px] font-extrabold tabular-nums text-brand-700">
          {fmt(row.points)}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 border-t border-slate-200 py-2 first:border-none">
      <span className="w-[22px] shrink-0 text-center text-[12.5px] font-bold tabular-nums text-slate-400">
        {row.rank}
      </span>
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
        <PersonIcon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="ml-auto text-[13px] font-extrabold tabular-nums text-slate-900">
        {fmt(row.points)}
      </span>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = BADGE_ICONS[badge.id];
  if (!badge.unlocked) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-100 px-1.5 py-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
          <LockIcon className="h-5 w-5" />
        </div>
        <span className="text-[11.5px] font-bold leading-tight text-slate-400">{badge.label}</span>
        <span className="text-[10px] leading-tight text-slate-400">{badge.sub}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1.5 py-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[11.5px] font-bold leading-tight text-slate-900">{badge.label}</span>
      <span className="text-[10px] leading-tight text-slate-400">{badge.sub}</span>
    </div>
  );
}

export default async function RachaPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const profile = ctx.activeProfile;
  if (!profile) redirect("/onboarding");

  const [stats, leaderboard] = await Promise.all([
    getGamificationStats(profile.id),
    getLeaderboard(profile.id),
  ]);

  const { level, streak, badges, totalPoints } = stats;
  const podiumOrder = [2, 1, 3]
    .map((rank) => leaderboard.podium.find((r) => r.rank === rank))
    .filter((r): r is LeaderboardRow => !!r);

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-extrabold tracking-tight text-slate-900">
          Racha Potrero
        </h1>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
          Sumás puntos cada vez que cargás algo real: tu perfil, tus clubes,
          tus fotos y tus partidos.
        </p>
      </div>

      {/* Nivel */}
      <div
        className="relative overflow-hidden rounded-[14px] p-4 text-white"
        style={{ background: "linear-gradient(155deg, #114f92, #1568b8 65%, #1a72c4)" }}
      >
        <div
          className="pointer-events-none absolute -right-[10%] -top-[40%] h-[220px] w-[220px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/25 bg-white/15"
            style={{ borderRadius: "14px 14px 20px 20px" }}
          >
            <ShieldIcon className="h-[26px] w-[26px] text-accent-500" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-white/65">
              Nivel actual
            </span>
            <span className="text-[19px] font-extrabold tracking-tight">{level.name}</span>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <b className="block text-[22px] font-extrabold leading-tight tabular-nums">
              {fmt(totalPoints)}
            </b>
            <span className="text-[11px] text-white/65">puntos</span>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-accent-500"
              style={{ width: `${level.progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-white/75">
            <span>{level.name}</span>
            {level.next ? (
              <span>
                <b className="text-white tabular-nums">{fmt(level.pointsToNext ?? 0)} pts</b> para {level.next}
              </span>
            ) : (
              <span>Nivel máximo</span>
            )}
          </div>
        </div>
      </div>

      {/* Racha */}
      <div className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50">
          <FlameIcon className="h-[22px] w-[22px] text-accent-600" />
        </div>
        <div>
          <b className="text-sm text-slate-900">
            {streak.weeks > 0
              ? `Racha de ${streak.weeks} semana${streak.weeks === 1 ? "" : "s"}`
              : "Todavía no arrancaste una racha"}
          </b>
          <p className="mt-0.5 text-xs text-slate-500">
            {streak.weeks > 0
              ? "Actividad registrada cada semana"
              : "Cargá algo esta semana para arrancar"}
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          {streak.last4Weeks.map((active, i) => (
            <span
              key={i}
              className={`h-[9px] w-[9px] rounded-full ${active ? "bg-accent-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Logros */}
      <div>
        <p className="mx-0.5 mt-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-500">
          Tus logros
        </p>
        <div className="mt-2 rounded-[14px] border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-3 gap-2.5">
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      </div>

      {/* Ranking general */}
      <div>
        <p className="mx-0.5 mt-1 text-[13px] font-extrabold uppercase tracking-wide text-slate-500">
          Ranking general
        </p>
        <div className="mx-0.5 mb-2.5 mt-1.5 flex items-start gap-2 text-[11.5px] leading-snug text-slate-500">
          <EyeOffIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          Se compara solo por puntos: nadie ve tu nombre ni el de nadie más, ni siquiera vos.
        </div>

        <div className="rounded-[14px] border border-slate-200 bg-white p-4">
          {podiumOrder.length > 0 && (
            <div className="mb-3.5 grid grid-cols-3 items-end gap-2">
              {podiumOrder.map((row) => (
                <PodiumSlot key={row.rank} row={row} />
              ))}
            </div>
          )}

          <div className="flex flex-col">
            {leaderboard.nextRows.map((row) => (
              <RankRow key={row.rank} row={row} label={row.isMe ? "Vos" : "Perfil anónimo"} />
            ))}
          </div>

          {!leaderboard.meInList && (
            <>
              <div className="py-1 text-center text-[13px] tracking-[0.12em] text-slate-400">
                ···
              </div>
              <RankRow row={leaderboard.me} label="Vos" />
            </>
          )}
        </div>
      </div>

      {/* Cómo sumás puntos */}
      <details className="group" open>
        <summary className="mx-0.5 mb-2 mt-1 flex cursor-pointer list-none items-center justify-between text-[13px] font-extrabold uppercase tracking-wide text-slate-500 [&::-webkit-details-marker]:hidden">
          <span>Cómo sumás puntos</span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col rounded-[14px] border border-slate-200 bg-white p-4">
          {POINTS_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-center gap-2.5 border-t border-slate-200 py-2.5 first:border-none"
              >
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-[13.5px] text-slate-900">
                  {row.label}
                  <small className="block text-[11.5px] text-slate-400">{row.sub}</small>
                </div>
                <div className="ml-auto whitespace-nowrap text-[13.5px] font-extrabold tabular-nums text-brand-700">
                  +{row.value}
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <p className="px-2 text-center text-[11.5px] leading-relaxed text-slate-400">
        Los niveles van de Regional a Champions League. Los puntos y logros
        son iguales para cualquier deporte de la app.
      </p>
    </div>
  );
}
