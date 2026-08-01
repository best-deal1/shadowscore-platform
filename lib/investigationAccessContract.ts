export const STAFF_REPORT_ROLES = ["admin"] as const;

export type InvestigationScope = Readonly<{
  ownerUserId: string;
  organizationId: string | null;
}>;

export type InvestigationActor = Readonly<{
  userId: string;
  activeOrganizationIds: readonly string[];
  profileRole: string;
}>;

export function canReadCustomerInvestigation(actor: InvestigationActor, scope: InvestigationScope): boolean {
  return scope.ownerUserId === actor.userId
    || scope.organizationId !== null && actor.activeOrganizationIds.includes(scope.organizationId);
}

export function canReadStaffReport(actor: InvestigationActor): boolean {
  return STAFF_REPORT_ROLES.some((role) => role === actor.profileRole);
}
