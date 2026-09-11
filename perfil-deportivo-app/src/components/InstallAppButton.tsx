"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

// Chrome/Edge/Android disparan este evento cuando el sitio cumple los
// requisitos de instalación (manifest + iconos); no es un tipo estandar de
// TypeScript todavia.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Botón para "generar un acceso directo" de la app en el celular o la PC.
// Donde el navegador soporta el prompt nativo (Chrome/Edge, Android o
// desktop) lo dispara directo; si no (Safari/iOS no lo soporta, o Chrome ya
// lo descartó una vez) se ofrece el instructivo manual como respaldo.
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (!deferredPrompt) {
      setShowHelp(true);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="self-start rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Crear acceso directo
      </button>

      <Modal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Crear acceso directo"
      >
        <div className="flex flex-col gap-4 text-sm text-slate-700">
          <div>
            <p className="font-medium text-slate-900">En el celular (Android)</p>
            <p className="text-slate-600">
              Menú (⋮) del navegador → &quot;Instalar app&quot; o &quot;Agregar a
              pantalla de inicio&quot;.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900">En el iPhone (Safari)</p>
            <p className="text-slate-600">
              Botón Compartir (□↑) → &quot;Agregar a pantalla de inicio&quot;.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900">En la computadora</p>
            <p className="text-slate-600">
              En Chrome o Edge, el ícono de instalar (⊕) en la barra de
              direcciones, a la derecha.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Entendido
          </button>
        </div>
      </Modal>
    </>
  );
}
