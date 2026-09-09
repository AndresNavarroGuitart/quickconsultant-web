import Link from "next/link";

// Footer legal global: se monta una sola vez en el layout raiz (src/app/layout.tsx)
// asi aparece en todas las secciones (portada, login/signup, app, admin,
// perfil publico) sin repetirlo pagina por pagina.
export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-1 border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400">
      <p>
        © {new Date().getFullYear()} Potrero Deportivo. Todos los derechos
        reservados. Desarrollado por{" "}
        <a
          href="https://quickconsultant.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-500 hover:text-brand-600 hover:underline"
        >
          QuickConsultant
        </a>
        .
      </p>
      <Link href="/terminos" className="hover:text-brand-600 hover:underline">
        Términos y Condiciones
      </Link>
    </footer>
  );
}
