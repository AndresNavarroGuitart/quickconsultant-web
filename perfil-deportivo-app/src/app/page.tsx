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

const STEPS = [
  {
    color: "var(--color-sport-cyan)",
    title: "Creá tu cuenta",
    description: "Registrate en un minuto y arrancá tu prueba gratis de 7 días.",
    icon: IconAccount,
  },
  {
    color: "var(--color-sport-pink)",
    title: "Armá tu perfil",
    description:
      "Cargá el deporte, la posición y una foto — tuyos o los de tu hijo/a.",
    icon: IconProfile,
  },
  {
    color: "var(--color-sport-yellow)",
    title: "Sumá tus partidos",
    description: "Anotá los clubes por los que pasaste y cada partido jugado.",
    icon: IconJersey,
  },
  {
    color: "var(--color-brand-600)",
    title: "Compartí tus stats",
    description: "Mirá tus estadísticas y compartí el perfil público en redes.",
    icon: IconShare,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
          <Logo className="shrink-0" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="whitespace-nowrap text-xs font-medium text-slate-600 hover:text-brand-700 sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 sm:px-4 sm:py-2 sm:text-sm"
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
              La carrera deportiva de tu familia, en un solo lugar.
            </h1>
            <p className="max-w-md text-slate-600">
              Registrá clubes, partidos y estadísticas — tuyos o los de tu
              hijo/a — sumá fotos, y armá un perfil deportivo listo para
              compartir con clubes, técnicos y familiares.
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
              7 días de prueba gratis. Después, $10.000 (Ar$) por mes.
            </p>
          </div>

          <TeamShieldIllustration className="mx-auto w-full max-w-[220px] sm:max-w-[260px]" />
        </section>

        <section className="flex flex-col gap-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900">
              Cómo funciona
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuatro pasos y tu perfil deportivo ya está armado.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
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

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-b from-brand-600 to-brand-800 px-6 py-10 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Empezá a registrar tu carrera hoy
          </h2>
          <p className="max-w-md text-sm text-brand-100">
            7 días gratis, sin tarjeta. Cancelás cuando quieras.
          </p>
          <Link
            href="/signup"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Crear mi cuenta gratis
          </Link>
        </section>
      </main>
    </div>
  );
}

function IconAccount({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" />
      <path d="M18.5 5v4M16.5 7h4" />
    </svg>
  );
}

function IconProfile({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10.5" r="2" />
      <path d="M6 16c.6-1.7 1.9-2.5 3-2.5s2.4.8 3 2.5" />
      <path d="M14.5 9.5h4M14.5 13h4" />
    </svg>
  );
}

function IconJersey({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3.5 3.5 6.5 5.5 10 7 9v10.5h10V9l1.5 1 2-3.5L16 3.5c-.5 1.3-1.8 2-4 2s-3.5-.7-4-2Z" />
    </svg>
  );
}

function IconShare({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 20V13M9.5 20V9M15 20v-6M20 20V4" />
    </svg>
  );
}
