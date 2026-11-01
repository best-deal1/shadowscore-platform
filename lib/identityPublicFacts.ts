export type SourceReportedIdentityFact = {
  attribute: "name" | "organization" | "role";
  value: string;
  subjectName: string;
  sourceUrl: string;
  sourceFamily: string;
  excerpt: string;
};

export type PublicEmailObservation = { value: string; method: "literal" | "explicit_at_dot" };

const emailTokens = (text: string) => [...new Set([...text.matchAll(/(?<![\p{L}\p{N}._%+\-@])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}(?=$|[^\p{L}\p{N}._%+\-@]|\.+(?=$|[^\p{L}\p{N}._%+\-@]))/giu)].map((match) => match[0].toLowerCase()))];

/** Only an explicit (at)/[at] marker can introduce an email address. */
export function publicEmailObservations(text: string): PublicEmailObservation[] {
  const literal = new Set(emailTokens(text));
  const normalized = text.replace(/([\p{L}\p{N}._%+-]+)\s*(?:\(\s*at\s*\)|\[\s*at\s*\])\s*([\p{L}\p{N}-]+(?:(?:\.|\s*(?:\(\s*dot\s*\)|\[\s*dot\s*\])\s*)[\p{L}\p{N}-]+)+)/giu,
    (_match, local: string, domain: string) => `${local}@${domain.replace(/\s*(?:\(\s*dot\s*\)|\[\s*dot\s*\])\s*/giu, ".")}`);
  return emailTokens(normalized).map((value) => ({ value, method: literal.has(value) ? "literal" : "explicit_at_dot" }));
}

