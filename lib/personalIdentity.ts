export const IDENTITY_PROVENANCE = {
  email: "user_submitted_email",
  phone: "user_submitted_phone",
  name: "user_submitted_name",
  username: "user_submitted_username",
  referenceImage: "user_submitted_reference_image",
} as const;

export type SubmittedIdentitySignal = {
  value: string;
  provenance: (typeof IDENTITY_PROVENANCE)[keyof typeof IDENTITY_PROVENANCE];
  evidenceStatus: "submitted_reference";
};

export type ReferenceImageSignal = SubmittedIdentitySignal & {
  fileName: string;
  mediaType: string;
  size: number;
  comparisonStatus: "not_operational";
  storagePath?: string;
};

export type PersonalIdentitySignals = {
  email?: SubmittedIdentitySignal;
  phone?: SubmittedIdentitySignal;
  name?: SubmittedIdentitySignal;
  username?: SubmittedIdentitySignal;
  referenceImage?: ReferenceImageSignal;
};

const clean = (value?: string) => value?.trim() || undefined;

export function createPersonalIdentitySignals(input: { email?: string; phone?: string; name?: string; username?: string; referenceImage?: { fileName: string; mediaType: string; size: number; storagePath?: string } }): PersonalIdentitySignals {
  const signal = (value: string | undefined, provenance: SubmittedIdentitySignal["provenance"]): SubmittedIdentitySignal | undefined => value ? { value, provenance, evidenceStatus: "submitted_reference" } : undefined;
  const email = clean(input.email)?.toLowerCase();
  const phone = clean(input.phone);
  const name = clean(input.name);
  const username = clean(input.username)?.replace(/^@/, "");
  return {
    email: signal(email, IDENTITY_PROVENANCE.email),
    phone: signal(phone, IDENTITY_PROVENANCE.phone),
    name: signal(name, IDENTITY_PROVENANCE.name),
    username: signal(username, IDENTITY_PROVENANCE.username),
    referenceImage: input.referenceImage ? { value: input.referenceImage.fileName, fileName: input.referenceImage.fileName, mediaType: input.referenceImage.mediaType, size: input.referenceImage.size, storagePath: input.referenceImage.storagePath, provenance: IDENTITY_PROVENANCE.referenceImage, evidenceStatus: "submitted_reference", comparisonStatus: "not_operational" } : undefined,
  };
}

export function hasIdentityField(signals?: PersonalIdentitySignals) {
  return Boolean(signals?.email?.value || signals?.phone?.value || signals?.name?.value || signals?.username?.value);
}

export function primaryIdentityTarget(signals: PersonalIdentitySignals) {
  return signals.email?.value || signals.phone?.value || signals.username?.value || signals.name?.value || "";
}

export function personalIdentityGaps(signals: PersonalIdentitySignals, independentSourceCount: number) {
  return [
    !signals.phone && "Phone corroboration was not supplied or observed.",
    !signals.name && "Name corroboration was not supplied or observed.",
    signals.referenceImage && "Automated reference-image comparison is not operational. The image is reference material only.",
    independentSourceCount < 2 && "Fewer than two independent public sources corroborate the identity.",
  ].filter((value): value is string => Boolean(value));
}
