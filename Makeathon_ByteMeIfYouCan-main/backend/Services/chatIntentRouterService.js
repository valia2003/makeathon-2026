const SUPPORTED_INTENTS = [
  "onboarding_help",
  "recommendation_request",
  "direct_trail_info",
  "condition_check",
  "nearby_exploration",
  "explain_current_recommendation",
  "unsupported_off_topic",
];

const HELP_TERMS = [
  "help",
  "hello",
  "hi",
  "hey",
  "start",
  "what can you do",
  "how does this work",
  "how it works",
  "βοηθεια",
  "γεια",
  "τι μπορεις",
  "πως δουλευει",
];

const NEARBY_TERMS = [
  "nearby",
  "near me",
  "around there",
  "around it",
  "what else",
  "anything around",
  "anything nearby",
  "nearby trails",
  "nearby places",
  "other trails nearby",
  "κοντα",
  "κοντινα",
  "τι αλλο",
  "γυρω",
];

const CONDITION_TERMS = [
  "weather",
  "forecast",
  "condition",
  "conditions",
  "safe",
  "safety",
  "safe today",
  "is it ok",
  "is it okay",
  "check today",
  "today",
  "wind",
  "rain",
  "storm",
  "heat",
  "snow",
  "καιρο",
  "καιρος",
  "συνθηκες",
  "ασφαλες",
  "ασφαλεια",
  "σημερα",
  "βροχη",
  "αερα",
  "καταιγιδα",
  "ζεστη",
  "χιονι",
];

const WEAK_CONDITION_TERMS = ["today", "\u03c3\u03b7\u03bc\u03b5\u03c1\u03b1"];
const STRONG_CONDITION_TERMS = CONDITION_TERMS.filter(
  (term) => !WEAK_CONDITION_TERMS.includes(normalizeText(term))
);

const EXPLAIN_TERMS = [
  "why",
  "why?",
  "why this",
  "why this trail",
  "why did you choose",
  "why choose",
  "explain",
  "is this good for me",
  "good for me",
  "γιατι",
  "γιατί",
  "γιατι αυτο",
  "γιατί αυτό",
  "γιατι το διαλεξες",
  "γιατί το διάλεξες",
  "καλο για μενα",
  "καλό για μένα",
];

const RECOMMENDATION_TERMS = [
  "recommend",
  "suggest",
  "find",
  "plan",
  "go",
  "go somewhere",
  "i want",
  "i would like",
  "i'd like",
  "destination",
  "trip",
  "travel",
  "weekend",
  "trail",
  "hike",
  "hiking",
  "route",
  "walk",
  "quiet",
  "hidden",
  "avoid crowds",
  "low crowd",
  "mountain",
  "river",
  "forest",
  "island",
  "sea",
  "gorge",
  "village",
  "lake",
  "waterfall",
  "easy",
  "moderate",
  "hard",
  "hours",
  "family",
  "group",
  "couple",
  "fiance",
  "fiancé",
  "romantic",
  "high altitude",
  "very high",
  "summit",
  "peak",
  "alpine",
  "προτεινε",
  "πρότεινε",
  "θελω",
  "θέλω",
  "θα ηθελα",
  "θα ήθελα",
  "βρες",
  "προορισμο",
  "προορισμό",
  "ταξιδι",
  "ταξίδι",
  "μονοπατι",
  "μονοπάτι",
  "πεζοπορια",
  "πεζοπορία",
  "βουνο",
  "βουνό",
  "ποταμι",
  "ποτάμι",
  "δασος",
  "δάσος",
  "νησι",
  "νησί",
  "θαλασσα",
  "θάλασσα",
  "φαραγγι",
  "φαράγγι",
  "χωριο",
  "χωριό",
  "λιμνη",
  "λίμνη",
  "ησυχο",
  "ήσυχο",
  "κοσμο",
  "κόσμο",
  "ωρες",
  "ώρες",
  "ζευγαρι",
  "ζευγάρι",
  "ρομαντικο",
  "ρομαντικό",
  "ψηλα",
  "ψηλά",
  "υψομετρο",
  "υψόμετρο",
  "κορυφη",
  "κορυφή",
];

const GREECE_DOMAIN_TERMS = [
  "greece",
  "greek",
  "hellas",
  "athens",
  "crete",
  "cyclades",
  "ionian",
  "epirus",
  "peloponnese",
  "thessaly",
  "dodecanese",
  "ελλαδα",
  "ελλάδα",
  "ελληνικο",
  "κρητη",
  "κρήτη",
  "κυκλαδες",
  "κυκλάδες",
  "ηπειρος",
  "ήπειρος",
  "πελοποννησος",
  "πελοπόννησος",
];

const OFF_TOPIC_TERMS = [
  "laptop",
  "phone",
  "football",
  "basketball",
  "match",
  "stock",
  "crypto",
  "bitcoin",
  "recipe",
  "cook",
  "code",
  "programming",
  "javascript",
  "python",
  "homework",
  "math",
  "joke",
  "movie",
  "music",
  "politics",
  "election",
  "buy",
  "sell",
  "price",
  "ποδοσφαιρο",
  "μπασκετ",
  "λαπτοπ",
  "κινητο",
  "συνταγη",
  "κωδικα",
  "πολιτικη",
  "ταινια",
  "αστειο",
  "αγορασω",
];

