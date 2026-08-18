import NotificationComposer from "@/components/NotificationComposer";

export default function AdminNotificacionesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Notificaciones
      </h1>
      <p className="text-sm text-slate-500">
        Enviá un aviso a todos los usuarios o a uno en particular.
      </p>
      <NotificationComposer />
    </div>
  );
}
