import Link from "next/link";
import Logo from "@/components/Logo";
import TeamShieldIllustration from "@/components/TeamShieldIllustration";
import WavyBanner from "@/components/WavyBanner";

const FEATURES = [
  {
    color: "var(--color-sport-cyan)",
    title: "Clubes y partidos",
    description:
      "Registrá los clubes en los que jugaste, tus partidos, contrincantes y puntos.",
  },
  {
    color: "var(--color-sport-pink)",
    title: "Perfil compartible",
    description:
      "Un link público con tus fotos y estadísticas, listo para compartir en redes.",
  },
  {
    color: "var(--color-sport-yellow)",
    title: "Fotos desde el celular",
    description: "Subí fotos de la galería o sacalas directo con la cámara.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <WavyBanner className="h-6 w-full sm:h-8" />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 py-12 sm:py-20">
        <section className="grid items-center gap-10 sm:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Todos los partidos registrados en un solo lugar.
            </h1>
            <p className="max-w-md text-slate-600">
              Cargá tus clubes, partidos y puntos, sumá fotos, y armá un
              perfil comercial listo para compartir en redes sociales.
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700"
              >
                Iniciar sesión
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              7 días de prueba gratis. Después, u$s10 por mes.
            </p>
          </div>

          <TeamShieldIllustration className="mx-auto w-full max-w-[220px] sm:max-w-[260px]" />
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-md border border-slate-200 bg-white p-5"
            >
              <span
                className="mb-3 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: feature.color }}
              />
              <h2 className="text-sm font-semibold text-slate-900">
                {feature.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Potrero Deportivo
      </footer>
    </div>
  );
}