const GENERAL_QUESTION_STARTERS = [
  "what is",
  "who is",
  "who won",
  "how do i",
  "how to",
  "can you explain",
  "tell me about",
  "τι ειναι",
  "ποιος ειναι",
  "ποια ειναι",
  "πως να",
  "εξηγησε",
];

function isGreek(message) {
  return /[\u0370-\u03ff]/.test(String(message || ""));
}

function responseLanguage(message) {
  return isGreek(message) ? "el" : "en";
}

function normalizeText(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text).match(/[\p{L}\p{N}]+/gu) || [];
}

function termMatches(text, tokenSet, term) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  const termTokens = tokenize(normalizedTerm);
  if (termTokens.length === 0) return false;

  if (termTokens.length === 1) {
    return tokenSet.has(termTokens[0]);
  }

  return text.includes(normalizedTerm);
}

function includesAny(text, terms) {
  const tokenSet = new Set(tokenize(text));
  return terms.some((term) => termMatches(text, tokenSet, term));
}

function scoreTerms(text, terms) {
  const tokenSet = new Set(tokenize(text));
  return terms.reduce((score, term) => score + (termMatches(text, tokenSet, term) ? 1 : 0), 0);
}

function looksLikeGeneralQuestion(text) {
  return text.includes("?") || GENERAL_QUESTION_STARTERS.some((term) => text.startsWith(normalizeText(term)));
}

function classifyChatIntent({ message, matchedTrail, hasMemory = false }) {
  const normalized = normalizeText(message);
  const language = responseLanguage(message);

  const signals = {
    help: scoreTerms(normalized, HELP_TERMS),
    nearby: scoreTerms(normalized, NEARBY_TERMS),
    condition: scoreTerms(normalized, CONDITION_TERMS),
    conditionStrong: scoreTerms(normalized, STRONG_CONDITION_TERMS),
    explain: scoreTerms(normalized, EXPLAIN_TERMS),
    recommendation: scoreTerms(normalized, RECOMMENDATION_TERMS),
    greeceDomain: scoreTerms(normalized, GREECE_DOMAIN_TERMS),
    offTopic: scoreTerms(normalized, OFF_TOPIC_TERMS),
  };
  const domainScore =
    signals.recommendation +
    signals.conditionStrong +
    signals.nearby +
    signals.explain +
    signals.greeceDomain +
    (matchedTrail ? 3 : 0);
  const pathfinderDomainScore =
    signals.recommendation +
    signals.conditionStrong +
    signals.nearby +
    signals.explain +
    (matchedTrail ? 3 : 0);
  const hasConditionIntent =
    signals.conditionStrong > 0 ||
    (signals.condition > 0 && (matchedTrail || hasMemory) && looksLikeGeneralQuestion(normalized));

  let intent = "recommendation_request";
  let confidence = "medium";
  let reason = "default valid outdoor travel planning request";

  if (signals.offTopic > 0 && pathfinderDomainScore === 0) {
    return {
      intent: "unsupported_off_topic",
      language,
      confidence: "high",
      reason: "off-topic terms with no hiking, Greece, trail, travel, weather, or nature signal",
      signals,
    };
  }

  if (!matchedTrail && signals.help === 0 && domainScore === 0 && !hasConditionIntent && looksLikeGeneralQuestion(normalized)) {
    return {
      intent: "unsupported_off_topic",
      language,
      confidence: "high",
      reason: "general question with no Pathfinder-domain signal",
      signals,
    };
  }

  if (signals.help > 0 && normalized.length <= 80) {
    intent = "onboarding_help";
    confidence = "high";
    reason = "help/onboarding request";
  } else if (signals.nearby > 0) {
    intent = "nearby_exploration";
    confidence = hasMemory ? "high" : "medium";
    reason = "nearby exploration request";
  } else if (hasConditionIntent) {
    intent = "condition_check";
    confidence = "high";
    reason = "weather/safety/condition request";
  } else if (matchedTrail) {
    intent = "direct_trail_info";
    confidence = "high";
    reason = "known trail or destination was mentioned";
  } else if (signals.explain > 0) {
    intent = "explain_current_recommendation";
    confidence = hasMemory ? "high" : "medium";
    reason = "explain-current follow-up";
  } else if (signals.recommendation > 0 || signals.greeceDomain > 0) {
    intent = "recommendation_request";
    confidence = signals.recommendation > 1 ? "high" : "medium";
    reason = "trail/travel preference request";
  } else if (signals.offTopic > 0) {
    intent = "unsupported_off_topic";
    confidence = "high";
    reason = "off-topic request";
  } else if (normalized.length <= 3) {
    intent = "onboarding_help";
    confidence = "low";
    reason = "short ambiguous greeting/help-like message";
  } else {
    intent = "recommendation_request";
    confidence = "low";
    reason = "ambiguous request kept inside Pathfinder domain unless clearly invalid";
  }

  return { intent, language, confidence, reason, signals };
}

module.exports = {
  SUPPORTED_INTENTS,
  classifyChatIntent,
  normalizeText,
  responseLanguage,
  isGreek,
  _terms: {
    HELP_TERMS,
    NEARBY_TERMS,
    CONDITION_TERMS,
    EXPLAIN_TERMS,
    RECOMMENDATION_TERMS,
    GREECE_DOMAIN_TERMS,
    OFF_TOPIC_TERMS,
  },
};
