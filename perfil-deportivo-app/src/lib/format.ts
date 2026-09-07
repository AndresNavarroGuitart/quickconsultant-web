// Fechas "de calendario" (matchDate, startDate/endDate de un club) se
// guardan como medianoche UTC del dia que se eligio en un <input type=date>.
// Formatearlas con `new Date(value).toLocaleDateString()` las hace pasar por
// la zona horaria de quien ejecuta el codigo: en un Server Component eso es
// el server (Netlify, UTC), y en el Client Component que hidrata en el
// navegador es la zona del visitante — si difieren, ademas de mostrar un dia
// distinto al cargado, React tira un error de hidratacion (#418) porque el
// texto no coincide entre el render de servidor y el del cliente.
//
// Range: extraemos los componentes de la fecha directamente del string ISO
// (sin pasar por Date/toLocaleDateString), asi el resultado es identico sin
// importar en que huso horario corra el proceso.
export function formatDateOnly(value: string | Date): string {
  const iso = typeof value === "string" ? value : value.toISOString();
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
}
