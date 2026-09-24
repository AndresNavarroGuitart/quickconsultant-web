"use client";

import { useMemo, useState } from "react";

export type UserActivityRow = {
  id: string;
  email: string;
  profileSummary: string;
  totalClubs: number;
  totalMatches: number;
  lastMatchLabel: string;
  lastSignInLabel: string;
  createdAtLabel: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function UserActivityTable({ rows }: { rows: UserActivityRow[] }) {
  const [search, setSearch] = useState("");

  // El listado ya viene ordenado por ultimo acceso (mas cerca a mas lejos)
  // desde el servidor: filtrar acá no le cambia el orden.
  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return rows;
    return rows.filter(
      (r) => normalize(r.email).includes(q) || normalize(r.profileSummary).includes(q)
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por email o perfil..."
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
      />
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Perfil</th>
              <th className="px-4 py-2">Clubes</th>
              <th className="px-4 py-2">Partidos</th>
              <th className="px-4 py-2">Último partido</th>
              <th className="px-4 py-2">Último acceso</th>
              <th className="px-4 py-2">Alta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2">
                  {r.profileSummary || <span className="text-slate-500">Sin perfil</span>}
                </td>
                <td className="px-4 py-2">{r.totalClubs}</td>
                <td className="px-4 py-2">{r.totalMatches}</td>
                <td className="px-4 py-2">{r.lastMatchLabel}</td>
                <td className="px-4 py-2">{r.lastSignInLabel}</td>
                <td className="px-4 py-2">{r.createdAtLabel}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={7}>
                  {rows.length === 0
                    ? "Todavía no hay usuarios registrados."
                    : "Ningún usuario coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
