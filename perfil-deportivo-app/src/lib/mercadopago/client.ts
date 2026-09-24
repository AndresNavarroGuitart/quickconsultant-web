import { MercadoPagoConfig } from "mercadopago";

// Instanciación perezosa por el mismo motivo que src/lib/supabase/admin.ts:
// si se creara a nivel de módulo, el build fallaría al recolectar datos de
// página apenas falte MERCADOPAGO_ACCESS_TOKEN (antes de tener credenciales
// reales de MercadoPago).
let cached: MercadoPagoConfig | null = null;

export function getMercadoPagoConfig(): MercadoPagoConfig {
  if (!cached) {
    cached = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      // Sin timeout, una respuesta lenta de MP deja la funcion colgada hasta
      // el limite del hosting (Netlify corta a los 10s por defecto) y el
      // usuario ve un error generico en vez de uno claro.
      options: { timeout: 5000 },
    });
  }
  return cached;
}
