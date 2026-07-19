import assert from "node:assert/strict";
import { getDictionary, locales } from "../lib/i18n/index.ts";

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
for (const locale of locales.filter((locale) => locale !== "en")) {
  const dictionary = getDictionary(locale);
  const { home } = dictionary;
  const renderedStrings = [
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
  ];
  for (const phrase of phrases)
    assert.ok(
      !renderedStrings.some((value) => value.includes(phrase)),
      `${locale} contains English product phrase: ${phrase}`,
    );
}
console.log(
  "Validated rendered product-owned strings for every non-English locale.",
);
