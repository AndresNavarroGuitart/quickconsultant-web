import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Cuenta bloqueada — Potrero Deportivo",
};

// A diferencia de /cuenta-eliminada, acá el usuario de Supabase Auth sigue
// existiendo (el bloqueo es reversible), por eso hace falta un botón para
// cerrar sesión explícitamente. Standalone y fuera de (app)/(admin) para no
// heredar el gate de esos layouts.
export default function CuentaBloqueadaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">
          Tu cuenta fue bloqueada
        </h1>
        <p className="text-sm text-slate-600">
          Un administrador restringió el acceso a esta cuenta. Si creés que
          es un error, escribinos a{" "}
          <a
            href="mailto:quickconsultora@gmail.com"
            className="font-medium text-brand-600 hover:underline"
          >
            quickconsultora@gmail.com
          </a>
          .
        </p>
        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
