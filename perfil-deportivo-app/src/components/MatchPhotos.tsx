"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/compressImage";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewUrl(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);

    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append("file", compressed);
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
              <button
                type="button"
                onClick={() => setPreviewUrl(photo.url)}
                aria-label="Ver foto más grande"
                className="block"
              >
                <img
                  src={photo.url}
                  alt="Foto del partido"
                  className="h-14 w-14 cursor-pointer rounded-md object-cover"
                />
              </button>
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

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Foto del partido ampliada"
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
