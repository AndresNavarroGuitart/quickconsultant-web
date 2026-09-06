import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { MAX_PROFILES_PER_USER } from "@/lib/athlete/profileLimit";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  // Sin perfiles: es el alta inicial. Con 1: puede ser "Agregar perfil"
  // (hasta el máximo de la cuenta). Con el máximo ya alcanzado, no hay nada
  // que crear.
  const hasProfiles = ctx.profiles.length > 0;
  if (ctx.profiles.length >= MAX_PROFILES_PER_USER) redirect("/perfil");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        {hasProfiles ? "Agregar perfil" : "Completá tu perfil"}
      </h1>
      <p className="text-sm text-slate-500">
        {hasProfiles
          ? "Podés cargar un segundo perfil dentro de la misma cuenta (por ejemplo, el de un hijo/a) y elegir cuál ver desde Mi perfil."
          : "Con esto arrancás tu prueba gratuita de 7 días. Después vas a poder sumar foto, clubes y partidos."}
      </p>
      <OnboardingForm />
    </div>
  );
}
