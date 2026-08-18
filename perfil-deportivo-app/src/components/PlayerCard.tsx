"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { countryFlagEmoji, countryName } from "@/lib/athlete/countries";

export default function PlayerCard({
  avatarUrl,
  displayName,
  birthYear,
  position,
  clubNames,
  country,
  jerseyNumber,
}: {
  avatarUrl: string | null;
  displayName: string;
  birthYear: number | null;
  position: string | null;
  clubNames: string[];
  country: string | null;
  jerseyNumber: number | null;
}) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMenuOpen(false);
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", "avatar");

    const res = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo subir la imagen");
      return;
    }

    router.refresh();
  }

  const flag = countryFlagEmoji(country);

  return (
    <div className="w-full max-w-xs rounded-2xl bg-gradient-to-b from-brand-400 via-brand-600 to-brand-800 p-[3px] shadow-md">
      <div className="flex flex-col items-center gap-3 rounded-[14px] bg-white px-5 pb-5 pt-4">
        <div className="flex w-full items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl leading-none" title={countryName(country) ?? undefined}>
              {flag ?? "🏳️"}
            </span>
            <span className="text-lg font-bold leading-none text-slate-700">
              {jerseyNumber ?? "—"}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="group relative block h-28 w-28 rounded-full"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-28 w-28 rounded-full border-4 border-brand-100 object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-brand-100 bg-brand-50 text-3xl font-semibold text-brand-600">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5V7.5a1.5 1.5 0 0 1 1.5-1.5h2l1-1.5h9l1 1.5h2A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5Z"
                  />
                  <circle cx="12" cy="12" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {menuOpen && (
              <div className="absolute left-1/2 top-full z-10 mt-2 w-40 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-1 shadow-md">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="block w-full rounded px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Elegir de la galería
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="block w-full rounded px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tomar foto
                </button>
              </div>
            )}

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {uploading && <p className="text-xs text-slate-400">Subiendo...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <p className="text-lg font-bold uppercase tracking-wide text-slate-900">
          {displayName}
        </p>

        <div className="h-px w-full bg-slate-100" />

        <div className="flex w-full flex-col items-center gap-1">
          {clubNames.length > 0 ? (
            clubNames.map((name) => (
              <p key={name} className="text-sm font-medium text-slate-600">
                {name}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-400">Sin club actual</p>
          )}
        </div>

        <div className="flex w-full items-center justify-center gap-8 pt-1">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-brand-700">
              {birthYear ?? "—"}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Categoría
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-accent-600">
              {position ?? "—"}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Posición
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
