import { prisma } from "@/lib/prisma";
import AdminSuggestionsManager from "@/components/AdminSuggestionsManager";

export default async function AdminSugerenciasPage() {
  const suggestions = await prisma.suggestion.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Sugerencias</h1>
      <AdminSuggestionsManager
        suggestions={suggestions.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          status: s.status,
          adminNote: s.adminNote,
          userEmail: s.user.email,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
