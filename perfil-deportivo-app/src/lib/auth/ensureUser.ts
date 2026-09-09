import { cache } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const TRIAL_DAYS = 7;

// Crea la fila de negocio en public.User la primera vez que un usuario
// autenticado de Supabase entra a la app (no depende de un callback de
// confirmación de email especifico: se ejecuta en el layout de (app), asi
// que funciona sin importar por donde haya vuelto el usuario tras confirmar).
//
// cache() dedupea llamadas dentro del mismo request (el layout y la page
// lo llaman por separado) para evitar dos upserts concurrentes sobre el
// mismo id; el catch de P2002 es un resguardo extra para el caso de dos
// requests realmente concurrentes (ej. dos tabs abriendo la app a la vez).
export const ensureUser = cache(async (supabaseUser: SupabaseUser) => {
  try {
    return await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {},
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        // Si ya tildo el checkbox de Terminos en el signup, esa fecha viaja
        // en el user_metadata de Supabase; asi no le repetimos el gate al
        // primer ingreso. Si no vino (cuentas viejas, o si entro por otro
        // flujo), queda null y /aceptar-terminos lo intercepta.
        termsAcceptedAt: supabaseUser.user_metadata?.termsAcceptedAt
          ? new Date(supabaseUser.user_metadata.termsAcceptedAt)
          : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.user.findUniqueOrThrow({ where: { id: supabaseUser.id } });
    }
    throw err;
  }
});
