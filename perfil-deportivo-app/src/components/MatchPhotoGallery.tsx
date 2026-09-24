"use client";

import { useEffect, useState } from "react";

type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

export default function MatchPhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewUrl(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewUrl]);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Todavía no subiste fotos de partidos.
      </p>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto rounded-md border border-slate-200 bg-white p-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setPreviewUrl(photo.url)}
            aria-label="Ver foto más grande"
            className="block flex-none"
          >
            <img
              src={photo.url}
              alt={photo.caption ?? "Foto de partido"}
              className="h-24 w-24 cursor-pointer rounded-md object-cover"
            />
          </button>
        ))}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Foto de partido ampliada"
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
    </>
  );
}
