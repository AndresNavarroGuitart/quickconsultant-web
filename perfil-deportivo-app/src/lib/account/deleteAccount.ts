import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PHOTOS_BUCKET = "athlete-photos";

// Baja de cuenta autogestionada (Mi Perfil > Dar de baja mi cuenta).
//
// Borra toda la información confidencial del cliente -- perfiles deportivos
// (incluye datos de menores y sus responsables), fotos, clubes, partidos y
// sugerencias -- y elimina su usuario de Supabase Auth (no puede volver a
// ingresar, ni reseteando la contraseña). La fila de User NO se borra: se
// conserva anonimizada y marcada con deletedAt para que el admin mantenga
// el registro de que la cuenta existió y para no romper las Subscription/
// Payment asociadas, que se conservan tal cual por obligaciones de
// facturación/contables (no son "información confidencial del cliente" en
// el sentido deportivo/personal que motiva este borrado).
export async function deleteAccount(userId: string) {
  // 1) Storage: mejor esfuerzo. Si el bucket falla no bloqueamos la baja --
  // la base de datos es la fuente de verdad de qué hay que borrar, y un
  // archivo huérfano en Storage no expone datos de contacto ni permite
  // volver a ingresar.
  try {
    await deleteAllUserFiles(userId);
  } catch (err) {
    console.error(
      `[deleteAccount] no se pudieron borrar archivos de Storage del usuario ${userId}`,
      err
    );
  }

  // 2) Base de datos: todo en una transacción para no dejar un estado a
  // medio borrar si algo falla a mitad de camino.
  const anonymizedEmail = `baja-${userId}@potrerodeportivo.local`;
  await prisma.$transaction([
    // Cascada a Photo, AthleteClub y Match (onDelete: Cascade en el schema).
    prisma.athleteProfile.deleteMany({ where: { userId } }),
    prisma.suggestion.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { email: anonymizedEmail, isAdmin: false, deletedAt: new Date() },
    }),
  ]);

  // 3) Supabase Auth: borra las credenciales reales (email/contraseña). Es
  // lo que impide volver a ingresar de verdad; el chequeo de deletedAt en
  // los layouts es un resguardo extra por si esta llamada falla.
  try {
    await getSupabaseAdmin().auth.admin.deleteUser(userId);
  } catch (err) {
    console.error(
      `[deleteAccount] no se pudo borrar el usuario ${userId} de Supabase Auth`,
      err
    );
  }
}

async function deleteAllUserFiles(userId: string) {
  const supabase = getSupabaseAdmin();
  const paths = await listFilesRecursive(supabase, userId);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
  if (error) throw error;
}

// El bucket no tiene carpetas reales: son prefijos ("<userId>/avatar/...",
// "<userId>/match/..."). list() solo devuelve un nivel, así que hay que
// bajar recursivamente por cada entrada que sea "carpeta" (id null) hasta
// juntar las rutas de archivo reales para poder borrarlas.
async function listFilesRecursive(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  prefix: string
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .list(prefix, { limit: 1000 });
  if (error || !data) return [];

  const files: string[] = [];
  for (const entry of data) {
    const fullPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      files.push(...(await listFilesRecursive(supabase, fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}
