type AccessInput = {
  isAdmin: boolean;
  trialEndsAt: Date;
  hasActiveSubscription: boolean;
};

export function getAccessStatus({
  isAdmin,
  trialEndsAt,
  hasActiveSubscription,
}: AccessInput) {
  const trialActive = trialEndsAt.getTime() > Date.now();
  const hasAccess = isAdmin || trialActive || hasActiveSubscription;

  return { hasAccess, trialActive, isAdmin, hasActiveSubscription };
}
