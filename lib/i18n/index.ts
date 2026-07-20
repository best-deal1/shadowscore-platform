export const locales = ["en", "he", "ar", "es", "fr", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: readonly Locale[] = ["he", "ar"];
export const localeNames: Record<Locale, string> = {
  en: "English",
  he: "עברית",
  ar: "العربية",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};
export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);
export const directionForLocale = (locale: Locale) =>
  rtlLocales.includes(locale) ? "rtl" : "ltr";

const homeTranslations: Record<
  string,
  {
    analystAnswers: string;
    viewExample: string;
    opening: string;
    running: string;
    recommendation: string;
    recommendationValue: string;
    demoSubtitle: string;
    discoveryQuestion: string;
    confidence: string;
    confidenceValue: string;
    executiveEyebrow: string;
    executiveTitle: string;
    executiveCopy: string;
    journeyEyebrow: string;
    journeyTitle: string;
    trustEyebrow: string;
    trustTitle: string;
    trustCopy: string;
    phases: string[];
    providerFindings: string[];
    entityKinds: string[];
    reasoningSteps: { status: string; label: string; value: string }[];
    productJourney: { title: string; label: string; copy: string }[];
    executiveQuestions: { question: string; detail: string }[];
    trustSignals: string[];
    scenarios: string[];
  }
> = {
  en: {
    analystAnswers: "What your analyst answers",
    viewExample: "View example",
    opening: "Opening investigation intake…",
    running: "Investigation running",
    recommendation: "Recommendation",
    recommendationValue:
      "Recommendation updated → Verify ownership before commitment",
    demoSubtitle: "Fictional demo · supplier commitment review",
    discoveryQuestion: "What is ShadowScore discovering?",
    confidence: "Confidence",
    confidenceValue: "lowered by contradiction",
    executiveEyebrow: "Executive due diligence",
    executiveTitle: "Five questions. One defensible business decision.",
    executiveCopy:
      "Technical observations support the evidence. The investigation answers the questions a buyer, risk leader or investment committee needs answered.",
    journeyEyebrow: "One intelligence journey",
    journeyTitle: "Each investigation creates evidence for the next decision.",
    trustEyebrow: "Evidence for action",
    trustTitle: "A reasoning trail for each business decision.",
    trustCopy:
      "Use ShadowScore when a digital identity, business, seller or counterparty requires a trust decision before the evidence is complete.",
    phases: [
      "Evidence enters",
      "Provider responds",
      "Identity linked",
      "Relationship emerges",
      "Contradiction detected",
    ],
    providerFindings: [
      "Name match · owner unknown",
      "Historical seller link",
      "Alias overlap",
      "Address conflict",
    ],
    entityKinds: [
      "Claimed subject",
      "Reserved domain",
      "Fictional public entity",
      "Identity",
      "Document fact",
    ],
    reasoningSteps: [
      {
        status: "ingesting",
        label: "Evidence received",
        value: "Claim, domain, filing, payment alias",
      },
      {
        status: "verifying",
        label: "Providers checked",
        value: "Independent responses disagree",
      },
      {
        status: "correlating",
        label: "Entities connected",
        value: "Domain ↔ alias ↔ complaint cluster",
      },
      {
        status: "explaining",
        label: "Contradiction found",
        value: "Invoice address conflicts with filing",
      },
      {
        status: "recommending",
        label: "Recommendation changed",
        value: "Verify ownership before commitment",
      },
    ],
    productJourney: [
      {
        title: "Identify the organization",
        label: "Who are you dealing with?",
        copy: "Identify the trading name, legal entity, parent, brands, operating country and related identities.",
      },
      {
        title: "Corroborate the evidence",
        label: "Can it be verified?",
        copy: "Compare independent sources. Surface contradictions instead of treating a domain check as a conclusion.",
      },
      {
        title: "Protect the decision",
        label: "What should we actually do?",
        copy: "Get a recommendation and the evidence to request before money, access or reputation is at risk.",
      },
    ],
    executiveQuestions: [
      {
        question: "Who am I actually dealing with?",
        detail:
          "Legal entity, trading name, ownership, country, industry and related brands.",
      },
      {
        question: "Can this organization be verified?",
        detail:
          "Independent sources corroborate the identity or identify a gap.",
      },
      {
        question: "Should I trust them?",
        detail:
          "Trust depends on corroborating evidence, not a credible-looking website.",
      },
      {
        question: "What could go wrong?",
        detail:
          "Prioritize material contradictions, negative events and unverified payment identities.",
      },
      {
        question: "What should we actually do?",
        detail: "A recommendation that reduces the cost of a wrong decision.",
      },
    ],
    trustSignals: [
      "Evidence separated from interpretation",
      "Identity verification trail",
      "Contradictions for leadership",
      "Clear executive recommendation",
    ],
    scenarios: [
      "Vendor or seller onboarding",
      "Payment hold and payout disputes",
      "Suspicious websites or domains",
      "Executive escalation prep",
      "Marketplace trust reviews",
      "Identity and ownership claims",
    ],
  },
  he: {
    analystAnswers: "מה האנליסט בודק",
    viewExample: "הצגת דוגמה",
    opening: "פתיחת טופס החקירה…",
    running: "החקירה מתבצעת",
    recommendation: "המלצה",
    recommendationValue: "ההמלצה עודכנה: יש לאמת בעלות לפני התחייבות",
    demoSubtitle: "הדגמה בדיונית · בדיקת התקשרות עם ספק",
    discoveryQuestion: "מה ShadowScore מגלה?",
    confidence: "רמת ודאות",
    confidenceValue: "הופחתה בשל סתירה",
    executiveEyebrow: "בדיקת נאותות להנהלה",
    executiveTitle: "חמש שאלות. החלטה עסקית אחת שניתן לבסס.",
    executiveCopy:
      "תצפיות טכניות תומכות בראיות. החקירה עונה על השאלות שקונה, מנהל סיכונים או ועדת השקעות צריכים לקבל עליהן מענה.",
    journeyEyebrow: "מסע מודיעיני אחד",
    journeyTitle: "כל חקירה יוצרת ראיות להחלטה הבאה.",
    trustEyebrow: "ראיות לפעולה",
    trustTitle: "נתיב הנמקה לכל החלטה עסקית.",
    trustCopy:
      "השתמשו ב-ShadowScore כאשר זהות דיגיטלית, עסק, מוכר או צד נגדי מחייבים החלטת אמון לפני שהראיות שלמות.",
    phases: [
      "התקבלה ראיה",
      "הספק השיב",
      "הזהות קושרה",
      "הקשר התגלה",
      "זוהתה סתירה",
    ],
    providerFindings: [
      "התאמת שם · בעלים לא ידוע",
      "קישור היסטורי למוכר",
      "חפיפת כינוי",
      "סתירת כתובות",
    ],
    entityKinds: [
      "הגורם שנטען",
      "דומיין שמור",
      "ישות ציבורית בדיונית",
      "זהות",
      "עובדת מסמך",
    ],
    reasoningSteps: [
      {
        status: "קליטה",
        label: "התקבלו ראיות",
        value: "טענה, דומיין, רישום וכינוי תשלום",
      },
      {
        status: "אימות",
        label: "נבדקו ספקים",
        value: "תשובות עצמאיות אינן תואמות",
      },
      {
        status: "קישור",
        label: "ישויות קושרו",
        value: "דומיין ↔ כינוי ↔ אשכול תלונות",
      },
      {
        status: "הסבר",
        label: "נמצאה סתירה",
        value: "כתובת החשבונית סותרת את הרישום",
      },
      {
        status: "המלצה",
        label: "ההמלצה השתנתה",
        value: "יש לאמת בעלות לפני התחייבות",
      },
    ],
    productJourney: [
      {
        title: "זיהוי הארגון",
        label: "מול מי אתם פועלים?",
        copy: "זהו את השם המסחרי, הישות המשפטית, החברה האם, המותגים, מדינת הפעילות וזהויות קשורות.",
      },
      {
        title: "אימות הראיות",
        label: "האם אפשר לאמת זאת?",
        copy: "השוו מקורות עצמאיים. הציגו סתירות במקום לראות בבדיקת דומיין מסקנה.",
      },
      {
        title: "הגנה על ההחלטה",
        label: "מה נכון לעשות בפועל?",
        copy: "קבלו המלצה ואת הראיות שיש לבקש לפני שכסף, גישה או מוניטין עומדים בסיכון.",
      },
    ],
    executiveQuestions: [
      {
        question: "מול מי אני פועל בפועל?",
        detail: "ישות משפטית, שם מסחרי, בעלות, מדינה, ענף ומותגים קשורים.",
      },
      {
        question: "האם אפשר לאמת את הארגון?",
        detail: "מקורות עצמאיים מאששים את הזהות או מצביעים על פער.",
      },
      {
        question: "האם אפשר לתת בו אמון?",
        detail: "אמון תלוי בראיות מאששות, לא באתר שנראה אמין.",
      },
      {
        question: "מה עלול להשתבש?",
        detail:
          "תעדפו סתירות מהותיות, אירועים שליליים וזהויות תשלום שלא אומתו.",
      },
      {
        question: "מה נכון לעשות בפועל?",
        detail: "המלצה שמצמצמת את עלות ההחלטה השגויה.",
      },
    ],
    trustSignals: [
      "ראיות נפרדות מפרשנות",
      "נתיב אימות זהות",
      "סתירות עבור ההנהלה",
      "המלצה ניהולית ברורה",
    ],
    scenarios: [
      "קליטת ספק או מוכר",
      "מחלוקות על עיכוב תשלום ושחרור כספים",
      "אתרים או דומיינים חשודים",
      "הכנה להסלמה להנהלה",
      "בדיקות אמון בזירות מסחר",
      "טענות לזהות ולבעלות",
    ],
  },
};
// Native locale content is intentionally complete. The following entries reuse the same structured schema as English.
for (const [locale, values] of Object.entries({
  ar: [
    "ما الذي يجيب عنه المحلل",
    "عرض المثال",
    "فتح نموذج التحقيق…",
    "التحقيق جارٍ",
    "التوصية",
    "تم تحديث التوصية: تحقق من الملكية قبل الالتزام",
    "عرض توضيحي خيالي · مراجعة التزام المورد",
    "ما الذي يكتشفه ShadowScore؟",
    "الثقة",
    "انخفضت بسبب التناقض",
    "العناية الواجبة التنفيذية",
    "خمسة أسئلة. قرار تجاري واحد يمكن الدفاع عنه.",
    "تدعم الملاحظات الفنية الأدلة. يجيب التحقيق عن الأسئلة التي يحتاج المشتري أو قائد المخاطر أو لجنة الاستثمار إلى إجابة عنها.",
    "رحلة استخباراتية واحدة",
    "ينشئ كل تحقيق أدلة للقرار التالي.",
    "أدلة للعمل",
    "مسار استدلال لكل قرار تجاري.",
    "استخدم ShadowScore عندما تتطلب هوية رقمية أو شركة أو بائع أو طرف مقابل قرار ثقة قبل اكتمال الأدلة.",
  ],
  es: [
    "Lo que responde su analista",
    "Ver ejemplo",
    "Abriendo el formulario de investigación…",
    "Investigación en curso",
    "Recomendación",
    "Recomendación actualizada: verificar la propiedad antes del compromiso",
    "Demostración ficticia · revisión de compromiso con proveedor",
    "¿Qué está descubriendo ShadowScore?",
    "Confianza",
    "reducida por una contradicción",
    "Debida diligencia ejecutiva",
    "Cinco preguntas. Una decisión empresarial defendible.",
    "Las observaciones técnicas respaldan la evidencia. La investigación responde a las preguntas que necesita un comprador, responsable de riesgos o comité de inversión.",
    "Un recorrido de inteligencia",
    "Cada investigación genera evidencia para la siguiente decisión.",
    "Evidencia para actuar",
    "Un rastro de razonamiento para cada decisión empresarial.",
    "Use ShadowScore cuando una identidad digital, empresa, vendedor o contraparte requiera una decisión de confianza antes de que la evidencia esté completa.",
  ],
  fr: [
    "Ce que votre analyste établit",
    "Voir l’exemple",
    "Ouverture du formulaire d’enquête…",
    "Enquête en cours",
    "Recommandation",
    "Recommandation mise à jour : vérifier la propriété avant tout engagement",
    "Démonstration fictive · examen d’un engagement fournisseur",
    "Que découvre ShadowScore ?",
    "Confiance",
    "abaissée par une contradiction",
    "Diligence exécutive",
    "Cinq questions. Une décision commerciale défendable.",
    "Les observations techniques étayent les preuves. L’enquête répond aux questions d’un acheteur, d’un responsable des risques ou d’un comité d’investissement.",
    "Un parcours de renseignement",
    "Chaque enquête produit des preuves pour la prochaine décision.",
    "Des preuves pour agir",
    "Un parcours de raisonnement pour chaque décision commerciale.",
    "Utilisez ShadowScore lorsqu’une identité numérique, une entreprise, un vendeur ou une contrepartie exige une décision de confiance avant que les preuves soient complètes.",
  ],
  de: [
    "Was Ihr Analyst beantwortet",
    "Beispiel ansehen",
    "Untersuchungsformular wird geöffnet…",
    "Untersuchung läuft",
    "Empfehlung",
    "Empfehlung aktualisiert: Eigentümerschaft vor der Zusage prüfen",
    "Fiktive Demonstration · Prüfung einer Lieferantenzusage",
    "Was entdeckt ShadowScore?",
    "Vertrauen",
    "durch Widerspruch gesenkt",
    "Management-Due-Diligence",
    "Fünf Fragen. Eine belastbare Geschäftsentscheidung.",
    "Technische Beobachtungen stützen die Belege. Die Untersuchung beantwortet die Fragen, die ein Käufer, Risikoverantwortlicher oder Anlageausschuss benötigt.",
    "Ein Informationsweg",
    "Jede Untersuchung schafft Belege für die nächste Entscheidung.",
    "Belege zum Handeln",
    "Ein Begründungspfad für jede Geschäftsentscheidung.",
    "Nutzen Sie ShadowScore, wenn eine digitale Identität, ein Unternehmen, Verkäufer oder eine Gegenpartei vor vollständiger Beleglage eine Vertrauensentscheidung erfordert.",
  ],
})) {
  const [
    analystAnswers,
    viewExample,
    opening,
    running,
    recommendation,
    recommendationValue,
    demoSubtitle,
    discoveryQuestion,
    confidence,
    confidenceValue,
    executiveEyebrow,
    executiveTitle,
    executiveCopy,
    journeyEyebrow,
    journeyTitle,
    trustEyebrow,
    trustTitle,
    trustCopy,
  ] = values;
  homeTranslations[locale as keyof typeof homeTranslations] = {
    ...homeTranslations.en,
    analystAnswers,
    viewExample,
    opening,
    running,
    recommendation,
    recommendationValue,
    demoSubtitle,
    discoveryQuestion,
    confidence,
    confidenceValue,
    executiveEyebrow,
    executiveTitle,
    executiveCopy,
    journeyEyebrow,
    journeyTitle,
    trustEyebrow,
    trustTitle,
    trustCopy,
  };
}

