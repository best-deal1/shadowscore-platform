import assert from "node:assert/strict";
import { catalogLocales, getDictionary } from "../lib/i18n/index.ts";

const phrases = [
  "Who are you dealing with?",
  "Can it be verified?",
  "What should we actually do?",
  "Legal entity, trading name",
  "Independent sources corroborate",
  "Evidence separated from interpretation",
  "Payment hold and payout disputes",
  "Start investigation",
  "Audit record",
  "Risk identified",
  "Recorded during investigation",
  "verification trail",
  "and ownership claims",
];
for (const locale of catalogLocales.filter((locale) => locale !== "en")) {
  const dictionary = getDictionary(locale);
  const { home, positioning } = dictionary;
  const renderedStrings = [
    positioning.eyebrow,
    positioning.headline,
    positioning.description,
    positioning.disclaimer,
    home.analystAnswers,
    home.viewExample,
    home.opening,
    home.running,
    home.recommendation,
    home.recommendationValue,
    home.demoSubtitle,
    home.discoveryQuestion,
    home.confidence,
    home.confidenceValue,
    home.executiveEyebrow,
    home.executiveTitle,
    home.executiveCopy,
    home.journeyEyebrow,
    home.journeyTitle,
    home.trustEyebrow,
    home.trustTitle,
    home.trustCopy,
    ...home.phases,
    ...home.providerFindings,
    ...home.entityKinds,
    ...home.reasoningSteps.flatMap((step) => [
      step.status,
      step.label,
      step.value,
    ]),
    ...home.productJourney.flatMap((item) => [
      item.title,
      item.label,
      item.copy,
    ]),
    ...home.executiveQuestions.flatMap((item) => [item.question, item.detail]),
    ...home.trustSignals,
    ...home.scenarios,
    ...Object.values(dictionary.footer),
    ...Object.values(dictionary.audit),
    dictionary.legal.terms.label,
    dictionary.legal.terms.title,
    dictionary.legal.terms.introduction,
    dictionary.legal.terms.acceptanceLabel,
    dictionary.legal.terms.acceptanceCopy,
    ...dictionary.legal.terms.sections.flatMap((section) => [section.title, ...section.body, ...(section.items || [])]),
    dictionary.legal.privacy.label,
    dictionary.legal.privacy.title,
    dictionary.legal.privacy.introduction,
    ...dictionary.legal.privacy.sections.flatMap((section) => [section.title, ...section.body, ...(section.items || [])]),
  ];
  for (const phrase of phrases)
    assert.ok(
      !renderedStrings.some((value) => value.includes(phrase)),
      `${locale} contains English product phrase: ${phrase}`,
    );
  for (const [key, value] of Object.entries(positioning))
    assert.notEqual(
      value,
      getDictionary("en").positioning[key],
      `${locale}.positioning.${key} must be localized rather than falling back to English`,
    );
}
for (const locale of ["ar", "es", "fr", "de"]) {
  const localized = getDictionary(locale).legal;
  const english = getDictionary("en").legal;
  assert.notDeepEqual(localized.terms.sections, english.terms.sections, `${locale} must provide localized Terms sections`);
  assert.notDeepEqual(localized.privacy.sections, english.privacy.sections, `${locale} must provide localized Privacy sections`);
}
console.log(
  "Validated rendered product-owned and legal strings for every non-English locale.",
);
