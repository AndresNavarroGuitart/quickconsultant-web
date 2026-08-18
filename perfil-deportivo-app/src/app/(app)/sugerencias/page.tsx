import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/getSessionContext";
import { prisma } from "@/lib/prisma";
import SuggestionsManager from "@/components/SuggestionsManager";

export default async function SugerenciasPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const suggestions = await prisma.suggestion.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Sugerencias</h1>
      <p className="text-sm text-slate-500">
        Pedinos funcionalidades nuevas — las vamos priorizando según lo que
        más nos piden.
      </p>
      <SuggestionsManager
        initialSuggestions={suggestions.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          status: s.status,
          adminNote: s.adminNote,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
