"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";

const ITEMS = [
  { href: "/perfil", label: "Mi perfil" },
  { href: "/clubes", label: "Clubes" },
  { href: "/partidos", label: "Partidos" },
  { href: "/estadisticas", label: "Estadísticas" },
];

export default function ProfileNavMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActiveSection = ITEMS.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm font-bold transition-colors hover:text-brand-700 ${
          isActiveSection ? "text-brand-700" : "text-slate-700"
        }`}
      >
        Mi perfil
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 hover:text-brand-700 ${
                pathname.startsWith(item.href) ? "text-brand-700" : "text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
