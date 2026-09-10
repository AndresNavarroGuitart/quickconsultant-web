type AccessInput = {
  isAdmin: boolean;
  trialEndsAt: Date;
  hasActiveSubscription: boolean;
  isBlocked: boolean;
};

// Interruptor de desarrollo: con DISABLE_ACCESS_GATING=true en el .env, nadie
// queda bloqueado por trial vencido o falta de suscripción (util mientras se
// sigue construyendo la app). trialActive/hasActiveSubscription siguen
// reflejando el estado real para no romper los avisos de la UI — solo se
// fuerza el resultado final (hasAccess). Sacar la variable de entorno (o
// ponerla en false) restaura el gating real sin tocar código.
const GATING_DISABLED = process.env.DISABLE_ACCESS_GATING === "true";

export function getAccessStatus({
  isAdmin,
  trialEndsAt,
  hasActiveSubscription,
  isBlocked,
}: AccessInput) {
  const trialActive = trialEndsAt.getTime() > Date.now();
  // Un bloqueo administrativo gana por sobre todo lo demás, incluso el
  // interruptor de desarrollo y ser admin: bloquear a alguien que no debería
  // tener que dejar de serlo para que el bloqueo funcione.
  const hasAccess =
    !isBlocked && (GATING_DISABLED || isAdmin || trialActive || hasActiveSubscription);

  return { hasAccess, trialActive, isAdmin, hasActiveSubscription, isBlocked };
}
