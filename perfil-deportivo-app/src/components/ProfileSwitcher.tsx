"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileOption = { id: string; displayName: string; sport: string };

export default function ProfileSwitcher({
  profiles,
  activeProfileId,
}: {
  profiles: ProfileOption[];
  activeProfileId: string;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(profileId: string) {
    if (profileId === activeProfileId) return;

    setSwitching(true);
    setError(null);

    const res = await fetch("/api/profile/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });

    setSwitching(false);

    if (!res.ok) {
      setError("No se pudo cambiar de perfil");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        Perfil activo en esta sesión
      </label>
      <select
        value={activeProfileId}
        disabled={switching}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName} · {p.sport}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
