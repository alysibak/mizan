// Who runs this deployment and how to reach them. Set in the environment so
// each self-hosted copy states its own operator, not someone else's.

export const LEGAL_UPDATED = "7 October 2026";

export function operatorName(): string {
  return process.env.OPERATOR_NAME?.trim() || "the operator of this Mizan service";
}

export function contactEmail(): string | null {
  return process.env.CONTACT_EMAIL?.trim() || null;
}