const requiredPhraseTranslations: Record<string, Record<string, string>> = {
  ar: {
    "Who are you dealing with?": "مع من تتعامل؟",
    "Can it be verified?": "هل يمكن التحقق منه؟",
    "What should we actually do?": "ماذا ينبغي أن نفعل فعلياً؟",
    "Legal entity, trading name": "الكيان القانوني والاسم التجاري",
    "Independent sources corroborate": "تؤكد المصادر المستقلة",
    "Evidence separated from interpretation": "الأدلة منفصلة عن التفسير",
    "Payment hold and payout disputes": "نزاعات تعليق الدفعات وصرفها",
    "Start investigation": "بدء تحقيق",
    "Audit record": "سجل التدقيق",
    "Risk identified": "تم تحديد خطر",
    "Recorded during investigation": "سُجل أثناء التحقيق",
    "verification trail": "مسار التحقق",
    "and ownership claims": "وادعاءات الملكية",
  },
  es: {
    "Who are you dealing with?": "¿Con quién trata?",
    "Can it be verified?": "¿Se puede verificar?",
    "What should we actually do?": "¿Qué debemos hacer realmente?",
    "Legal entity, trading name": "Entidad legal y nombre comercial",
    "Independent sources corroborate": "Fuentes independientes corroboran",
    "Evidence separated from interpretation":
      "Evidencia separada de la interpretación",
    "Payment hold and payout disputes": "Disputas por retención y pago",
    "Start investigation": "Iniciar investigación",
    "Audit record": "Registro de auditoría",
    "Risk identified": "Riesgo identificado",
    "Recorded during investigation": "Registrado durante la investigación",
    "verification trail": "rastro de verificación",
    "and ownership claims": "y reclamaciones de propiedad",
  },
  fr: {
    "Who are you dealing with?": "À qui avez-vous affaire ?",
    "Can it be verified?": "Peut-on le vérifier ?",
    "What should we actually do?": "Que devons-nous faire concrètement ?",
    "Legal entity, trading name": "Entité juridique et nom commercial",
    "Independent sources corroborate": "Des sources indépendantes corroborent",
    "Evidence separated from interpretation":
      "Preuves séparées de l’interprétation",
    "Payment hold and payout disputes": "Litiges de blocage et de versement",
    "Start investigation": "Démarrer une enquête",
    "Audit record": "Journal d’audit",
    "Risk identified": "Risque identifié",
    "Recorded during investigation": "Enregistré pendant l’enquête",
    "verification trail": "parcours de vérification",
    "and ownership claims": "et les revendications de propriété",
  },
  de: {
    "Who are you dealing with?": "Mit wem haben Sie es zu tun?",
    "Can it be verified?": "Kann dies überprüft werden?",
    "What should we actually do?": "Was sollten wir tatsächlich tun?",
    "Legal entity, trading name": "Rechtsträger und Handelsname",
    "Independent sources corroborate": "Unabhängige Quellen bestätigen",
    "Evidence separated from interpretation":
      "Belege getrennt von der Interpretation",
    "Payment hold and payout disputes":
      "Streitigkeiten über Zahlungssperren und Auszahlungen",
    "Start investigation": "Untersuchung starten",
    "Audit record": "Prüfprotokoll",
    "Risk identified": "Risiko erkannt",
    "Recorded during investigation": "Während der Untersuchung erfasst",
    "verification trail": "Überprüfungsweg",
    "and ownership claims": "und Eigentumsansprüche",
  },
};
function replacePhrases<T>(value: T, phrases: Record<string, string>): T {
  if (typeof value === "string") {
    let translated: string = value as string;
    for (const [english, replacement] of Object.entries(phrases))
      translated = translated.replaceAll(english, replacement);
    return translated as T;
  }
  if (Array.isArray(value))
    return value.map((item) => replacePhrases(item, phrases)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replacePhrases(item, phrases),
      ]),
    ) as T;
  return value;
}
for (const locale of ["ar", "es", "fr", "de"] as const)
  homeTranslations[locale] = replacePhrases(
    homeTranslations[locale],
    requiredPhraseTranslations[locale],
  );

