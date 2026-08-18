"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SubjectType = "SELF" | "DEPENDENT";

export default function OnboardingForm() {
  const router = useRouter();
  const [subjectType, setSubjectType] = useState<SubjectType>("SELF");
  const [displayName, setDisplayName] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        sport,
        location: location || null,
        subjectType,
        guardianName: subjectType === "DEPENDENT" ? guardianName : null,
        guardianRelationship:
          subjectType === "DEPENDENT" ? guardianRelationship || null : null,
        guardianConsent: subjectType === "DEPENDENT" ? guardianConsent : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo crear el perfil");
      return;
    }

    router.push("/estadisticas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">
          ¿Para quién es este perfil?
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="subjectType"
            checked={subjectType === "SELF"}
            onChange={() => setSubjectType("SELF")}
          />
          Para mí
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="subjectType"
            checked={subjectType === "DEPENDENT"}
            onChange={() => setSubjectType("DEPENDENT")}
          />
          Para otra persona (ej. mi hijo/a)
        </label>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Nombre {subjectType === "DEPENDENT" ? "del deportista" : ""}
        </label>
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
          placeholder="Tenis, fútbol, ajedrez..."
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

      {subjectType === "DEPENDENT" && (
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 border-l-4 border-l-accent-500 bg-white p-3">
          <p className="text-xs text-accent-700">
            Como vas a cargar datos y fotos de otra persona, necesitamos
            confirmar que sos su padre/madre/tutor legal.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Tu nombre (responsable)
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
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={guardianConsent}
              onChange={(e) => setGuardianConsent(e.target.checked)}
              required
            />
            Confirmo que soy el padre/madre/tutor legal de esta persona y
            autorizo la creación de este perfil deportivo, incluyendo la
            carga de fotos.
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creando perfil..." : "Crear mi perfil"}
      </button>
    </form>
  );
}
