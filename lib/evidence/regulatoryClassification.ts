import type { RegulatoryEvidenceClassification } from "../providers/types";

const SANCTIONS = /\b(sanction(?:s|ed)?|ofac|special(?:ly)? designated nationals?|sdn list|asset freeze|blocked persons?)\b/i;
const CRIMINAL = /\b(criminal|convict(?:ed|ion)?|indict(?:ed|ment)?|guilty|sentenc(?:ed|ing)|prosecut(?:ed|ion)|department of justice|\bdoj\b)\b/i;
const BANKRUPTCY = /\b(bankrupt(?:cy)?|chapter\s+(?:7|11|15)|insolven(?:t|cy)|restructuring proceeding|liquidation proceeding)\b/i;
const LITIGATION = /\b(litigation|lawsuit|civil action|court action|complaint filed|judgment|injunction)\b/i;
const REGULATORY_ACTION = /\b(enforcement action|administrative proceeding|cease[- ]and[- ]desist|civil penalty|regulatory settlement|settled charges?|charged by (?:the )?(?:sec|regulator)|(?:the )?(?:sec|regulator) charged|securities fraud|fraud charges?|regulator(?:y)? action|consent order)\b/i;
const ROUTINE_SEC_FORM = /^(?:10-[KQ]|8-K|20-F|40-F|6-K|S-[138]|F-[134]|DEF 14A|PRE 14A|SC 13[DG]|13F-HR|3|4|5)(?:\/?A)?$/i;

export type RegulatoryRecord = { form?: string; rootForms?: string[]; names?: string[]; text?: string };

/** Classifies the event represented by an authoritative record, not merely its source. */
export function classifyRegulatoryRecord(record: RegulatoryRecord): RegulatoryEvidenceClassification {
  const text = [record.form, ...(record.rootForms || []), ...(record.names || []), record.text].filter(Boolean).join(" ");
  if (SANCTIONS.test(text)) return "sanctions";
  if (CRIMINAL.test(text)) return "criminal_enforcement";
  if (BANKRUPTCY.test(text)) return "bankruptcy";
  if (LITIGATION.test(text)) return "litigation";
  if (REGULATORY_ACTION.test(text)) return "regulatory_action";
  const forms = [record.form, ...(record.rootForms || [])].filter((value): value is string => Boolean(value));
  if (forms.length > 0 && forms.every((form) => ROUTINE_SEC_FORM.test(form.trim()))) return "routine";
  return "routine";
}

export function isAdverseRegulatoryClassification(classification?: RegulatoryEvidenceClassification) {
  return Boolean(classification && classification !== "routine");
}