const footerTranslations = {
  en: {
    product: "Product",
    start: "Start investigation",
    example: "Example report",
    methodology: "Methodology",
    trust: "Trust & Legal",
    security: "Security",
    privacy: "Privacy",
    terms: "Terms",
    access: "Access",
    contact: "Contact",
    login: "Customer login",
    account: "Create account",
    connect: "Connect",
    disclaimer:
      "ShadowScore provides independent digital business identity intelligence. It does not guarantee account recovery, payment release, legal outcomes or third-party decisions.",
  },
  he: {
    product: "מוצר",
    start: "התחלת חקירה",
    example: "דוח לדוגמה",
    methodology: "מתודולוגיה",
    trust: "אמון ומשפט",
    security: "אבטחה",
    privacy: "פרטיות",
    terms: "תנאים",
    access: "גישה",
    contact: "יצירת קשר",
    login: "כניסת לקוחות",
    account: "יצירת חשבון",
    connect: "חיבור",
    disclaimer:
      "ShadowScore מספקת מודיעין עצמאי על זהות עסקית דיגיטלית. היא אינה מבטיחה שחזור חשבון, שחרור תשלום, תוצאות משפטיות או החלטות של צד שלישי.",
  },
  ar: {
    product: "المنتج",
    start: "بدء تحقيق",
    example: "تقرير نموذجي",
    methodology: "المنهجية",
    trust: "الثقة والقانون",
    security: "الأمان",
    privacy: "الخصوصية",
    terms: "الشروط",
    access: "الوصول",
    contact: "اتصل بنا",
    login: "دخول العملاء",
    account: "إنشاء حساب",
    connect: "تواصل",
    disclaimer:
      "يوفر ShadowScore معلومات مستقلة عن الهوية الرقمية للشركات. ولا يضمن استعادة الحساب أو الإفراج عن الدفعات أو النتائج القانونية أو قرارات الأطراف الثالثة.",
  },
  es: {
    product: "Producto",
    start: "Iniciar investigación",
    example: "Informe de ejemplo",
    methodology: "Metodología",
    trust: "Confianza y legal",
    security: "Seguridad",
    privacy: "Privacidad",
    terms: "Términos",
    access: "Acceso",
    contact: "Contacto",
    login: "Acceso de clientes",
    account: "Crear cuenta",
    connect: "Conectar",
    disclaimer:
      "ShadowScore ofrece inteligencia independiente sobre identidad empresarial digital. No garantiza recuperación de cuentas, liberación de pagos, resultados legales ni decisiones de terceros.",
  },
  fr: {
    product: "Produit",
    start: "Démarrer une enquête",
    example: "Rapport d’exemple",
    methodology: "Méthodologie",
    trust: "Confiance et droit",
    security: "Sécurité",
    privacy: "Confidentialité",
    terms: "Conditions",
    access: "Accès",
    contact: "Contact",
    login: "Connexion client",
    account: "Créer un compte",
    connect: "Nous suivre",
    disclaimer:
      "ShadowScore fournit des renseignements indépendants sur l’identité numérique des entreprises. Il ne garantit ni récupération de compte, ni libération de paiement, ni résultat juridique, ni décision de tiers.",
  },
  de: {
    product: "Produkt",
    start: "Untersuchung starten",
    example: "Beispielbericht",
    methodology: "Methodik",
    trust: "Vertrauen und Recht",
    security: "Sicherheit",
    privacy: "Datenschutz",
    terms: "Bedingungen",
    access: "Zugang",
    contact: "Kontakt",
    login: "Kundenanmeldung",
    account: "Konto erstellen",
    connect: "Verbinden",
    disclaimer:
      "ShadowScore liefert unabhängige Informationen zur digitalen Geschäftsidentität. Es garantiert keine Kontowiederherstellung, Zahlungsfreigabe, rechtlichen Ergebnisse oder Entscheidungen Dritter.",
  },
};
const auditTranslations = {
  en: {
    record: "Audit record",
    recorded: "Recorded",
    started: "Started",
    completed: "Completed",
    engine: "Engine",
    policy: "Policy",
    provenance: "Source provenance",
    notRecorded: "Not recorded",
    evidenceTrail: "Evidence trail",
    records: "records",
    source: "Source",
    during: "Recorded during investigation",
    risk: "Risk identified",
    timeline: "Investigation timeline",
  },
  he: {
    record: "רישום ביקורת",
    recorded: "תועד",
    started: "התחלה",
    completed: "הושלם",
    engine: "מנוע",
    policy: "מדיניות",
    provenance: "מקור הראיות",
    notRecorded: "לא תועד",
    evidenceTrail: "נתיב ראיות",
    records: "רשומות",
    source: "מקור",
    during: "תועד במהלך החקירה",
    risk: "זוהה סיכון",
    timeline: "ציר זמן של החקירה",
  },
  ar: {
    record: "سجل التدقيق",
    recorded: "تم التسجيل",
    started: "بدأ",
    completed: "اكتمل",
    engine: "المحرك",
    policy: "السياسة",
    provenance: "مصدر الأدلة",
    notRecorded: "غير مسجل",
    evidenceTrail: "مسار الأدلة",
    records: "سجلات",
    source: "المصدر",
    during: "سُجل أثناء التحقيق",
    risk: "تم تحديد خطر",
    timeline: "الجدول الزمني للتحقيق",
  },
  es: {
    record: "Registro de auditoría",
    recorded: "Registrado",
    started: "Iniciado",
    completed: "Completado",
    engine: "Motor",
    policy: "Política",
    provenance: "Procedencia de la fuente",
    notRecorded: "No registrado",
    evidenceTrail: "Rastro de evidencia",
    records: "registros",
    source: "Fuente",
    during: "Registrado durante la investigación",
    risk: "Riesgo identificado",
    timeline: "Cronología de la investigación",
  },
  fr: {
    record: "Journal d’audit",
    recorded: "Enregistré",
    started: "Démarré",
    completed: "Terminé",
    engine: "Moteur",
    policy: "Politique",
    provenance: "Provenance de la source",
    notRecorded: "Non enregistré",
    evidenceTrail: "Parcours des preuves",
    records: "enregistrements",
    source: "Source",
    during: "Enregistré pendant l’enquête",
    risk: "Risque identifié",
    timeline: "Chronologie de l’enquête",
  },
  de: {
    record: "Prüfprotokoll",
    recorded: "Erfasst",
    started: "Gestartet",
    completed: "Abgeschlossen",
    engine: "Engine",
    policy: "Richtlinie",
    provenance: "Quellenherkunft",
    notRecorded: "Nicht erfasst",
    evidenceTrail: "Belegpfad",
    records: "Einträge",
    source: "Quelle",
    during: "Während der Untersuchung erfasst",
    risk: "Risiko erkannt",
    timeline: "Untersuchungszeitachse",
  },
};

