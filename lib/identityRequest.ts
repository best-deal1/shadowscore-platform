import type { IdentityRequestedAttribute } from "./personalIdentity";

export type IdentityRequestInterpretation = {
  rawRequest: string;
  emails: string[];
  phones: string[];
  usernames: string[];
  personName?: string;
  organization?: string;
  role?: string;
  requestedAttributes: IdentityRequestedAttribute[];
  confidence: "high" | "medium" | "low";
  needsConfirmation: boolean;
  reasons: string[];
};

const REQUESTED_ATTRIBUTE_PATTERNS: Array<{ attribute: IdentityRequestedAttribute; expression: RegExp }> = [
  { attribute: "phone", expression: /(?:^|[\s,;])(?:מספר\s+)?(?:נייד|טלפון|סלולרי|mobile(?:\s+number)?|phone(?:\s+number)?|cell(?:\s+number)?)(?=$|[\s,;])/iu },
  { attribute: "email", expression: /(?:^|[\s,;])(?:אימייל|מייל|דוא["״']?ל|email(?:\s+address)?)(?=$|[\s,;])/iu },
  { attribute: "social_profile", expression: /(?:^|[\s,;])(?:פרופיל|רשתות\s+חברתיות|חשבון\s+חברתי|social\s+profile|public\s+profile)(?=$|[\s,;])/iu },
  { attribute: "identity_match", expression: /(?:^|[\s,;])(?:אימות\s+זהות|זהות|identity(?:\s+match)?|verification)(?=$|[\s,;])/iu },
];

const ROLE_PATTERNS: Array<{ label: string; expression: RegExp }> = [
  { label: "בעלים", expression: /(?:^|[\s,;])(?:בעלים|בעלים\s+שותף|בעלת\s+העסק|בעל\s+העסק)(?=$|[\s,;])/iu },
  { label: "מנכ״ל", expression: /(?:^|[\s,;])(?:מנכ["״']?ל|מנהלת?\s+כללי[ת]?)(?=$|[\s,;])/iu },
  { label: "מייסד", expression: /(?:^|[\s,;])(?:מייסד|מייסדת|שותף\s+מייסד|שותפה\s+מייסדת)(?=$|[\s,;])/iu },
  { label: "דירקטור", expression: /(?:^|[\s,;])(?:דירקטור|דירקטורית)(?=$|[\s,;])/iu },
  { label: "owner", expression: /\b(?:owner|co-owner|business owner)\b/iu },
  { label: "CEO", expression: /\b(?:ceo|chief executive officer)\b/iu },
  { label: "founder", expression: /\b(?:founder|co-founder)\b/iu },
  { label: "director", expression: /\b(?:director|managing director)\b/iu },
];

const ACTION_PATTERNS = [
  /(?:האם\s+)?(?:אתה\s+)?יכול\s+להשיג/giu,
  /(?:תשיג|תמצא|מצא|חפש|לאתר|אתר|מבקש|רוצה)/giu,
  /\b(?:can\s+you|please|find|get|locate|look\s+up|search\s+for|need|want)\b/giu,
];

const cleanSpaces = (value: string) => value.replace(/\s+/gu, " ").trim();
const cleanClause = (value: string) => cleanSpaces(value.replace(/^[\s:,-]+|[\s:,-]+$/gu, ""));
const quoted = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function stripPattern(value: string, expression: RegExp) {
  return cleanSpaces(value.replace(new RegExp(expression.source, expression.flags.includes("g") ? expression.flags : `${expression.flags}g`), " "));
}

function stripRequestLanguage(value: string) {
  let next = value;
  for (const pattern of ACTION_PATTERNS) next = stripPattern(next, pattern);
  for (const { expression } of REQUESTED_ATTRIBUTE_PATTERNS) next = stripPattern(next, expression);
  for (const { expression } of ROLE_PATTERNS) next = stripPattern(next, expression);
  return cleanClause(next.replace(/(?:^|\s)(?:את|לי|עבור|של|the|for)(?=$|\s)/giu, " "));
}

function plausibleName(value: string) {
  const words = cleanClause(value).split(/\s+/u).filter(Boolean);
  return words.length >= 2 && words.length <= 5 && words.every((word) => /^[\p{L}\p{M}'’.-]{2,}$/u.test(word));
}

function cleanOrganization(value: string) {
  return cleanClause(value
    .replace(/^(?:חברת|חברה|ארגון|עסק|company|organisation|organization|business)\s+/iu, "")
    .replace(/^(?:של|ב|at|of)\s+/iu, ""));
}

function unique(values: string[]) {
  return [...new Set(values.map(cleanClause).filter(Boolean))];
}

export function requestedAttributeLabel(attribute: IdentityRequestedAttribute) {
  if (attribute === "phone") return "Phone number";
  if (attribute === "email") return "Email address";
  if (attribute === "social_profile") return "Public profile";
  return "Identity match";
}

export function interpretIdentityRequest(value: string): IdentityRequestInterpretation {
  const rawRequest = value.slice(0, 500).replace(/[\t ]+/gu, " ").replace(/\n{2,}/gu, "\n").trim();
  const emails = unique([...rawRequest.matchAll(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu)].map((match) => match[0].toLowerCase()));
  const phones = unique([...rawRequest.matchAll(/(?:^|\s)(\+?\d[\d\s().-]{6,}\d)(?=$|\s|[,;])/gu)].map((match) => match[1].replace(/[^+\d]/g, "")));
  const usernames = unique([...rawRequest.matchAll(/(?:^|\s)@([\p{L}\p{N}][\p{L}\p{N}_.-]{1,39})\b/gu)].map((match) => match[1].toLowerCase()));
  const requestedAttributes = REQUESTED_ATTRIBUTE_PATTERNS.filter(({ expression }) => expression.test(rawRequest)).map(({ attribute }) => attribute);
  const matchedRole = ROLE_PATTERNS.find(({ expression }) => expression.test(rawRequest));
  const role = matchedRole?.label;

  const clauses = rawRequest.split(/[\n,;|]+/u).map(cleanClause).filter(Boolean);
  const cleanedClauses = clauses.map(stripRequestLanguage).filter(Boolean);
  let personName = cleanedClauses.find(plausibleName);
  let organization = cleanedClauses.find((clause) => clause !== personName && clause.length >= 2);

  if (!organization) {
    const actionDivider = new RegExp(ACTION_PATTERNS.map((pattern) => `(?:${pattern.source})`).join("|"), "iu");
    const actionMatch = actionDivider.exec(rawRequest);
    if (actionMatch) {
      const beforeAction = stripRequestLanguage(rawRequest.slice(0, actionMatch.index));
      const afterAction = stripRequestLanguage(rawRequest.slice(actionMatch.index + actionMatch[0].length));
      if (plausibleName(beforeAction)) personName = beforeAction;
      if (afterAction && afterAction !== personName) organization = cleanOrganization(afterAction) || undefined;
    }
  }

  if (role && !organization) {
    const roleExpression = matchedRole!.expression.source;
    const organizationAfterRole = rawRequest.match(new RegExp(`${roleExpression}\\s+(?:של|ב|at|of)?\\s*([\\p{L}\\p{M}\\p{N}&.'’-]{2,}(?:\\s+[\\p{L}\\p{M}\\p{N}&.'’-]{2,}){0,3})`, "iu"))?.[1];
    const organizationBeforeRole = rawRequest.match(new RegExp(`([\\p{L}\\p{M}\\p{N}&.'’-]{2,}(?:\\s+[\\p{L}\\p{M}\\p{N}&.'’-]{2,}){0,3})\\s+${roleExpression}`, "iu"))?.[1];
    organization = cleanOrganization(organizationAfterRole || organizationBeforeRole || "") || undefined;
  }

  if (!personName) {
    let remaining = rawRequest;
    for (const email of emails) remaining = remaining.replace(new RegExp(quoted(email), "giu"), " ");
    for (const phone of phones) {
      const digits = phone.replace(/\D/g, "");
      remaining = remaining.replace(new RegExp(`\\+?[\\d\\s().-]{${Math.max(7, digits.length)},}`, "gu"), " ");
    }
    for (const username of usernames) remaining = remaining.replace(new RegExp(`@${quoted(username)}`, "giu"), " ");
    if (organization) remaining = remaining.replace(new RegExp(quoted(organization), "giu"), " ");
    remaining = stripRequestLanguage(remaining);
    const words = remaining.split(/\s+/u).filter(Boolean);
    for (let length = Math.min(4, words.length); length >= 2 && !personName; length -= 1) {
      for (let start = 0; start <= words.length - length; start += 1) {
        const candidate = words.slice(start, start + length).join(" ");
        if (plausibleName(candidate)) { personName = candidate; break; }
      }
    }
  }

  if (!organization && cleanedClauses.length > 1) {
    organization = cleanOrganization(cleanedClauses.find((clause) => clause !== personName) || "") || undefined;
  }

  const reasons = [
    personName || emails.length || phones.length || usernames.length ? "A subject signal was identified." : "No subject signal was identified.",
    organization ? "An organization context was identified." : "No organization context was identified.",
    role ? "A role context was identified." : "No role context was identified.",
    requestedAttributes.length ? "A requested result type was identified." : "No requested result type was identified.",
  ];
  const subjectFound = Boolean(personName || emails.length || phones.length || usernames.length);
  const contextCount = Number(Boolean(organization)) + Number(Boolean(role)) + Number(requestedAttributes.length > 0);
  const confidence = subjectFound && contextCount === 3 ? "high" : subjectFound && contextCount >= 1 ? "medium" : "low";

  return {
    rawRequest,
    emails,
    phones,
    usernames,
    personName,
    organization,
    role,
    requestedAttributes,
    confidence,
    needsConfirmation: confidence !== "high",
    reasons,
  };
}
