import { formatDateOnly } from "@/lib/format";

type MatchResult = "WIN" | "LOSS" | "DRAW";

type RecentMatch = {
  id: string;
  opponent: string;
  matchDate: string;
  result: MatchResult;
  club: { name: string; logoUrl: string | null } | null;
};

const RESULT_BADGE: Record<MatchResult, { label: string; className: string }> = {
  WIN: { label: "Ganado", className: "bg-green-600 text-white" },
  LOSS: { label: "Perdido", className: "bg-red-600 text-white" },
  DRAW: { label: "Empate", className: "bg-yellow-500 text-slate-900" },
};

function ClubBadge({ club }: { club: RecentMatch["club"] }) {
  if (!club) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
        –
      </div>
    );
  }

  if (club.logoUrl) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700"
      title={club.name}
    >
      {club.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function RecentFormStrip({ matches }: { matches: RecentMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-slate-400">Todavía no cargaste partidos.</p>;
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-md border border-slate-200 bg-white p-4">
      {matches.map((m) => {
        const badge = RESULT_BADGE[m.result];
        return (
          <div key={m.id} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-slate-400">
              {formatDateOnly(m.matchDate)}
            </span>
            <ClubBadge club={m.club} />
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
              title={`vs ${m.opponent}`}
            >
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
