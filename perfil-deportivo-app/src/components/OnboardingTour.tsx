"use client";

import { useEffect, useState } from "react";
import { BellIcon, EnvelopeIcon, InfoIcon } from "@/components/icons";

const STORAGE_PREFIX = "potrero-onboarding-seen-v1:";

type Step = {
  title: string;
  body: React.ReactNode;
};

const STEPS: Step[] = [
  {
    title: "1. Armá tu perfil",
    body: (
      <p>
        Lo primero es cargar tu perfil deportivo: nombre, deporte, posición y
        una foto. Lo hacés desde <strong>Mi perfil</strong> (o tocando{" "}
        <strong>Agregar perfil</strong> si es para un familiar).
      </p>
    ),
  },
  {
    title: "2. Registrá tus clubes",
    body: (
      <p>
        Después cargá los clubes por los que pasaste (o el actual), con las
        fechas y la liga o categoría. Se hace desde{" "}
        <strong>Clubes</strong>, y sirve para ordenar el historial de
        partidos por club.
      </p>
    ),
  },
  {
    title: "3. Cargá tus partidos",
    body: (
      <div className="flex flex-col gap-2">
        <p>Con el perfil y el club listos, ya podés cargar partidos. Hay dos formas:</p>
        <ul className="flex flex-col gap-1.5 rounded-md bg-white/10 p-3 text-[13px]">
          <li>
            <strong>Agregar partido:</strong> completás el formulario a mano
            después de jugar, con el resultado y las estadísticas.
          </li>
          <li>
            <strong>Registrar en vivo:</strong> durante el partido vas
            tocando cada jugada (pases, duelos, goles...) y la app arma sola
            las estadísticas y el resultado al terminar. Disponible según tu
            deporte y posición.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "4. Seguí tu evolución",
    body: (
      <div className="flex flex-col gap-2">
        <p>
          En <strong>Estadísticas</strong> vas a ver tu historial de
          partidos y gráficos con tu rendimiento, con filtros por club,
          campeonato o rival.
        </p>
        <p className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-accent-500"
            aria-hidden="true"
          >
            <BellIcon className="h-5 w-5" />
          </span>
          Las <strong>Notificaciones</strong> son avisos nuestros (arriba a
          la derecha), y
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-accent-500"
            aria-hidden="true"
          >
            <EnvelopeIcon className="h-5 w-5" />
          </span>
          las <strong>Sugerencias</strong> son para escribirnos ideas o
          reportar algo.
        </p>
      </div>
    ),
  },
];

export default function OnboardingTour({ userId }: { userId: string }) {
  const storageKey = STORAGE_PREFIX + userId;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Se muestra la primera vez que este usuario entra en este navegador. Va
  // en un efecto (no en el initializer de useState) porque localStorage no
  // existe en el render de servidor.
  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true);
      }
    } catch {
      // sin acceso a localStorage (modo privado, etc.): no se muestra
    }
  }, [storageKey]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // sin espacio / modo privado: se vuelve a mostrar la próxima vez
    }
  }

  // Botón "?" del nav: lo puede abrir el usuario cuando quiera, ya haya
  // visto el tour o no.
  function openManually() {
    setStep(0);
    setOpen(true);
  }

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <>
      <button
        type="button"
        onClick={openManually}
        className="text-slate-700 transition-colors hover:text-brand-700"
        title="Cómo funciona la app"
        aria-label="Cómo funciona la app"
      >
        <InfoIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-brand-700 p-5 text-white shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Potrero<span className="text-accent-500">Deportivo</span>
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="shrink-0 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-accent-500">{current.title}</p>
              <div className="text-sm leading-relaxed text-white/90">{current.body}</div>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === step ? "bg-accent-500" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-sm font-medium text-white/70 hover:text-white disabled:invisible"
              >
                Atrás
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md bg-accent-500 px-4 py-2 text-sm font-bold text-white hover:bg-accent-600"
                >
                  Entendido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
