// Circulo rojo con numero para el link de "Notificaciones" del nav (app y
// admin). Puramente presentacional: quien lo usa decide cuantas hay sin leer.
export default function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
