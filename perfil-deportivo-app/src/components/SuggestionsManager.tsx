"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SuggestionStatus = "NEW" | "PLANNED" | "IN_PROGRESS" | "DONE" | "REJECTED";

type Suggestion = {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  adminNote: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  NEW: "Recibida",
  PLANNED: "Planificada",
  IN_PROGRESS: "En desarrollo",
  DONE: "Hecha",
  REJECTED: "No planificada",
};

const STATUS_COLOR: Record<SuggestionStatus, string> = {
  NEW: "text-slate-500",
  PLANNED: "text-brand-600",
  IN_PROGRESS: "text-accent-600",
  DONE: "text-brand-700",
  REJECTED: "text-red-500",
};

export default function SuggestionsManager({
  initialSuggestions,
}: {
  initialSuggestions: Suggestion[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo enviar");
      return;
    }

    setTitle("");
    setDescription("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={4}
            placeholder="Contanos qué te gustaría que agreguemos"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Enviando..." : "Enviar sugerencia"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {initialSuggestions.length === 0 && (
          <p className="text-sm text-slate-400">
            Todavía no enviaste sugerencias.
          </p>
        )}
        {initialSuggestions.map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{s.title}</p>
              <span className={`text-xs font-semibold ${STATUS_COLOR[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{s.description}</p>
            {s.adminNote && (
              <p className="mt-2 text-xs text-slate-500">
                Nota del equipo: {s.adminNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
