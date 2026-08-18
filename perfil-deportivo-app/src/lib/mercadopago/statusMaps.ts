import type { SubscriptionStatus, PaymentStatus } from "@/generated/prisma/enums";

const SUBSCRIPTION_STATUS_MAP: Record<string, SubscriptionStatus> = {
  pending: "PENDING",
  authorized: "AUTHORIZED",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

export function mapSubscriptionStatus(mpStatus: string | undefined): SubscriptionStatus {
  if (!mpStatus) return "PENDING";
  return SUBSCRIPTION_STATUS_MAP[mpStatus] ?? "PENDING";
}

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  pending: "PENDING",
  approved: "APPROVED",
  authorized: "APPROVED",
  in_process: "IN_PROCESS",
  in_mediation: "IN_PROCESS",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "CHARGED_BACK",
};

export function mapPaymentStatus(mpStatus: string | undefined): PaymentStatus {
  if (!mpStatus) return "PENDING";
  return PAYMENT_STATUS_MAP[mpStatus] ?? "PENDING";
}
