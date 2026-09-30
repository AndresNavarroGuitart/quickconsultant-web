import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { getGamificationStats, getLeaderboard } from "@/lib/gamification/stats";
import { ShieldIcon, FlameIcon, CheckCircleIcon, LockIcon, ChevronDownIcon } from "@/components/icons";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi racha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sumás puntos cada vez que cargás algo real: tu perfil, tus clubes,
          tus fotos y tus partidos.
        </p>
      </div>

      {/* Nivel */}
      <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
            <ShieldIcon className="h-6 w-6 text-accent-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Nivel actual
            </p>
            <p className="text-xl font-bold">{level.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-white/70">puntos</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-accent-400"
              style={{ width: `${level.progressPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-white/80">
            <span>{level.name}</span>
            {level.next ? (
              <span>
                <b>{level.pointsToNext} pts</b> para {level.next}
              </span>
            ) : (
              <span>Nivel máximo</span>
            )}
          </div>
        </div>
      </div>

      {/* Racha */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <FlameIcon className="h-6 w-6 text-accent-500" />
          <p className="font-bold text-slate-900">
            {streak.weeks > 0
              ? `Racha de ${streak.weeks} semana${streak.weeks === 1 ? "" : "s"}`
              : "Todavía no arrancaste una racha"}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          {streak.last4Weeks.map((active, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${active ? "bg-accent-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Logros */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 font-bold text-slate-900">Tus logros</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center ${
                badge.unlocked
                  ? "border-brand-200 bg-brand-50"
                  : "border-slate-200 bg-slate-50"
              }`}
              title={badge.description}
            >
              {badge.unlocked ? (
                <CheckCircleIcon className="h-6 w-6 text-brand-600" />
              ) : (
                <LockIcon className="h-6 w-6 text-slate-400" />
              )}
              <span
                className={`text-xs font-bold ${badge.unlocked ? "text-brand-900" : "text-slate-500"}`}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-bold text-slate-900">Ranking general</p>
        <p className="mt-1 text-xs text-slate-500">
          Nadie ve tu nombre en el ranking: solo tu puntaje y tu puesto.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {leaderboard.podium.map((row) => (
            <div
              key={row.rank}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 ${
                row.isMe ? "border-accent-400 bg-accent-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <span className="text-xs font-bold text-slate-500">#{row.rank}</span>
              <span className="text-sm font-bold text-slate-900">
                {row.points} pts
              </span>
              {row.isMe && (
                <span className="text-[11px] font-bold text-accent-600">Vos</span>
              )}
            </div>
          ))}
        </div>

        {leaderboard.around.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {leaderboard.around.map((row) => (
              <div
                key={row.rank}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                  row.isMe ? "bg-accent-50 font-bold text-accent-700" : "text-slate-600"
                }`}
              >
                <span>#{row.rank} · {row.isMe ? "Vos" : "Perfil anónimo"}</span>
                <span>{row.points} pts</span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">
          {leaderboard.total} perfil{leaderboard.total === 1 ? "" : "es"} en el ranking.
        </p>
      </div>

      {/* Cómo sumás puntos (contraible) */}
      <details className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm" open>
        <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-slate-900">
          <span>Cómo sumás puntos</span>
          <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 flex flex-col divide-y divide-slate-100">
          {[
            { label: "Completar tu perfil", pts: 20 },
            { label: "Agregar un club", pts: 20 },
            { label: "Cargar un partido", pts: 25 },
            { label: "Registrar en vivo", pts: 50 },
            { label: "Subir una foto", pts: 10 },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-bold text-accent-600">+{row.pts}</span>
            </div>
          ))}
        </div>
      </details>

      <p className="text-xs text-slate-400">
        Los niveles van de Regional a Champions League. Los puntos y logros
        son iguales para cualquier deporte de la app.
      </p>
    </div>
  );
}
