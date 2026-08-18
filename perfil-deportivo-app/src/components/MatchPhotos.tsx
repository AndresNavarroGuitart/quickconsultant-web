"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MatchPhoto = { id: string; url: string };

export default function MatchPhotos({
  matchId,
  photos,
}: {
  matchId: string;
  photos: MatchPhoto[];
}) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", "match");
    formData.append("matchId", matchId);

    const res = await fetch("/api/photos/upload", {
      method: "POST",
      body: formData,
    });

    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo subir la imagen");
      return;
    }

    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });

    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "No se pudo borrar");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.url}
                alt="Foto del partido"
                className="h-14 w-14 rounded-md object-cover"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(photo.id)}
                className="absolute -right-1 -top-1 rounded-full bg-white text-xs text-red-600 shadow disabled:opacity-60"
                aria-label="Borrar foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
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
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryInputRef.current?.click()}
          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
        >
          Elegir de la galería
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
        >
          Tomar foto
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
