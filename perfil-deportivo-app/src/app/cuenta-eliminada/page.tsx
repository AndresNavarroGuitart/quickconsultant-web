import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Cuenta dada de baja — Potrero Deportivo",
};

// Pantalla a la que se llega despues de confirmar la baja de cuenta desde
// Mi Perfil (ver DeleteAccountSection.tsx). Standalone y publica -- la
// sesion ya no existe en este punto -- asi que no depende de estar
// logueado, a diferencia de /aceptar-terminos.
export default function CuentaEliminadaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">
          Tu cuenta fue dada de baja
        </h1>
        <p className="text-sm text-slate-600">
          Borramos tus perfiles deportivos, fotos, estadísticas de partidos,
          clubes y sugerencias. Ya no podés ingresar con esta cuenta.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
