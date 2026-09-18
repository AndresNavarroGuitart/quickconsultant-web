type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

export default function MatchPhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Todavía no subiste fotos de partidos.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto rounded-md border border-slate-200 bg-white p-4">
      {photos.map((photo) => (
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.caption ?? "Foto de partido"}
          className="h-24 w-24 flex-none rounded-md object-cover"
        />
      ))}
    </div>
  );
}
