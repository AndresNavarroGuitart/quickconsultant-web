type MatchResult = "WIN" | "LOSS" | "DRAW";

type RecentMatch = {
  id: string;
  opponent: string;
  result: MatchResult;
  club: { name: string; logoUrl: string | null } | null;
};

const RESULT_CHIP: Record<MatchResult, { label: string; className: string }> = {
  WIN: { label: "G", className: "bg-brand-600" },
  LOSS: { label: "P", className: "bg-red-600" },
  DRAW: { label: "E", className: "bg-slate-400" },
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
    <div className="flex gap-4 rounded-md border border-slate-200 bg-white p-4">
      {matches.map((m) => {
        const chip = RESULT_CHIP[m.result];
        return (
          <div key={m.id} className="flex flex-col items-center gap-2">
            <ClubBadge club={m.club} />
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white ${chip.className}`}
              title={`vs ${m.opponent}`}
            >
              {chip.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
