import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import Logo from "@/components/Logo";
import TermsContent from "@/components/TermsContent";
import AcceptTermsForm from "@/components/AcceptTermsForm";

// Ruta standalone (no vive dentro de (app)/(admin)) a proposito: esos
// layouts redirigen para aca si falta la aceptacion, y si esta pagina
// tambien estuviera adentro se generaria un loop de redirects.
export default async function AceptarTerminosPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.dbUser.termsAcceptedAt) redirect("/estadisticas");

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Antes de continuar, aceptá los Términos y Condiciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualizamos nuestros Términos y Condiciones. Para seguir usando
            Potrero Deportivo necesitamos que los leas y los aceptes.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border border-slate-200 bg-white p-4">
          <TermsContent />
        </div>

        <AcceptTermsForm />
      </div>
    </div>
  );
}
