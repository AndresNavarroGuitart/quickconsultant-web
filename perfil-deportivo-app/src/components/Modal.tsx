"use client";

import { useEffect, useId, useRef } from "react";

// Popup genérico reutilizado por las acciones de cuenta (cambiar
// contraseña, dar de baja). Usa el elemento nativo <dialog>: showModal()
// mueve el foco adentro, lo atrapa (Tab no se escapa hacia la página de
// atrás) y lo devuelve solo a lo que lo tenía antes al cerrar -- antes nada
// de eso pasaba (era un <div> con role="dialog" sin manejo de foco propio),
// así que alguien navegando con teclado o lector de pantalla seguía
// tabulando por la página de atrás durante la acción más destructiva de la
// app.
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape dispara "cancel" antes de cerrarse solo: se intercepta para
      // que el padre decida (algunos, como el de baja de cuenta, resetean
      // su propio estado de "armado" al cerrar en vez de solo ocultar esto).
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Un click en el propio <dialog> (no en su contenido, que por eso
        // tiene su stopPropagation) es un click en el backdrop.
        if (e.target === ref.current) onClose();
      }}
      className="w-full max-w-md border-0 bg-transparent p-0 backdrop:bg-slate-900/50"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-lg bg-white p-6 shadow-xl">
        <h2 id={titleId} className="mb-4 text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
