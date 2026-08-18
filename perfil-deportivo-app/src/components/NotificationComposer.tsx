"use client";

import { useState } from "react";

export default function NotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSending(true);

    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        targetEmail: targetEmail || null,
      }),
    });

    const responseBody = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setError(
        typeof responseBody.error === "string" ? responseBody.error : "No se pudo enviar"
      );
      return;
    }

    setResult(`Enviada a ${responseBody.sentTo} usuario(s).`);
    setTitle("");
    setBody("");
    setTargetEmail("");
  }

  return (
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
          minLength={2}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Mensaje</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={2}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Email destino (dejar vacío para enviar a todos)
        </label>
        <input
          type="email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          placeholder="usuario@ejemplo.com"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <p className="text-sm text-brand-600">{result}</p>}

      <button
        type="submit"
        disabled={sending}
        className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Enviando..." : "Enviar notificación"}
      </button>
    </form>
  );
}