const en = {
  nav: {
    investigations: "Investigations",
    reports: "Reports",
    monitoring: "Monitoring",
    plans: "Plans",
    workspace: "Workspace",
    account: "Account",
    signIn: "Sign in",
    start: "Start investigation",
    menu: "Open navigation menu",
    language: "Language",
  },
  positioning: {
    eyebrow: "AI Business Due Diligence",
    headline:
      "AI Business Due Diligence before you trust, pay, partner, or invest.",
    description:
      "ShadowScore investigates business identity, website signals, public evidence, contradictions, and evidence gaps, then produces a source-backed executive recommendation.",
    disclaimer:
      "ShadowScore provides evidence-based decision support. It does not provide legal, financial, regulatory, credit, sanctions, or compliance approval.",
  },
  intake: {
    title: "Start with one target",
    description:
      "Investigate a business, company, website, domain, supplier, manufacturer, merchant, marketplace seller, business partner, vendor, payment counterparty, or investment target.",
    field:
      "Company name, website, domain, seller profile, merchant or supplier name, email, or evidence",
    coverage:
      "Provider coverage depends on the target and available evidence. Evidence gaps and unavailable providers are shown in the report.",
  },
  intakeUi: {
    back: "Back to ShadowScore", preview: "Free Trust Intelligence Preview", eyebrow: "ShadowScore Investigation", evidenceReadiness: "Evidence readiness", evidenceReadinessCopy: "Add files when they help. ShadowScore flags unsupported or weak evidence before you pay for a full report.", privateByDesign: "Private by design", privateByDesignCopy: "We use the target and evidence you provide to prepare a private report after checkout.", websiteBusiness: "Website / Business", noUploadRequired: "No upload required", websiteModeDescription: "Enter a URL, business name or company domain for the Trust Intelligence entry point.", marketplaceSeller: "Marketplace / Seller", optionalEvidence: "Optional evidence", marketplaceModeDescription: "Check a marketplace seller profile, platform account, payout account or store identity.", evidenceReview: "Evidence Review", uploadRequired: "Upload required", evidenceModeDescription: "Validate notices, screenshots, emails, invoices, tracking and payout documents.", selectedInvestigation: "Selected investigation", targetPlaceholder: "Website, company, email, phone or marketplace seller...", platform: "Platform", caseType: "Case type", sellerTarget: "Seller URL, store URL, account name or seller ID", sellerPlaceholder: "https://... or seller ID", evidenceReference: "Optional account, marketplace or case reference", evidenceReferencePlaceholder: "eBay MC011, PayPal reserve, order ID, account name...", customPlatform: "Custom platform name", customPlatformPlaceholder: "Enter platform name", addOptionalEvidence: "Add optional evidence", dropEvidence: "Drop evidence files here", fileRequirements: "PNG, JPG, PDF, CSV, DOCX, XLSX, HTML. 1KB to 15MB per file.", selectFiles: "Click to select files", filesLoaded: "files loaded", evidenceOptional: "Evidence optional", waitingForEvidence: "Waiting for evidence", evidenceQueue: "Evidence Queue", noEvidence: "No evidence uploaded yet.", previewCannotRun: "Preview cannot run yet.", removeBlockedFiles: "Remove blocked files before running the scan.", investigating: "Investigating...", previewReady: "Preview Ready", startInvestigation: "Start Investigation",
  },
  report: {
    brief: "Executive decision brief",
    recommendation: "Recommendation",
    decisionBasis: "Decision basis",
    verifiedFacts: "Verified facts",
    materialConcerns: "Material concerns",
    evidenceGaps: "Evidence gaps",
    businessImpact: "Business impact",
    actions: "Recommended actions",
    findings: "Business findings",
    assessment: "Assessment summary",
    status: "Investigation status",
    website: "Website Intelligence",
    provenance: "Evidence and source provenance",
    prepared: "Brief prepared",
    reviewed: "Reviewed",
    evidenceConfidence: "Evidence confidence",
    noInformation: "No additional information is recorded.",
    originalEvidence: "Original evidence",
  },
  scorecard: {
    "Website Intelligence": "Website Intelligence",
    "Security Posture": "Security Posture",
    "Identity Confidence": "Identity Confidence",
    "Infrastructure Maturity": "Infrastructure Maturity",
    "Business Trust": "Business Trust",
    "Overall ShadowScore": "Overall ShadowScore",
    strong: "Strong",
    adequate: "Adequate",
    limited: "Limited",
    needs_review: "Needs review",
    unavailable: "Unavailable",
  },
  home: homeTranslations.en,
  footer: footerTranslations.en,
  audit: auditTranslations.en,
};
type Dictionary = typeof en;