/** Reject dates, document identifiers, and unformatted number strings. */
export function publicPhoneObservations(text: string) {
  return [...new Set([...text.matchAll(/(?<![\p{L}\p{N}])((?:\+\d|\(\d|\d)[\d\s().-]{5,}\d)(?=$|[^\p{L}\p{N}])/gu)].flatMap((match) => {
    const value = match[1].trim();
    const digits = value.replace(/\D/gu, "");
    if (digits.length < 9 || digits.length > 15 || /^(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d/u.test(value)) return [];
    const prefix = text.slice(Math.max(0, (match.index || 0) - 30), match.index);
    if (/(?:record|reference|identifier|document|order|invoice|id)\s*[:.#=-]?\s*$/iu.test(prefix)) return [];
    const labelled = /(?:phone|telephone|tel|mobile|call|טלפון|נייד)\s*[:.=-]?\s*$/iu.test(prefix);
    const formatted = /^\+/u.test(value) || /\(\d{2,4}\)/u.test(value) || (value.match(/[ .-]/gu)?.length || 0) >= 2;
    return labelled || formatted ? [value] : [];
  }))];
}

const normalizedName = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const roleWord = /(?:\b(?:engineer|manager|director|founder|owner|developer|designer|researcher|professor|writer|author|consultant|officer|president|partner|architect|head|chief|ceo|cto|cfo)\b|(?:^|\s)(?:מנהל|מנהלת|מייסד|מייסדת|בעלים|מהנדס|מהנדסת|חוקר|חוקרת)(?:\s|$))/iu;
const blockedNameWord = /^(?:company|team|contact|profile|public|home|careers|jobs|news|privacy|terms|speaking|talks)$/iu;

function personName(value: string) {
  const words = value.trim().split(/\s+/u);
  return words.length >= 2 && words.length <= 4 && !roleWord.test(value)
    && words.every((word) => /^[\p{L}\p{M}'’-]+$/u.test(word) && !blockedNameWord.test(word));
}

function hasAnchor(text: string, anchors: string[]) {
  const emails = publicEmailObservations(text).map((item) => item.value);
  return anchors.some((anchor) => {
    if (anchor.includes("@")) return emails.includes(anchor.toLowerCase());
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}_.-])${escaped}($|[^\\p{L}\\p{N}_.-])`, "iu").test(text);
  });
}

function cleanValue(value: string) {
  return value.replace(/\s+(?:contact|email|phone|website)\s*:.*$/iu, "").replace(/^[\s,:'"-]+|[\s,:'"-]+$/gu, "").trim();
}

function employment(value: string) {
  const match = /^(.{2,80}?)\s+(?:at|with)\s+(.{2,80})$/iu.exec(value);
  if (!match) return undefined;
  const role = cleanValue(match[1]);
  const organization = cleanValue(match[2]);
  if (!roleWord.test(role) || /[,;:]|\b(?:not|never|unrelated|contact|ask|reach|meet|our|their|his|her)\b|(?:^|\s)לא(?:\s|$)/iu.test(role)
    || /[@<>]|https?:|\b(?:contact|email|phone)\b/iu.test(organization)
    || role.split(/\s/u).length > 10 || organization.split(/\s/u).length > 10) return undefined;
  return { role, organization };
}

/** A source-reported profile stays attached to its observed person and source. */
export function extractSourceReportedIdentityFacts(input: {
  title: string; description?: string; observedName?: string; anchors: string[]; sourceUrl: string; sourceFamily: string;
}): { facts: SourceReportedIdentityFact[]; ambiguousSubject: boolean } {
  const name = input.observedName?.trim();
  const whole = `${input.title} ${input.description || ""}`.replace(/<[^>]*>/gu, "");
  if (!name || !personName(name) || !input.anchors.length || !hasAnchor(whole, input.anchors)) return { facts: [], ambiguousSubject: false };
  let description = (input.description || "").replace(/<[^>]*>/gu, "").trim();
  const blocks = description.split(/(?=(?:Name|Person)\s*:)/iu).filter((block) => /^(?:Name|Person)\s*:/iu.test(block));
  const selectedBlock = blocks.find((block) => {
    const labelledName = /^(?:Name|Person)\s*:\s*([^;|\n]+)/iu.exec(block)?.[1]?.trim();
    return labelledName && normalizedName(labelledName) === normalizedName(name) && hasAnchor(block, input.anchors);
  });
  if (blocks.length && !selectedBlock) return { facts: [], ambiguousSubject: true };
  if (selectedBlock) description = selectedBlock;
  const parts = description.split(/[;|\n]+|(?<=[.!?])\s+(?=[\p{L}])/u).map((part) => part.trim().replace(/[.!?]$/u, "")).filter(Boolean);
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const titleContext = new RegExp(`^${escapedName}\\s*(?:\\||[-\\u2013\\u2014]|,)\\s*(.{3,160})$`, "iu").exec(input.title);
  const titleEmployment = titleContext?.[1].split(/\s*\|\s*/u)[0];
  if (titleEmployment && employment(titleEmployment)) parts.push(titleEmployment);
  const qualified: Array<{ person: string; role: string; organization: string; excerpt: string }> = [];
  for (const part of parts) {
    const match = /^(.{3,70}?)\s*(?:,\s*|:\s*|\s+[-\u2013\u2014]\s+|\s+is\s+)(.{3,160})$/iu.exec(part);
    if (!match || !personName(match[1])) continue;
    const context = employment(match[2]);
    if (context) qualified.push({ person: match[1].trim(), ...context, excerpt: part });
  }
  const otherSubject = qualified.some((entry) => normalizedName(entry.person) !== normalizedName(name))
    || parts.some((part) => personName(part) && /^[\p{Lu}\p{Lt}\p{Script=Hebrew}]/u.test(part)
      && normalizedName(part) !== normalizedName(name) && !roleWord.test(part));
  if (otherSubject && !selectedBlock) return { facts: [], ambiguousSubject: true };
  const facts: SourceReportedIdentityFact[] = [];
  const add = (attribute: SourceReportedIdentityFact["attribute"], value: string, excerpt: string) => {
    const cleaned = cleanValue(value);
    if (cleaned.length < 2 || cleaned.length > 100 || /[<>]/u.test(cleaned)) return;
    facts.push({ attribute, value: cleaned, subjectName: name, sourceUrl: input.sourceUrl, sourceFamily: input.sourceFamily, excerpt });
  };
  add("name", name, input.title);
  for (const entry of qualified.filter((item) => normalizedName(item.person) === normalizedName(name))) {
    add("role", entry.role, entry.excerpt); add("organization", entry.organization, entry.excerpt);
  }
  if (!otherSubject) for (const part of parts) {
    const labelled = /^(?:organization|organisation|company|employer|חברה|ארגון)\s*:\s*(.{2,80})$/iu.exec(part);
    const role = /^(?:role|position|תפקיד)\s*:\s*(.{2,80})$/iu.exec(part);
    if (labelled && !/[@<>]|https?:/iu.test(labelled[1])) add("organization", labelled[1], part);
    if (role && roleWord.test(role[1]) && !/\b(?:not|never)\b/iu.test(role[1])) add("role", role[1], part);
    const context = qualified.some((entry) => entry.excerpt === part) ? undefined : employment(part);
    if (context) { add("role", context.role, part); add("organization", context.organization, part); }
  }
  return { facts: [...new Map(facts.map((fact) => [`${fact.attribute}|${normalizedName(fact.value)}|${fact.sourceUrl}`, fact])).values()], ambiguousSubject: false };
}

export function sourceReportedNamesDisagree(facts: SourceReportedIdentityFact[]) {
  const names = [...new Set(facts.filter((fact) => fact.attribute === "name").map((fact) => normalizedName(fact.value)))];
  const compatible = (left: string, right: string) => {
    const a = left.split(" "); const b = right.split(" ");
    if (a[0] !== b[0] || a.at(-1) !== b.at(-1)) return false;
    const shorter = a.length <= b.length ? a : b; const longer = a.length <= b.length ? b : a;
    let index = 0;
    for (const word of longer) if (word === shorter[index]) index += 1;
    return index === shorter.length;
  };
  return names.some((name, index) => names.slice(index + 1).some((other) => !compatible(name, other)));
}

export function summarizeSourceReportedFacts(facts: SourceReportedIdentityFact[]) {
  const groups = new Map<string, SourceReportedIdentityFact[]>();
  for (const fact of facts) {
    const key = `${fact.attribute}|${normalizedName(fact.value)}`;
    groups.set(key, [...(groups.get(key) || []), fact]);
  }
  return [...groups.values()].map((items) => ({
    attribute: items[0].attribute, value: items[0].value,
    sources: [...new Map(items.map((item) => [item.sourceUrl, { url: item.sourceUrl, family: item.sourceFamily, excerpt: item.excerpt }])).values()],
    sourceFamilyCount: new Set(items.map((item) => item.sourceFamily)).size,
  }));
}
