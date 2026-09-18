import { sportLabel, positionLabel } from "@/lib/athlete/sportsCatalog";

export default function ProfileSummaryCard({
  avatarUrl,
  displayName,
  sport,
  position,
  clubNames,
  jerseyNumber,
}: {
  avatarUrl: string | null;
  displayName: string;
  sport: string;
  position: string | null;
  clubNames: string[];
  jerseyNumber: number | null;
}) {
  const clubsText = clubNames.length > 0 ? clubNames.join(", ") : "Sin club actual";
  const jerseyText = jerseyNumber !== null ? `#${jerseyNumber}` : null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-12 w-12 flex-none rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-slate-200 bg-brand-50 text-lg font-bold text-brand-600">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-slate-900">{displayName}</p>
        <p className="text-xs text-slate-500">
          {sportLabel(sport)}
          {position && ` · ${positionLabel(sport, position)}`}
        </p>
        <p className="text-xs font-semibold text-brand-600">
          {clubsText}
          {jerseyText && ` · ${jerseyText}`}
        </p>
      </div>
    </div>
  );
}