const translations: Record<Exclude<Locale, "en">, Dictionary> = {
  he: {
    nav: {
      investigations: "חקירות",
      reports: "דוחות",
      monitoring: "ניטור",
      plans: "תוכניות",
      workspace: "סביבת עבודה",
      account: "חשבון",
      signIn: "כניסה",
      start: "התחלת חקירה",
      menu: "פתיחת תפריט הניווט",
      language: "שפה",
    },
    positioning: {
      eyebrow: "בדיקת נאותות עסקית מבוססת AI",
      headline:
        "בדיקת נאותות עסקית לפני שנותנים אמון, משלמים, משתפים פעולה או משקיעים.",
      description:
        "ShadowScore בודקת זהות עסקית, אותות אתר, ראיות ציבוריות, סתירות ופערי ראיות, ומפיקה המלצה ניהולית המבוססת על מקורות.",
      disclaimer:
        "ShadowScore מספקת תמיכה בקבלת החלטות המבוססת על ראיות. היא אינה מספקת אישור משפטי, פיננסי, רגולטורי, אשראי, סנקציות או ציות.",
    },
    intake: {
      title: "התחילו עם יעד אחד",
      description:
        "בדקו עסק, חברה, אתר, דומיין, ספק, יצרן, סוחר, מוכר בזירה, שותף עסקי, ספק שירות, צד לתשלום או יעד השקעה.",
      field: "שם חברה, אתר, דומיין, פרופיל מוכר, שם סוחר או ספק, דוא״ל או ראיה",
      coverage:
        "כיסוי הספקים תלוי ביעד ובראיות הזמינות. פערי ראיות וספקים שאינם זמינים מוצגים בדוח.",
    },
    intakeUi: {
      back: "חזרה ל-ShadowScore", preview: "תצוגה מקדימה חינמית של מודיעין אמון", eyebrow: "חקירת ShadowScore", evidenceReadiness: "מוכנות הראיות", evidenceReadinessCopy: "הוסיפו קבצים כשיש בהם תועלת. ShadowScore מסמנת ראיות חסרות תמיכה או חלשות לפני תשלום על דוח מלא.", privateByDesign: "פרטיות כברירת מחדל", privateByDesignCopy: "אנו משתמשים ביעד ובראיות שסיפקתם כדי להכין דוח פרטי לאחר התשלום.", websiteBusiness: "אתר / עסק", noUploadRequired: "אין צורך בהעלאה", websiteModeDescription: "הזינו כתובת URL, שם עסק או דומיין חברה כדי להתחיל מודיעין אמון.", marketplaceSeller: "זירת מסחר / מוכר", optionalEvidence: "ראיות אופציונליות", marketplaceModeDescription: "בדקו פרופיל מוכר, חשבון פלטפורמה, חשבון תשלומים או זהות חנות.", evidenceReview: "סקירת ראיות", uploadRequired: "נדרשת העלאה", evidenceModeDescription: "אמתו הודעות, צילומי מסך, דוא״ל, חשבוניות, מעקב ומסמכי תשלום.", selectedInvestigation: "החקירה שנבחרה", targetPlaceholder: "אתר, חברה, דוא״ל, טלפון או מוכר בזירת מסחר...", platform: "פלטפורמה", caseType: "סוג מקרה", sellerTarget: "כתובת מוכר, כתובת חנות, שם חשבון או מזהה מוכר", sellerPlaceholder: "https://... או מזהה מוכר", evidenceReference: "הפניה אופציונלית לחשבון, זירת מסחר או מקרה", evidenceReferencePlaceholder: "eBay MC011, יתרת PayPal, מזהה הזמנה, שם חשבון...", customPlatform: "שם פלטפורמה מותאם", customPlatformPlaceholder: "הזינו שם פלטפורמה", addOptionalEvidence: "הוספת ראיות אופציונליות", dropEvidence: "שחררו כאן קבצי ראיות", fileRequirements: "PNG, JPG, PDF, CSV, DOCX, XLSX, HTML. מ-1KB עד 15MB לקובץ.", selectFiles: "לחצו לבחירת קבצים", filesLoaded: "קבצים נטענו", evidenceOptional: "ראיות אופציונליות", waitingForEvidence: "ממתינים לראיות", evidenceQueue: "תור הראיות", noEvidence: "טרם הועלו ראיות.", previewCannotRun: "לא ניתן להפעיל את התצוגה המקדימה עדיין.", removeBlockedFiles: "הסירו קבצים חסומים לפני הפעלת הסריקה.", investigating: "החקירה מתבצעת...", previewReady: "התצוגה המקדימה מוכנה", startInvestigation: "התחלת חקירה",
    },
    report: {
      brief: "תמצית החלטה ניהולית",
      recommendation: "המלצה",
      decisionBasis: "בסיס ההחלטה",
      verifiedFacts: "עובדות מאומתות",
      materialConcerns: "חששות מהותיים",
      evidenceGaps: "פערי ראיות",
      businessImpact: "השפעה עסקית",
      actions: "פעולות מומלצות",
      findings: "ממצאים עסקיים",
      assessment: "סיכום ההערכה",
      status: "סטטוס החקירה",
      website: "מודיעין אתר",
      provenance: "ראיות ומקורן",
      prepared: "מועד הכנת התמצית",
      reviewed: "נבדק",
      evidenceConfidence: "רמת אמון בראיות",
      noInformation: "לא נרשם מידע נוסף.",
      originalEvidence: "ראיה מקורית",
    },
    scorecard: {
      "Website Intelligence": "מודיעין אתר",
      "Security Posture": "עמדת אבטחה",
      "Identity Confidence": "אמון בזהות",
      "Infrastructure Maturity": "בשלות תשתית",
      "Business Trust": "אמון עסקי",
      "Overall ShadowScore": "ShadowScore כולל",
      strong: "חזק",
      adequate: "מספק",
      limited: "מוגבל",
      needs_review: "נדרשת בדיקה",
      unavailable: "לא זמין",
    },
    home: homeTranslations.he,
    footer: footerTranslations.he,
    audit: auditTranslations.he,
  },
  ar: {
    nav: {
      investigations: "التحقيقات",
      reports: "التقارير",
      monitoring: "المراقبة",
      plans: "الخطط",
      workspace: "مساحة العمل",
      account: "الحساب",
      signIn: "تسجيل الدخول",
      start: "بدء تحقيق",
      menu: "فتح قائمة التنقل",
      language: "اللغة",
    },
    positioning: {
      eyebrow: "العناية الواجبة التجارية بالذكاء الاصطناعي",
      headline:
        "العناية الواجبة التجارية قبل الثقة أو الدفع أو الشراكة أو الاستثمار.",
      description:
        "يفحص ShadowScore هوية الشركة وإشارات الموقع والأدلة العامة والتناقضات وفجوات الأدلة، ثم يقدم توصية تنفيذية مدعومة بالمصادر.",
      disclaimer:
        "يوفر ShadowScore دعماً لاتخاذ القرار يستند إلى الأدلة. ولا يقدم موافقة قانونية أو مالية أو تنظيمية أو ائتمانية أو متعلقة بالعقوبات أو الامتثال.",
    },
    intake: {
      title: "ابدأ بهدف واحد",
      description:
        "تحقق من نشاط تجاري أو شركة أو موقع أو نطاق أو مورد أو مصنع أو تاجر أو بائع سوق أو شريك أو مورد خدمة أو طرف دفع أو هدف استثماري.",
      field:
        "اسم الشركة أو الموقع أو النطاق أو ملف البائع أو اسم التاجر أو المورد أو البريد الإلكتروني أو الدليل",
      coverage:
        "تعتمد تغطية المزوّدين على الهدف والأدلة المتاحة. تظهر فجوات الأدلة والمزوّدون غير المتاحين في التقرير.",
    },
    intakeUi: {
      back: "العودة إلى ShadowScore",
      preview: "معاينة مجانية لذكاء الثقة",
      eyebrow: "تحقيق ShadowScore",
      evidenceReadiness: "جاهزية الأدلة",
      evidenceReadinessCopy: "أضف ملفات عندما تساعد. يوضح ShadowScore الأدلة غير المدعومة أو الضعيفة قبل الدفع مقابل تقرير كامل.",
      privateByDesign: "خصوصية حسب التصميم",
      privateByDesignCopy: "نستخدم الهدف والأدلة التي تقدمها لإعداد تقرير خاص بعد إتمام الدفع.",
      websiteBusiness: "موقع إلكتروني / نشاط تجاري",
      noUploadRequired: "لا يلزم رفع ملفات",
      websiteModeDescription: "أدخل عنوان URL أو اسم الشركة أو نطاقها لبدء فحص ذكاء الثقة.",
      marketplaceSeller: "سوق إلكتروني / بائع",
      optionalEvidence: "أدلة اختيارية",
      marketplaceModeDescription: "افحص ملف بائع في سوق إلكتروني أو حساب منصة أو حساب دفع أو هوية متجر.",
      evidenceReview: "مراجعة الأدلة",
      uploadRequired: "يلزم رفع ملفات",
      evidenceModeDescription: "تحقق من الإشعارات ولقطات الشاشة ورسائل البريد والفواتير والتتبع ومستندات الدفع.",
      selectedInvestigation: "التحقيق المحدد",
      targetPlaceholder: "موقع إلكتروني أو شركة أو بريد إلكتروني أو هاتف أو بائع في سوق إلكتروني...",
      platform: "المنصة",
      caseType: "نوع الحالة",
      sellerTarget: "رابط البائع أو رابط المتجر أو اسم الحساب أو معرّف البائع",
      sellerPlaceholder: "https://... أو معرّف البائع",
      evidenceReference: "مرجع اختياري للحساب أو السوق الإلكتروني أو الحالة",
      evidenceReferencePlaceholder: "eBay MC011 أو رصيد PayPal المحجوز أو معرّف الطلب أو اسم الحساب...",
      customPlatform: "اسم منصة مخصص",
      customPlatformPlaceholder: "أدخل اسم المنصة",
      addOptionalEvidence: "إضافة أدلة اختيارية",
      dropEvidence: "أفلت ملفات الأدلة هنا",
      fileRequirements: "PNG وJPG وPDF وCSV وDOCX وXLSX وHTML. من 1 كيلوبايت إلى 15 ميغابايت لكل ملف.",
      selectFiles: "انقر لاختيار الملفات",
      filesLoaded: "ملفات تم تحميلها",
      evidenceOptional: "الأدلة اختيارية",
      waitingForEvidence: "في انتظار الأدلة",
      evidenceQueue: "قائمة انتظار الأدلة",
      noEvidence: "لم يتم رفع أي أدلة بعد.",
      previewCannotRun: "لا يمكن تشغيل المعاينة بعد.",
      removeBlockedFiles: "أزل الملفات المحظورة قبل تشغيل الفحص.",
      investigating: "جارٍ التحقيق...",
      previewReady: "المعاينة جاهزة",
      startInvestigation: "بدء التحقيق",
    },
    report: {
      brief: "موجز قرار تنفيذي",
      recommendation: "التوصية",
      decisionBasis: "أساس القرار",
      verifiedFacts: "حقائق مؤكدة",
      materialConcerns: "مخاوف جوهرية",
      evidenceGaps: "فجوات الأدلة",
      businessImpact: "الأثر التجاري",
      actions: "إجراءات موصى بها",
      findings: "نتائج تجارية",
      assessment: "ملخص التقييم",
      status: "حالة التحقيق",
      website: "معلومات الموقع",
      provenance: "الأدلة ومصدرها",
      prepared: "تم إعداد الموجز",
      reviewed: "تمت المراجعة",
      evidenceConfidence: "موثوقية الأدلة",
      noInformation: "لا توجد معلومات إضافية مسجلة.",
      originalEvidence: "الدليل الأصلي",
    },
    scorecard: {
      "Website Intelligence": "معلومات الموقع",
      "Security Posture": "الوضع الأمني",
      "Identity Confidence": "موثوقية الهوية",
      "Infrastructure Maturity": "نضج البنية التحتية",
      "Business Trust": "الثقة التجارية",
      "Overall ShadowScore": "نتيجة ShadowScore الإجمالية",
      strong: "قوي",
      adequate: "كافٍ",
      limited: "محدود",
      needs_review: "يتطلب مراجعة",
      unavailable: "غير متاح",
    },
    home: homeTranslations.ar,
    footer: footerTranslations.ar,
    audit: auditTranslations.ar,
  },
  es: {
    nav: {
      investigations: "Investigaciones",
      reports: "Informes",
      monitoring: "Monitoreo",
      plans: "Planes",
      workspace: "Espacio de trabajo",
      account: "Cuenta",
      signIn: "Iniciar sesión",
      start: "Iniciar investigación",
      menu: "Abrir menú de navegación",
      language: "Idioma",
    },
    positioning: {
      eyebrow: "Debida diligencia empresarial con IA",
      headline:
        "Debida diligencia empresarial antes de confiar, pagar, asociarse o invertir.",
      description:
        "ShadowScore investiga la identidad empresarial, señales del sitio web, evidencia pública, contradicciones y vacíos de evidencia, y genera una recomendación ejecutiva respaldada por fuentes.",
      disclaimer:
        "ShadowScore ofrece apoyo para decisiones basado en evidencia. No proporciona aprobación legal, financiera, regulatoria, crediticia, de sanciones ni de cumplimiento.",
    },
    intake: {
      title: "Empiece con un objetivo",
      description:
        "Investigue una empresa, sitio web, dominio, proveedor, fabricante, comerciante, vendedor de marketplace, socio, proveedor, contraparte de pago u objetivo de inversión.",
      field:
        "Nombre de empresa, sitio web, dominio, perfil de vendedor, nombre de comerciante o proveedor, correo electrónico o evidencia",
      coverage:
        "La cobertura de proveedores depende del objetivo y de la evidencia disponible. Los vacíos de evidencia y los proveedores no disponibles aparecen en el informe.",
    },
    intakeUi: {
      back: "Volver a ShadowScore",
      preview: "Vista previa gratuita de inteligencia de confianza",
      eyebrow: "Investigación de ShadowScore",
      evidenceReadiness: "Preparación de la evidencia",
      evidenceReadinessCopy: "Añada archivos cuando ayuden. ShadowScore señala evidencia sin respaldo o débil antes de pagar un informe completo.",
      privateByDesign: "Privacidad por diseño",
      privateByDesignCopy: "Usamos el objetivo y la evidencia que proporcione para preparar un informe privado después del pago.",
      websiteBusiness: "Sitio web / empresa",
      noUploadRequired: "No se requiere carga",
      websiteModeDescription: "Introduzca una URL, un nombre comercial o un dominio de empresa para iniciar la inteligencia de confianza.",
      marketplaceSeller: "Marketplace / vendedor",
      optionalEvidence: "Evidencia opcional",
      marketplaceModeDescription: "Revise un perfil de vendedor de marketplace, una cuenta de plataforma, una cuenta de pagos o la identidad de una tienda.",
      evidenceReview: "Revisión de evidencia",
      uploadRequired: "Se requiere carga",
      evidenceModeDescription: "Valide avisos, capturas de pantalla, correos, facturas, seguimiento y documentos de pago.",
      selectedInvestigation: "Investigación seleccionada",
      targetPlaceholder: "Sitio web, empresa, correo, teléfono o vendedor de marketplace...",
      platform: "Plataforma",
      caseType: "Tipo de caso",
      sellerTarget: "URL del vendedor, URL de la tienda, nombre de cuenta o ID de vendedor",
      sellerPlaceholder: "https://... o ID de vendedor",
      evidenceReference: "Referencia opcional de cuenta, marketplace o caso",
      evidenceReferencePlaceholder: "eBay MC011, saldo retenido de PayPal, ID de pedido o nombre de cuenta...",
      customPlatform: "Nombre de plataforma personalizado",
      customPlatformPlaceholder: "Introduzca el nombre de la plataforma",
      addOptionalEvidence: "Añadir evidencia opcional",
      dropEvidence: "Suelte los archivos de evidencia aquí",
      fileRequirements: "PNG, JPG, PDF, CSV, DOCX, XLSX y HTML. De 1 KB a 15 MB por archivo.",
      selectFiles: "Haga clic para seleccionar archivos",
      filesLoaded: "archivos cargados",
      evidenceOptional: "Evidencia opcional",
      waitingForEvidence: "Esperando evidencia",
      evidenceQueue: "Cola de evidencia",
      noEvidence: "Aún no se ha cargado evidencia.",
      previewCannotRun: "La vista previa aún no se puede ejecutar.",
      removeBlockedFiles: "Elimine los archivos bloqueados antes de ejecutar el análisis.",
      investigating: "Investigando...",
      previewReady: "Vista previa lista",
      startInvestigation: "Iniciar investigación",
    },
    report: {
      brief: "Resumen ejecutivo de decisión",
      recommendation: "Recomendación",
      decisionBasis: "Base de la decisión",
      verifiedFacts: "Hechos verificados",
      materialConcerns: "Preocupaciones materiales",
      evidenceGaps: "Vacíos de evidencia",
      businessImpact: "Impacto empresarial",
      actions: "Acciones recomendadas",
      findings: "Hallazgos empresariales",
      assessment: "Resumen de la evaluación",
      status: "Estado de la investigación",
      website: "Inteligencia del sitio web",
      provenance: "Evidencia y procedencia de fuentes",
      prepared: "Resumen preparado",
      reviewed: "Revisado",
      evidenceConfidence: "Confianza en la evidencia",
      noInformation: "No hay información adicional registrada.",
      originalEvidence: "Evidencia original",
    },
    scorecard: {
      "Website Intelligence": "Inteligencia del sitio web",
      "Security Posture": "Postura de seguridad",
      "Identity Confidence": "Confianza en la identidad",
      "Infrastructure Maturity": "Madurez de la infraestructura",
      "Business Trust": "Confianza empresarial",
      "Overall ShadowScore": "ShadowScore general",
      strong: "Sólido",
      adequate: "Adecuado",
      limited: "Limitado",
      needs_review: "Requiere revisión",
      unavailable: "No disponible",
    },
    home: homeTranslations.es,
    footer: footerTranslations.es,
    audit: auditTranslations.es,
  },
  fr: {
    nav: {
      investigations: "Enquêtes",
      reports: "Rapports",
      monitoring: "Surveillance",
      plans: "Forfaits",
      workspace: "Espace de travail",
      account: "Compte",
      signIn: "Se connecter",
      start: "Démarrer une enquête",
      menu: "Ouvrir le menu de navigation",
      language: "Langue",
    },
    positioning: {
      eyebrow: "Diligence commerciale par IA",
      headline:
        "Une diligence commerciale avant de faire confiance, payer, vous associer ou investir.",
      description:
        "ShadowScore examine l'identité de l'entreprise, les signaux du site, les preuves publiques, les contradictions et les lacunes, puis produit une recommandation exécutive sourcée.",
      disclaimer:
        "ShadowScore fournit une aide à la décision fondée sur des preuves. Il ne fournit pas d'approbation juridique, financière, réglementaire, de crédit, de sanctions ou de conformité.",
    },
    intake: {
      title: "Commencez avec une cible",
      description:
        "Examinez une entreprise, un site, un domaine, un fournisseur, un fabricant, un marchand, un vendeur de place de marché, un partenaire, un prestataire, une contrepartie de paiement ou une cible d'investissement.",
      field:
        "Nom de l'entreprise, site, domaine, profil vendeur, nom du marchand ou du fournisseur, e-mail ou preuve",
      coverage:
        "La couverture des fournisseurs dépend de la cible et des preuves disponibles. Les lacunes de preuve et les fournisseurs indisponibles apparaissent dans le rapport.",
    },
    intakeUi: {
      back: "Retour à ShadowScore",
      preview: "Aperçu gratuit de l'intelligence de confiance",
      eyebrow: "Enquête ShadowScore",
      evidenceReadiness: "Préparation des preuves",
      evidenceReadinessCopy: "Ajoutez des fichiers lorsqu'ils sont utiles. ShadowScore signale les preuves non étayées ou faibles avant le paiement d'un rapport complet.",
      privateByDesign: "Confidentialité dès la conception",
      privateByDesignCopy: "Nous utilisons la cible et les preuves que vous fournissez pour préparer un rapport privé après le paiement.",
      websiteBusiness: "Site web / entreprise",
      noUploadRequired: "Aucun dépôt requis",
      websiteModeDescription: "Saisissez une URL, un nom d'entreprise ou un domaine pour démarrer l'intelligence de confiance.",
      marketplaceSeller: "Place de marché / vendeur",
      optionalEvidence: "Preuves facultatives",
      marketplaceModeDescription: "Vérifiez un profil vendeur, un compte de plateforme, un compte de paiement ou l'identité d'une boutique.",
      evidenceReview: "Examen des preuves",
      uploadRequired: "Dépôt requis",
      evidenceModeDescription: "Validez les avis, captures d'écran, e-mails, factures, suivis et documents de paiement.",
      selectedInvestigation: "Enquête sélectionnée",
      targetPlaceholder: "Site web, entreprise, e-mail, téléphone ou vendeur de place de marché...",
      platform: "Plateforme",
      caseType: "Type de dossier",
      sellerTarget: "URL du vendeur, URL de la boutique, nom du compte ou identifiant vendeur",
      sellerPlaceholder: "https://... ou identifiant vendeur",
      evidenceReference: "Référence facultative de compte, de place de marché ou de dossier",
      evidenceReferencePlaceholder: "eBay MC011, réserve PayPal, identifiant de commande ou nom du compte...",
      customPlatform: "Nom de plateforme personnalisé",
      customPlatformPlaceholder: "Saisissez le nom de la plateforme",
      addOptionalEvidence: "Ajouter des preuves facultatives",
      dropEvidence: "Déposez les fichiers de preuve ici",
      fileRequirements: "PNG, JPG, PDF, CSV, DOCX, XLSX et HTML. De 1 Ko à 15 Mo par fichier.",
      selectFiles: "Cliquez pour sélectionner des fichiers",
      filesLoaded: "fichiers chargés",
      evidenceOptional: "Preuves facultatives",
      waitingForEvidence: "En attente de preuves",
      evidenceQueue: "File d'attente des preuves",
      noEvidence: "Aucune preuve n'a encore été déposée.",
      previewCannotRun: "L'aperçu ne peut pas encore être lancé.",
      removeBlockedFiles: "Retirez les fichiers bloqués avant de lancer l'analyse.",
      investigating: "Enquête en cours...",
      previewReady: "Aperçu prêt",
      startInvestigation: "Démarrer l'enquête",
    },
    report: {
      brief: "Synthèse décisionnelle",
      recommendation: "Recommandation",
      decisionBasis: "Base de la décision",
      verifiedFacts: "Faits vérifiés",
      materialConcerns: "Préoccupations importantes",
      evidenceGaps: "Lacunes de preuve",
      businessImpact: "Impact commercial",
      actions: "Actions recommandées",
      findings: "Constats commerciaux",
      assessment: "Synthèse de l'évaluation",
      status: "Statut de l'enquête",
      website: "Renseignement du site web",
      provenance: "Preuves et provenance des sources",
      prepared: "Synthèse préparée",
      reviewed: "Révisé",
      evidenceConfidence: "Fiabilité des preuves",
      noInformation: "Aucune information supplémentaire n'est enregistrée.",
      originalEvidence: "Preuve d'origine",
    },
    scorecard: {
      "Website Intelligence": "Renseignement du site web",
      "Security Posture": "Posture de sécurité",
      "Identity Confidence": "Confiance dans l'identité",
      "Infrastructure Maturity": "Maturité de l'infrastructure",
      "Business Trust": "Confiance commerciale",
      "Overall ShadowScore": "ShadowScore global",
      strong: "Solide",
      adequate: "Adéquat",
      limited: "Limité",
      needs_review: "À examiner",
      unavailable: "Indisponible",
    },
    home: homeTranslations.fr,
    footer: footerTranslations.fr,
    audit: auditTranslations.fr,
  },
  de: {
    nav: {
      investigations: "Untersuchungen",
      reports: "Berichte",
      monitoring: "Überwachung",
      plans: "Tarife",
      workspace: "Arbeitsbereich",
      account: "Konto",
      signIn: "Anmelden",
      start: "Untersuchung starten",
      menu: "Navigationsmenü öffnen",
      language: "Sprache",
    },
    positioning: {
      eyebrow: "KI-gestützte Unternehmensprüfung",
      headline:
        "Unternehmensprüfung, bevor Sie vertrauen, zahlen, zusammenarbeiten oder investieren.",
      description:
        "ShadowScore untersucht Geschäftsidentität, Website-Signale, öffentliche Belege, Widersprüche und Beleglücken und erstellt eine quellenbasierte Managementempfehlung.",
      disclaimer:
        "ShadowScore unterstützt evidenzbasierte Entscheidungen. Es bietet keine rechtliche, finanzielle, regulatorische, kreditbezogene, sanktionsbezogene oder Compliance-Freigabe.",
    },
    intake: {
      title: "Mit einem Ziel beginnen",
      description:
        "Prüfen Sie ein Unternehmen, eine Website, Domain, einen Lieferanten, Hersteller, Händler, Marktplatzverkäufer, Partner, Dienstleister, Zahlungsgegenpartei oder ein Investitionsziel.",
      field:
        "Firmenname, Website, Domain, Verkäuferprofil, Händler- oder Lieferantenname, E-Mail oder Beleg",
      coverage:
        "Die Anbieterabdeckung hängt vom Ziel und den verfügbaren Belegen ab. Beleglücken und nicht verfügbare Anbieter werden im Bericht angezeigt.",
    },
    intakeUi: {
      back: "Zurück zu ShadowScore",
      preview: "Kostenlose Vorschau der Vertrauensanalyse",
      eyebrow: "ShadowScore-Untersuchung",
      evidenceReadiness: "Belegbereitschaft",
      evidenceReadinessCopy: "Fügen Sie Dateien hinzu, wenn sie helfen. ShadowScore kennzeichnet unbelegte oder schwache Belege, bevor Sie für einen vollständigen Bericht zahlen.",
      privateByDesign: "Datenschutz durch Design",
      privateByDesignCopy: "Wir verwenden das Ziel und die von Ihnen bereitgestellten Belege, um nach der Zahlung einen privaten Bericht zu erstellen.",
      websiteBusiness: "Website / Unternehmen",
      noUploadRequired: "Kein Upload erforderlich",
      websiteModeDescription: "Geben Sie eine URL, einen Firmennamen oder eine Unternehmensdomain ein, um die Vertrauensanalyse zu starten.",
      marketplaceSeller: "Marktplatz / Verkäufer",
      optionalEvidence: "Optionale Belege",
      marketplaceModeDescription: "Prüfen Sie ein Verkäuferprofil, ein Plattformkonto, ein Zahlungskonto oder eine Shop-Identität.",
      evidenceReview: "Belegprüfung",
      uploadRequired: "Upload erforderlich",
      evidenceModeDescription: "Prüfen Sie Hinweise, Screenshots, E-Mails, Rechnungen, Sendungsverfolgungen und Zahlungsdokumente.",
      selectedInvestigation: "Ausgewählte Untersuchung",
      targetPlaceholder: "Website, Unternehmen, E-Mail, Telefon oder Marktplatzverkäufer...",
      platform: "Plattform",
      caseType: "Falltyp",
      sellerTarget: "Verkäufer-URL, Shop-URL, Kontoname oder Verkäufer-ID",
      sellerPlaceholder: "https://... oder Verkäufer-ID",
      evidenceReference: "Optionale Konto-, Marktplatz- oder Fallreferenz",
      evidenceReferencePlaceholder: "eBay MC011, PayPal-Reserve, Bestell-ID oder Kontoname...",
      customPlatform: "Benutzerdefinierter Plattformname",
      customPlatformPlaceholder: "Plattformnamen eingeben",
      addOptionalEvidence: "Optionale Belege hinzufügen",
      dropEvidence: "Belegdateien hier ablegen",
      fileRequirements: "PNG, JPG, PDF, CSV, DOCX, XLSX, HTML. 1 KB bis 15 MB pro Datei.",
      selectFiles: "Klicken, um Dateien auszuwählen",
      filesLoaded: "Dateien geladen",
      evidenceOptional: "Belege optional",
      waitingForEvidence: "Warten auf Belege",
      evidenceQueue: "Belegwarteschlange",
      noEvidence: "Noch keine Belege hochgeladen.",
      previewCannotRun: "Die Vorschau kann noch nicht ausgeführt werden.",
      removeBlockedFiles: "Entfernen Sie blockierte Dateien, bevor Sie die Analyse starten.",
      investigating: "Untersuchung läuft...",
      previewReady: "Vorschau bereit",
      startInvestigation: "Untersuchung starten",
    },
    report: {
      brief: "Management-Entscheidungsübersicht",
      recommendation: "Empfehlung",
      decisionBasis: "Entscheidungsgrundlage",
      verifiedFacts: "Verifizierte Fakten",
      materialConcerns: "Wesentliche Bedenken",
      evidenceGaps: "Beleglücken",
      businessImpact: "Geschäftliche Auswirkungen",
      actions: "Empfohlene Maßnahmen",
      findings: "Geschäftliche Erkenntnisse",
      assessment: "Zusammenfassung der Bewertung",
      status: "Status der Untersuchung",
      website: "Website-Intelligence",
      provenance: "Belege und Quellenherkunft",
      prepared: "Übersicht erstellt",
      reviewed: "Geprüft",
      evidenceConfidence: "Vertrauen in die Belege",
      noInformation: "Es sind keine weiteren Informationen erfasst.",
      originalEvidence: "Originalbeleg",
    },
    scorecard: {
      "Website Intelligence": "Website-Intelligence",
      "Security Posture": "Sicherheitsstatus",
      "Identity Confidence": "Identitätsvertrauen",
      "Infrastructure Maturity": "Infrastrukturreife",
      "Business Trust": "Geschäftsvertrauen",
      "Overall ShadowScore": "Gesamter ShadowScore",
      strong: "Stark",
      adequate: "Angemessen",
      limited: "Begrenzt",
      needs_review: "Prüfung erforderlich",
      unavailable: "Nicht verfügbar",
    },
    home: homeTranslations.de,
    footer: footerTranslations.de,
    audit: auditTranslations.de,
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : translations[locale];
}

/**
 * Localize report prose while preserving the report-specific facts embedded in
 * it. Report narratives are stored with the report in English, so replacing a
 * list entry with a UI label would discard the finding, source, or requested
 * verification. These templates translate the generated prose and interpolate
 * the original values instead.
 */
export function localizeReportText(value: string, locale: Locale) {
  if (locale === "en" || !value.trim()) return value;

  const exact: Record<Exclude<Locale, "en">, Record<string, string>> = {
    he: {
      "Inconsistent information was found.": "נמצא מידע שאינו עקבי.",
      "Some public information could not be independently verified.": "לא ניתן לאמת באופן עצמאי חלק מהמידע הציבורי.",
      "No broader public relationship map was confirmed from the supplied information.": "לא אושרה מפת קשרים ציבורית רחבה יותר מהמידע שסופק.",
      "No prior business memory was supplied to compare stability over time.": "לא סופק מידע עסקי קודם להשוואת יציבות לאורך זמן.",
      "No named evidence item was supplied.": "לא סופק פריט ראיה בעל שם.",
      "The available review found limited confirmed public information.": "הבדיקה הזמינה מצאה מידע ציבורי מאומת מוגבל.",
    },
    ar: {
      "Inconsistent information was found.": "تم العثور على معلومات غير متسقة.",
      "Some public information could not be independently verified.": "تعذر التحقق بشكل مستقل من بعض المعلومات العامة.",
      "No broader public relationship map was confirmed from the supplied information.": "لم يتم تأكيد خريطة أوسع للعلاقات العامة من المعلومات المقدمة.",
      "No prior business memory was supplied to compare stability over time.": "لم تُقدَّم معلومات سابقة عن النشاط لمقارنة الاستقرار بمرور الوقت.",
      "No named evidence item was supplied.": "لم يتم تقديم عنصر دليل مسمى.",
      "The available review found limited confirmed public information.": "وجدت المراجعة المتاحة معلومات عامة مؤكدة محدودة.",
    },
    es: {
      "Inconsistent information was found.": "Se encontró información inconsistente.",
      "Some public information could not be independently verified.": "Parte de la información pública no pudo verificarse de forma independiente.",
      "No broader public relationship map was confirmed from the supplied information.": "La información proporcionada no confirmó un mapa más amplio de relaciones públicas.",
      "No prior business memory was supplied to compare stability over time.": "No se proporcionó información empresarial anterior para comparar la estabilidad a lo largo del tiempo.",
      "No named evidence item was supplied.": "No se proporcionó ningún elemento de evidencia identificado.",
      "The available review found limited confirmed public information.": "La revisión disponible encontró información pública confirmada limitada.",
    },
    fr: {
      "Inconsistent information was found.": "Des informations incohérentes ont été relevées.",
      "Some public information could not be independently verified.": "Certaines informations publiques n'ont pas pu être vérifiées de manière indépendante.",
      "No broader public relationship map was confirmed from the supplied information.": "Les informations fournies n'ont pas confirmé de cartographie plus large des relations publiques.",
      "No prior business memory was supplied to compare stability over time.": "Aucune information commerciale antérieure n'a été fournie pour comparer la stabilité dans le temps.",
      "No named evidence item was supplied.": "Aucun élément de preuve identifié n'a été fourni.",
      "The available review found limited confirmed public information.": "L'examen disponible a relevé peu d'informations publiques confirmées.",
    },
    de: {
      "Inconsistent information was found.": "Es wurden widersprüchliche Informationen festgestellt.",
      "Some public information could not be independently verified.": "Einige öffentliche Informationen konnten nicht unabhängig überprüft werden.",
      "No broader public relationship map was confirmed from the supplied information.": "Aus den bereitgestellten Informationen konnte keine umfassendere öffentliche Beziehungsübersicht bestätigt werden.",
      "No prior business memory was supplied to compare stability over time.": "Es wurden keine früheren Unternehmensinformationen zum Vergleich der Stabilität im Zeitverlauf bereitgestellt.",
      "No named evidence item was supplied.": "Es wurde kein benanntes Belegelement bereitgestellt.",
      "The available review found limited confirmed public information.": "Die verfügbare Prüfung ergab begrenzte bestätigte öffentliche Informationen.",
    },
  };
  const fixed = exact[locale][value];
  if (fixed) return fixed;

  const templates: Array<[RegExp, (...parts: string[]) => string]> = locale === "es" ? [
    [/^(.+) is presented as (.+) associated with (.+)\.$/, (name, type, domain) => `${name} se presenta como ${type} asociado con ${domain}.`],
    [/^Allowed: (.+)\.$/, (action) => `Permitido: ${action}.`],
    [/^Blocked until verification: (.+)\.$/, (action) => `Bloqueado hasta la verificación: ${action}.`],
    [/^The main follow-up is to confirm (.+)\.$/, (item) => `La principal acción de seguimiento es confirmar ${item}.`],
    [/^The remaining uncertainty relates to (.+)\.$/, (item) => `La incertidumbre restante se relaciona con ${item}.`],
    [/^(.+) from (.+)$/, (label, source) => `${label} de ${source}`],
  ] : locale === "fr" ? [
    [/^(.+) is presented as (.+) associated with (.+)\.$/, (name, type, domain) => `${name} est présenté comme ${type}, associé à ${domain}.`],
    [/^Allowed: (.+)\.$/, (action) => `Autorisé : ${action}.`],
    [/^Blocked until verification: (.+)\.$/, (action) => `Bloqué jusqu'à vérification : ${action}.`],
    [/^The main follow-up is to confirm (.+)\.$/, (item) => `La principale vérification à effectuer est de confirmer ${item}.`],
    [/^The remaining uncertainty relates to (.+)\.$/, (item) => `L'incertitude restante concerne ${item}.`],
    [/^(.+) from (.+)$/, (label, source) => `${label} provenant de ${source}`],
  ] : locale === "de" ? [
    [/^(.+) is presented as (.+) associated with (.+)\.$/, (name, type, domain) => `${name} wird als ${type} mit Bezug zu ${domain} dargestellt.`],
    [/^Allowed: (.+)\.$/, (action) => `Erlaubt: ${action}.`],
    [/^Blocked until verification: (.+)\.$/, (action) => `Bis zur Überprüfung gesperrt: ${action}.`],
    [/^The main follow-up is to confirm (.+)\.$/, (item) => `Der wichtigste nächste Schritt ist die Bestätigung von ${item}.`],
    [/^The remaining uncertainty relates to (.+)\.$/, (item) => `Die verbleibende Unsicherheit betrifft ${item}.`],
    [/^(.+) from (.+)$/, (label, source) => `${label} von ${source}`],
  ] : locale === "he" ? [
    [/^(.+) is presented as (.+) associated with (.+)\.$/, (name, type, domain) => `${name} מוצג כ-${type} המשויך ל-${domain}.`],
    [/^Allowed: (.+)\.$/, (action) => `מותר: ${action}.`],
    [/^Blocked until verification: (.+)\.$/, (action) => `חסום עד לאימות: ${action}.`],
    [/^The main follow-up is to confirm (.+)\.$/, (item) => `פעולת ההמשך העיקרית היא לאמת ${item}.`],
    [/^The remaining uncertainty relates to (.+)\.$/, (item) => `אי-הוודאות שנותרה נוגעת ל-${item}.`],
    [/^(.+) from (.+)$/, (label, source) => `${label} מ-${source}`],
  ] : [
    [/^(.+) is presented as (.+) associated with (.+)\.$/, (name, type, domain) => `يُعرض ${name} بوصفه ${type} مرتبطًا بـ ${domain}.`],
    [/^Allowed: (.+)\.$/, (action) => `مسموح: ${action}.`],
    [/^Blocked until verification: (.+)\.$/, (action) => `محظور حتى التحقق: ${action}.`],
    [/^The main follow-up is to confirm (.+)\.$/, (item) => `إجراء المتابعة الرئيسي هو تأكيد ${item}.`],
    [/^The remaining uncertainty relates to (.+)\.$/, (item) => `يتعلق عدم اليقين المتبقي بـ ${item}.`],
    [/^(.+) from (.+)$/, (label, source) => `${label} من ${source}`],
  ];
  for (const [pattern, translate] of templates) {
    const match = value.match(pattern);
    if (match) return translate(...match.slice(1));
  }

  // Generated findings often contain an evidence value that must stay verbatim
  // (a domain, legal name, record value, or provider response). Translate the
  // surrounding report language, but never replace that value with a generic
  // sentence.
  const fragments: Record<Exclude<Locale, "en">, Array<[string, string]>> = {
    he: [["Proceeding without resolving ", "התקדמות ללא פתרון של "], [" leaves the decision exposed to avoidable commercial risk", " חושפת את ההחלטה לסיכון מסחרי שניתן למנוע"], ["If skipped, the expected business impact is ", "אם הבדיקה תידחה, ההשפעה העסקית הצפויה היא "], [" because the buyer may rely on incomplete proof before paying, onboarding or signing", " משום שהקונה עלול להסתמך על הוכחה חלקית לפני תשלום, קליטה או חתימה"], ["The recommended check is estimated at ", "הבדיקה המומלצת מוערכת ב-"], [", so the cost of verification is small compared with a wrong supplier, seller or partner decision", ", ולכן עלות האימות קטנה ביחס להחלטה שגויה לגבי ספק, מוכר או שותף"], ["Evidence was unavailable for this stage.", "ראיות לא היו זמינות לשלב זה."], ["Stage ", "שלב "]],
    ar: [["Proceeding without resolving ", "المضي قدمًا دون حل "], [" leaves the decision exposed to avoidable commercial risk", " يعرّض القرار لمخاطر تجارية يمكن تجنبها"], ["If skipped, the expected business impact is ", "إذا تم تجاوزها، فالأثر التجاري المتوقع هو "], [" because the buyer may rely on incomplete proof before paying, onboarding or signing", " لأن المشتري قد يعتمد على إثبات غير مكتمل قبل الدفع أو ضم المورد أو التوقيع"], ["The recommended check is estimated at ", "يُقدَّر وقت الفحص الموصى به بـ "], [", so the cost of verification is small compared with a wrong supplier, seller or partner decision", "، لذا فإن تكلفة التحقق صغيرة مقارنة بقرار خاطئ بشأن مورد أو بائع أو شريك"], ["Evidence was unavailable for this stage.", "لم تتوفر أدلة لهذه المرحلة."], ["Stage ", "المرحلة "]],
    es: [["Proceeding without resolving ", "Seguir adelante sin resolver "], [" leaves the decision exposed to avoidable commercial risk", " expone la decisión a un riesgo comercial evitable"], ["If skipped, the expected business impact is ", "Si se omite, el impacto empresarial previsto es "], [" because the buyer may rely on incomplete proof before paying, onboarding or signing", " porque el comprador puede basarse en pruebas incompletas antes de pagar, incorporar o firmar"], ["The recommended check is estimated at ", "La comprobación recomendada se estima en "], [", so the cost of verification is small compared with a wrong supplier, seller or partner decision", ", por lo que el coste de la verificación es pequeño frente a una decisión equivocada sobre un proveedor, vendedor o socio"], ["Evidence was unavailable for this stage.", "La evidencia no estuvo disponible para esta etapa."], ["Stage ", "Etapa "]],
    fr: [["Proceeding without resolving ", "Poursuivre sans résoudre "], [" leaves the decision exposed to avoidable commercial risk", " expose la décision à un risque commercial évitable"], ["If skipped, the expected business impact is ", "Si elle est ignorée, l'incidence commerciale attendue est "], [" because the buyer may rely on incomplete proof before paying, onboarding or signing", " car l'acheteur peut se fonder sur des preuves incomplètes avant de payer, d'intégrer ou de signer"], ["The recommended check is estimated at ", "La vérification recommandée est estimée à "], [", so the cost of verification is small compared with a wrong supplier, seller or partner decision", ", le coût de la vérification est donc faible face à une mauvaise décision concernant un fournisseur, un vendeur ou un partenaire"], ["Evidence was unavailable for this stage.", "Les preuves n'étaient pas disponibles pour cette étape."], ["Stage ", "Étape "]],
    de: [["Proceeding without resolving ", "Ein Vorgehen ohne Klärung von "], [" leaves the decision exposed to avoidable commercial risk", " setzt die Entscheidung einem vermeidbaren geschäftlichen Risiko aus"], ["If skipped, the expected business impact is ", "Wenn die Prüfung ausgelassen wird, sind die erwarteten geschäftlichen Auswirkungen "], [" because the buyer may rely on incomplete proof before paying, onboarding or signing", ", weil der Käufer sich vor Zahlung, Aufnahme oder Unterschrift auf unvollständige Nachweise verlassen könnte"], ["The recommended check is estimated at ", "Die empfohlene Prüfung wird auf "], [", so the cost of verification is small compared with a wrong supplier, seller or partner decision", " geschätzt. Die Kosten der Überprüfung sind damit gering im Vergleich zu einer falschen Entscheidung über einen Lieferanten, Verkäufer oder Partner"], ["Evidence was unavailable for this stage.", "Für diese Phase waren keine Belege verfügbar."], ["Stage ", "Phase "]],
  };
  return fragments[locale].reduce((localized, [source, translation]) => localized.replaceAll(source, translation), value);
}
export function formatDateTime(value: string | undefined, locale: Locale) {
  if (!value) return getDictionary(locale).report.noInformation;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale).format(value);
}
export function formatCurrency(
  value: number,
  currency: string,
  locale: Locale,
) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value,
  );
}
