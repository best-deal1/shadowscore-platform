export type InvestigationCheckoutResult<T> = {
  email: string;
  intakeId: string;
  intent: T;
};

type InvestigationCheckoutOptions<T> = {
  intakeId?: string;
  email: string;
  authenticatedEmail: string;
  persistIntake: (email: string) => Promise<string>;
  createIntent: (intakeId: string) => Promise<T>;
};

export function checkoutEmail(email: string, authenticatedEmail: string) {
  return (email.trim() || authenticatedEmail.trim()).toLowerCase();
}

export async function prepareInvestigationCheckout<T>({
  intakeId,
  email,
  authenticatedEmail,
  persistIntake,
  createIntent,
}: InvestigationCheckoutOptions<T>): Promise<InvestigationCheckoutResult<T>> {
  const resolvedEmail = checkoutEmail(email, authenticatedEmail);
  if (!resolvedEmail || !resolvedEmail.includes("@")) {
    throw new Error("Enter a valid customer email to continue.");
  }

  const resolvedIntakeId = intakeId || await persistIntake(resolvedEmail);
  if (!resolvedIntakeId) {
    throw new Error("The investigation could not be saved. Please try again.");
  }

  const intent = await createIntent(resolvedIntakeId);
  return { email: resolvedEmail, intakeId: resolvedIntakeId, intent };
}
