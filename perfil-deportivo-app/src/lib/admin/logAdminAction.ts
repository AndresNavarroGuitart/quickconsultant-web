import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Registro de auditoria: quien (admin), sobre quien (target, si aplica) y
// que accion. Deliberadamente no bloquea la operacion principal si falla —
// perder el registro de auditoria no debería tumbar la accion de admin en
// si (ej. bloquear una cuenta problemática no puede depender de esto).
export async function logAdminAction({
  adminUserId,
  targetUserId,
  action,
  metadata,
}: {
  adminUserId: string;
  targetUserId?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.adminActionLog.create({
      data: {
        adminUserId,
        targetUserId: targetUserId ?? null,
        action,
        metadata,
      },
    });
  } catch (err) {
    console.error(`[logAdminAction] no se pudo registrar la accion "${action}"`, err);
  }
}
