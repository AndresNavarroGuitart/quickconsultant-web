import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSessionContext,
  ACTIVE_PROFILE_COOKIE,
} from "@/lib/auth/getSessionContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/lib/validation/accountSchema";
import { deleteAccount } from "@/lib/account/deleteAccount";

export const runtime = "nodejs";

// Baja de cuenta autogestionada desde Mi Perfil. Irreversible: ver
// deleteAccount.ts para el detalle de qué se borra y qué se conserva.
//
// A proposito NO usa requireSession: una cuenta bloqueada por el admin
// (ej. mientras se investiga un abuso) tiene que poder seguir pidiendo su
// propia baja igual -- bloquear el acceso a la app no es motivo para
// impedirle borrar sus datos. El chequeo de deletedAt de aca abajo es el
// unico que hace falta (evita procesar una baja dos veces).
export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (ctx.dbUser.deletedAt) {
    return NextResponse.json(
      { error: "Esta cuenta ya fue dada de baja" },
      { status: 400 }
    );
  }

  const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Falta confirmar la baja escribiendo ELIMINAR" },
      { status: 400 }
    );
  }

  try {
    await deleteAccount(ctx.user.id);
  } catch (err) {
    console.error(`[account/delete] no se pudo completar la baja de ${ctx.user.id}`, err);
    return NextResponse.json(
      {
        error:
          "No pudimos cancelar tu suscripción en MercadoPago, así que no se procesó la baja. Probá de nuevo en unos minutos o escribinos si el problema sigue.",
      },
      { status: 502 }
    );
  }

  // Corta la sesión actual ya mismo (el borrado del usuario en Supabase Auth
  // ya la invalida, pero esto evita depender de que el próximo getUser() lo
  // note) y limpia la cookie de perfil activo, que ya no apunta a nada.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVE_PROFILE_COOKIE);

  return NextResponse.json({ ok: true });
}
