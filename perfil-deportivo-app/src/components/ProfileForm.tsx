"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/athlete/countries";
import {
  SPORTS,
  getPositions,
  getPosition,
  getSport,
} from "@/lib/athlete/sportsCatalog";

type Profile = {
  displayName: string;
  sport: string;
  location: string | null;
  birthDate: string | null;
  position: string | null;
  heightCm: number | null;
  country: string | null;
  jerseyNumber: number | null;
  subjectType: "SELF" | "DEPENDENT";
  guardianName: string | null;
  guardianRelationship: string | null;
};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  // Normalizamos al key del catalogo (ej. "Fútbol" o "futbol" -> "futbol");
  // si el deporte cargado no esta en el catalogo se deja tal cual.
  const [sport, setSport] = useState(
    getSport(profile.sport)?.key ?? profile.sport
  );
  const [location, setLocation] = useState(profile.location ?? "");
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [position, setPosition] = useState(
    getPosition(profile.sport, profile.position)?.key ?? profile.position ?? ""
  );

  const positionOptions = getPositions(sport);

  function handleSportChange(value: string) {
    setSport(value);
    // Si la posicion cargada no pertenece al nuevo deporte, se limpia.
    const valid = getPositions(value).some((p) => p.key === position);
    if (!valid) setPosition("");
  }
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
        birthDate: birthDate || null,
        position: position || null,
        heightCm: heightCm ? Number(heightCm) : null,
        country: country || null,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
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
        <select
          value={sport}
          onChange={(e) => handleSportChange(e.target.value)}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Elegí un deporte</option>
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
          {sport && !getSport(sport) && (
            <option value={sport}>{sport}</option>
          )}
        </select>
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
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={positionOptions.length === 0}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {positionOptions.length === 0
                ? "Elegí primero el deporte"
                : "Sin especificar"}
            </option>
            {positionOptions.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
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
