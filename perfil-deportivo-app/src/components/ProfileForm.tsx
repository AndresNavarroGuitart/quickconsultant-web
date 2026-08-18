"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/athlete/countries";

type Profile = {
  displayName: string;
  sport: string;
  location: string | null;
  bio: string | null;
  isPublic: boolean;
  slug: string;
  birthDate: string | null;
  position: string | null;
  heightCm: number | null;
  country: string | null;
  jerseyNumber: number | null;
  subjectType: "SELF" | "DEPENDENT";
  guardianName: string | null;
  guardianRelationship: string | null;
};

export default function ProfileForm({
  profile,
  hasAccess,
}: {
  profile: Profile;
  hasAccess: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [sport, setSport] = useState(profile.sport);
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [position, setPosition] = useState(profile.position ?? "");
  const [heightCm, setHeightCm] = useState(
    profile.heightCm !== null ? String(profile.heightCm) : ""
  );
  const [country, setCountry] = useState(profile.country ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(
    profile.jerseyNumber !== null ? String(profile.jerseyNumber) : ""
  );
  const [guardianName, setGuardianName] = useState(profile.guardianName ?? "");
  const [guardianRelationship, setGuardianRelationship] = useState(
    profile.guardianRelationship ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        sport,
        location: location || null,
        isPublic,
        birthDate: birthDate || null,
        position: position || null,
        heightCm: heightCm ? Number(heightCm) : null,
        country: country || null,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        ...(hasAccess ? { bio: bio || null } : {}),
        ...(profile.subjectType === "DEPENDENT"
          ? {
              subjectType: "DEPENDENT",
              guardianName,
              guardianRelationship: guardianRelationship || null,
              guardianConsent: true,
            }
          : {}),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo guardar");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nombre</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Deporte</label>
        <input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          required
          minLength={2}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Ubicación</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ciudad, provincia"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Fecha de cumpleaños
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Posición</label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Delantero, arquero..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Altura (cm)
          </label>
          <input
            type="number"
            min={50}
            max={250}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">País</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Sin especificar</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
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
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={!hasAccess}
          rows={4}
          placeholder={
            hasAccess
              ? "Contá tu trayectoria..."
              : "Activá tu suscripción para agregar una bio"
          }
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>

      {profile.subjectType === "DEPENDENT" && (
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 border-l-4 border-l-accent-500 bg-white p-3">
          <p className="text-xs text-accent-700">
            Este perfil está gestionado por un padre/madre/tutor.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Nombre del responsable
            </label>
            <input
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
              minLength={2}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Relación (opcional)
            </label>
            <input
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              placeholder="Madre, padre, tutor/a..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Perfil público (visible en /perfil/{profile.slug})
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-brand-600">Guardado.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
