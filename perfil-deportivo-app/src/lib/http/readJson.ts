// `request.json()` tira si el body no es JSON válido (o está vacío), y esa
// excepción no capturada se traduce en un 500 genérico en vez de un 400
// claro. Devuelve `undefined` como sentinela de "no se pudo parsear" --
// JSON.parse nunca produce `undefined` como valor real, así que no hay
// ambigüedad con un body legítimo.
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
