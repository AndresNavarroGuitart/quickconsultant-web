import { z } from "zod";

// El usuario debe escribir esta palabra exacta para confirmar la baja de
// cuenta (ya se chequea en el cliente con un input deshabilitado hasta que
// coincide; esto lo vuelve a validar server-side por si alguien pega el
// POST directo).
export const deleteAccountSchema = z.object({
  confirm: z.literal("ELIMINAR"),
});
