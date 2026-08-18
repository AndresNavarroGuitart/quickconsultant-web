import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const existing = await prisma.athleteProfile.findUnique({
    where: { userId: ctx.user.id },
  });
  if (existing) redirect("/estadisticas");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Completá tu perfil
      </h1>
      <p className="text-sm text-slate-500">
        Con esto arrancás tu prueba gratuita de 7 días. Después vas a poder
        sumar foto, bio, clubes y partidos.
      </p>
      <OnboardingForm />
    </div>
  );
}
