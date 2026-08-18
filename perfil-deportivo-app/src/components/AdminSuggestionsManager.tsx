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
  userEmail: string;
  createdAt: string;
};

const STATUS_OPTIONS: SuggestionStatus[] = [
  "NEW",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "REJECTED",
];

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  NEW: "Recibida",
  PLANNED: "Planificada",
  IN_PROGRESS: "En desarrollo",
  DONE: "Hecha",
  REJECTED: "No planificada",
};

function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const [status, setStatus] = useState<SuggestionStatus>(suggestion.status);
  const [adminNote, setAdminNote] = useState(suggestion.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/suggestions/${suggestion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: adminNote || null }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo guardar");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
        <span className="text-xs text-slate-400">{suggestion.userEmail}</span>
      </div>
      <p className="text-sm text-slate-600">{suggestion.description}</p>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SuggestionStatus)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            Nota para el usuario
          </label>
          <input
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminSuggestionsManager({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {suggestions.length === 0 && (
        <p className="text-sm text-slate-400">No hay sugerencias todavía.</p>
      )}
      {suggestions.map((s) => (
        <SuggestionRow key={s.id} suggestion={s} />
      ))}
    </div>
  );
}
