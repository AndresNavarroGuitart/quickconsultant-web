import Link from "next/link";
import Logo from "@/components/Logo";
import TermsContent from "@/components/TermsContent";

export const metadata = {
  title: "Términos y Condiciones — Potrero Deportivo",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-brand-700"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Términos y Condiciones
        </h1>
        <TermsContent />
      </main>
    </div>
  );
}
