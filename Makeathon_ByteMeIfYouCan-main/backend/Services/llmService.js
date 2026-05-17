const { trails } = require("../data/trails.js");
const { buildTravelerProfile } = require("../agents/travelerProfileAgent.js");
const { matchTrails, findDirectTrailMatch } = require("../agents/trailMatcherAgent.js");
const { assessSustainability } = require("../agents/sustainabilityAgent.js");
const { assessConditions } = require("../agents/conditionAgent.js");
const { buildItinerary } = require("../agents/itineraryAgent.js");
const { createNarrative } = require("../agents/narratorAgent.js");
const { getUserBehaviorInsights } = require("./userBehaviorService.js");
const {
  getConversationId,
  getConversationMemory,
  rememberRecommendation,
  rememberTrailContext,
} = require("./conversationMemoryService.js");
const { detectNearbyIntent, getNearbyOpenData } = require("./nearbyOpenDataService.js");
const {
  SUPPORTED_INTENTS,
  classifyChatIntent,
} = require("./chatIntentRouterService.js");

const ONBOARDING_EN =
  "Hi, I'm Pathfinder - your AI trail companion for sustainable hiking in Greece.\n\nTell me your fitness level, available time, terrain preferences, mood, age group, group type, or crowd tolerance, and I'll recommend a trail.\n\nYou can also ask me about a specific destination, current weather and safety conditions, nearby trails, or alternatives.";

const ONBOARDING_EL =
  "Γεια, είμαι ο Pathfinder - ο AI συνοδός σου για βιώσιμη πεζοπορία στην Ελλάδα.\n\nΠες μου επίπεδο φυσικής κατάστασης, διαθέσιμο χρόνο, προτίμηση σε τοπίο, διάθεση, ηλικιακή ομάδα, τύπο παρέας ή ανοχή στον κόσμο, και θα σου προτείνω μονοπάτι.\n\nΜπορείς επίσης να με ρωτήσεις για συγκεκριμένο προορισμό, σημερινό καιρό και ασφάλεια, κοντινά μονοπάτια ή εναλλακτικές.";

const OFF_TOPIC_EN =
  "I'm Pathfinder, and I'm trained to help with sustainable hiking, trails, outdoor destinations, weather conditions, and low-impact travel in Greece. I can't help with that topic, but I'd be happy to help you find or plan a trail experience.";

const OFF_TOPIC_EL =
  "Είμαι ο Pathfinder και είμαι εκπαιδευμένος να βοηθάω με βιώσιμη πεζοπορία, μονοπάτια, φυσικούς προορισμούς, καιρικές συνθήκες και υπεύθυνο ταξίδι στην Ελλάδα. Δεν μπορώ να απαντήσω σε αυτό το θέμα, αλλά μπορώ πολύ ευχαρίστως να σε βοηθήσω να βρεις ή να οργανώσεις μια πεζοπορική εμπειρία.";

const difficultyLabels = {
  en: {
    Easy: "Easy",
    Medium: "Moderate",
    Hard: "Hard",
  },
  el: {
    Easy: "Εύκολη",
    Medium: "Μέτρια",
    Hard: "Απαιτητική",
  },
};

const CLEAN_TEXT = {
  onboarding: {
    en: ONBOARDING_EN,
    el:
      "Γεια, είμαι ο Pathfinder - ο AI συνοδός σου για βιώσιμη πεζοπορία στην Ελλάδα.\n\nΠες μου επίπεδο φυσικής κατάστασης, διαθέσιμο χρόνο, προτίμηση σε τοπίο, διάθεση, ηλικιακή ομάδα, τύπο παρέας ή ανοχή στον κόσμο, και θα σου προτείνω μονοπάτι.\n\nΜπορείς επίσης να με ρωτήσεις για συγκεκριμένο προορισμό, σημερινό καιρό και ασφάλεια, κοντινά μονοπάτια ή εναλλακτικές.",
  },
  offTopic: {
    en: OFF_TOPIC_EN,
    el:
      "Είμαι ο Pathfinder και είμαι εκπαιδευμένος να βοηθάω με βιώσιμη πεζοπορία, μονοπάτια, φυσικούς προορισμούς, καιρικές συνθήκες και υπεύθυνο ταξίδι στην Ελλάδα. Δεν μπορώ να απαντήσω σε αυτό το θέμα, αλλά μπορώ πολύ ευχαρίστως να σε βοηθήσω να βρεις ή να οργανώσεις μια πεζοπορική εμπειρία.",
  },
  difficulty: {
    en: difficultyLabels.en,
    el: {
      Easy: "Εύκολη",
      Medium: "Μέτρια",
      Hard: "Απαιτητική",
    },
  },
};

CLEAN_TEXT.onboarding.el =
  "Γεια, είμαι ο Pathfinder - ο AI συνοδός σου για βιώσιμη πεζοπορία στην Ελλάδα.\n\nΠες μου επίπεδο φυσικής κατάστασης, διαθέσιμο χρόνο, προτίμηση σε τοπίο, διάθεση, ηλικιακή ομάδα, τύπο παρέας ή ανοχή στον κόσμο, και θα σου προτείνω μονοπάτι.\n\nΜπορείς επίσης να με ρωτήσεις για συγκεκριμένο προορισμό, σημερινό καιρό και ασφάλεια, κοντινά μονοπάτια ή εναλλακτικές.";
CLEAN_TEXT.offTopic.el =
  "Είμαι ο Pathfinder και είμαι εκπαιδευμένος να βοηθάω με βιώσιμη πεζοπορία, μονοπάτια, φυσικούς προορισμούς, καιρικές συνθήκες και υπεύθυνο ταξίδι στην Ελλάδα. Δεν μπορώ να απαντήσω σε αυτό το θέμα, αλλά μπορώ πολύ ευχαρίστως να σε βοηθήσω να βρεις ή να οργανώσεις μια πεζοπορική εμπειρία.";
CLEAN_TEXT.difficulty.el = {
  Easy: "Εύκολη",
  Medium: "Μέτρια",
  Hard: "Απαιτητική",
};

function isGreek(message) {
  return /[\u0370-\u03ff]/.test(String(message || ""));
}

function responseLanguage(message) {
  return isGreek(message) ? "el" : "en";
}

function normalizeIntentText(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .trim();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(normalizeIntentText(phrase)));
}

function includesAnyRaw(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function detectOnboardingIntent(message) {
  const text = normalizeIntentText(message);
  const exactHelpMessages = new Set([
    "help",
    "hello",
    "hi",
    "hey",
    "start",
    "βοηθεια",
    "βοήθεια",
    "γεια",
  ]);

  if (exactHelpMessages.has(text)) return true;
  if (includesAnyRaw(text, ["βοηθεια", "γεια", "τι μπορεισ", "πωσ δουλευει"])) return true;

  return includesAny(text, [
    "what can you do",
    "how does this work",
    "how it works",
    "τι μπορεις",
    "τι μπορείς",
    "πως δουλευει",
    "πώς δουλεύει",
  ]);
}

function detectConditionIntent(message) {
  const text = normalizeIntentText(message);
  if (includesAnyRaw(text, ["καιρο", "καιροσ", "ασφαλεσ", "συνθηκεσ", "ελεγξε", "σημερα"])) return true;

  return includesAny(text, [
    "condition",
    "conditions",
    "safe today",
    "safety",
    "weather",
    "forecast",
    "check conditions",
    "is it safe",
    "is safe",
    "καιρο",
    "καιρός",
    "ασφαλεσ",
    "ασφαλές",
    "συνθηκεσ",
    "συνθήκες",
    "ελεγξε",
    "έλεγξε",
    "σημερα",
    "σήμερα",
  ]);
}

function detectExplainCurrentIntent(message) {
  const text = normalizeIntentText(message);
  if (["why", "why?", "γιατι", "γιατί", "γιατι?", "γιατί?"].includes(text)) return true;
  if (includesAnyRaw(text, ["γιατι αυτο", "γιατι το διαλεξεσ", "ειναι καλο για μενα"])) return true;

  return includesAny(text, [
    "why?",
    "why",
    "why this trail",
    "why did you choose",
    "why choose",
    "why this",
    "is this good for me",
    "explain this recommendation",
    "explain current recommendation",
    "γιατι αυτο",
    "γιατί αυτό",
    "γιατι το διαλεξεσ",
    "γιατί το διάλεξες",
    "ειναι καλο για μενα",
    "είναι καλό για μένα",
  ]);
}

function detectRecommendationIntent(message) {
  const text = normalizeIntentText(message);
  if (
    includesAnyRaw(text, [
      "i want to go",
      "i would like to go",
      "i'd like to go",
      "destination",
      "trip",
      "travel",
      "weekend",
      "couple",
      "fiance",
      "fiancé",
      "girlfriend",
      "boyfriend",
      "wife",
      "husband",
      "romantic",
      "high altitude",
      "very high",
      "high place",
      "summit",
      "peak",
      "alpine",
      "προτεινε",
      "θελω",
      "θα ηθελα να παω",
      "προορισμο",
      "ταξιδι",
      "ζευγαρι",
      "αρραβωνιαστικια",
      "αρραβωνιαστικο",
      "ρομαντικο",
      "ψηλα",
      "υψομετρο",
      "κορυφη",
      "βρεσ",
      "μονοπατι",
      "πεζοπορια",
      "βουνο",
      "ποταμι",
      "δασοσ",
      "νησι",
      "θαλασσα",
      "φαραγγι",
      "χωριο",
      "ησυχο",
      "κοσμο",
      "ωρεσ",
    ])
  ) {
    return true;
  }

  return includesAny(text, [
    "recommend",
    "suggest",
    "find",
    "plan",
    "go somewhere",
    "destination",
    "trip",
    "travel",
    "weekend",
    "couple",
    "fiance",
    "fiancé",
    "romantic",
    "high altitude",
    "very high",
    "high place",
    "summit",
    "peak",
    "alpine",
    "trail",
    "hike",
    "hiking",
    "route",
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
    "easy",
    "moderate",
    "hard",
    "hours",
    "age",
    "family",
    "group",
    "children",
    "kids",
    "fitness",
    "experience",
    "προτεινε",
    "πρότεινε",
    "θελω",
    "θέλω",
    "βρες",
    "μονοπατι",
    "μονοπάτι",
    "πεζοπορια",
    "πεζοπορία",
    "βουνο",
    "βουνό",
    "ποταμι",
    "ποτάμι",
    "δασοσ",
    "δάσος",
    "νησι",
    "νησί",
    "θαλασσα",
    "θάλασσα",
    "φαραγγι",
    "φαράγγι",
    "χωριο",
    "χωριό",
    "ησυχο",
    "ήσυχο",
    "κοσμο",
    "κόσμο",
    "ωρες",
    "ώρες",
  ]);
}

function detectOffTopicIntent(message, matchedTrail) {
  if (matchedTrail) return false;
  if (detectOnboardingIntent(message)) return false;
  if (detectNearbyIntent(message)) return false;
  if (detectConditionIntent(message)) return false;
  if (detectExplainCurrentIntent(message)) return false;
  if (detectRecommendationIntent(message)) return false;

  return true;
}

function makeTextOnlyResponse({ mode, message, language, pipeline = {} }) {
  return {
    mode,
    content: message,
    message,
    nextQuestions:
      language === "el"
        ? ["Θέλεις πρόταση για ήσυχο μονοπάτι;", "Να ελέγξω καιρό για κάποιον προορισμό;"]
        : ["Would you like a quiet trail recommendation?", "Should I check weather for a destination?"],
    ai: {
      provider: "local",
      model: `${mode}-router`,
      fallbackUsed: false,
      latencyMs: 0,
    },
    pipeline,
  };
}

function buildOnboardingResponse(language) {
  return makeTextOnlyResponse({
    mode: "onboarding_help",
    language,
    message: CLEAN_TEXT.onboarding[language] || CLEAN_TEXT.onboarding.en,
    pipeline: {
      onboardingAgent: {
        status: "completed",
        output: { supportedIntents: getSupportedIntents() },
      },
    },
  });
}

function buildUnsupportedResponse(language) {
  return makeTextOnlyResponse({
    mode: "unsupported_off_topic",
    language,
    message: CLEAN_TEXT.offTopic[language] || CLEAN_TEXT.offTopic.en,
    pipeline: {
      guardrailAgent: {
        status: "completed",
        output: { reason: "off-topic request" },
      },
    },
  });
}

function buildMissingMemoryResponse(userMessage) {
  const language = responseLanguage(userMessage);
  const message =
    language === "el"
      ? "Για ποιον προορισμό θέλεις να ψάξω κοντινά μονοπάτια;"
      : "Which destination would you like me to explore nearby?";

  return {
    ...makeTextOnlyResponse({
      mode: "nearby_exploration",
      language,
      message,
      pipeline: {
        nearbyExplorationAgent: {
          status: "needs_context",
          output: {
            reason: "nearby intent detected but no previous destination exists for this conversation",
          },
        },
      },
    }),
    baseDestination: null,
    nearbyTrails: [],
    nearbyPOIs: [],
  };
}

function buildNearbyMessage({ userMessage, baseDestination, nearbyTrails, nearbyPOIs }) {
  const language = responseLanguage(userMessage);
  const trailNames = nearbyTrails.slice(0, 3).map((item) => item.name).join(", ");
  const poiNames = nearbyPOIs.slice(0, 4).map((item) => item.name).join(", ");

  if (language === "el") {
    return `Κοντά στο ${baseDestination.name} μπορείς επίσης να εξερευνήσεις${
      trailNames ? ` μονοπάτια όπως ${trailNames}` : " κοντινές φυσικές διαδρομές"
    }${poiNames ? `, μαζί με σημεία ενδιαφέροντος όπως ${poiNames}` : ""}. Κρατάω την αρχική πρόταση και ανοίγω την περιοχή γύρω της.`;
  }

  return `Near ${baseDestination.name}, you can also explore${
    trailNames ? ` trails such as ${trailNames}` : " nearby natural routes"
  }${poiNames ? `, plus points of interest like ${poiNames}` : ""}. I am keeping the original recommendation and expanding what is around it.`;
}

async function generateNearbyExplorationResponse(userMessage, conversationId) {
  const started = Date.now();
  const language = responseLanguage(userMessage);
  const memory = getConversationMemory(conversationId);

  if (!memory?.lastDestination) {
    return buildMissingMemoryResponse(userMessage);
  }

  const nearby = await getNearbyOpenData(memory.lastDestination);
  const message = buildNearbyMessage({
    userMessage,
    baseDestination: memory.lastDestination,
    nearbyTrails: nearby.nearbyTrails,
    nearbyPOIs: nearby.nearbyPOIs,
  });

  return {
    mode: "nearby_exploration",
    content: message,
    message,
    baseDestination: {
      id: memory.lastDestination.id,
      name: memory.lastDestination.name,
      region: memory.lastDestination.region,
      coordinates: memory.lastDestination.coordinates,
      imageUrl: memory.lastDestination.imageUrl,
    },
    nearbyTrails: nearby.nearbyTrails,
    nearbyPOIs: nearby.nearbyPOIs,
    openData: {
      ...(memory.lastOpenData || {}),
      nearby: nearby.openData,
    },
    nextQuestions:
      language === "el"
        ? ["Να τα βάλω σε μικρό κυκλικό πλάνο;", "Να ψάξω μόνο χωριά και σημεία θέας;", "Να αποφύγουμε τα πιο πολυσύχναστα κοντινά;"]
        : ["Should I turn these into a short loop?", "Do you want only villages and viewpoints?", "Should we avoid the busier nearby spots?"],
    ai: {
      provider: "openstreetmap-overpass",
      model: "nearby-exploration-router",
      fallbackUsed: nearby.openData?.source !== "openstreetmap-overpass",
      latencyMs: Date.now() - started,
    },
    pipeline: {
      nearbyExplorationAgent: {
        status: "completed",
        output: {
          baseDestinationId: memory.lastDestination.id,
          nearbyTrailCount: nearby.nearbyTrails.length,
          nearbyPOICount: nearby.nearbyPOIs.length,
          source: nearby.openData?.source,
        },
      },
    },
  };
}

function buildMissingConditionTrailResponse(userMessage) {
  const language = responseLanguage(userMessage);
  const message =
    language === "el"
      ? "Για ποιο μονοπάτι ή προορισμό θέλεις να ελέγξω καιρό και ασφάλεια σήμερα;"
      : "Which trail or destination would you like me to check conditions for today?";

  return {
    ...makeTextOnlyResponse({
      mode: "condition_check",
      language,
      message,
      pipeline: {
        conditionAgent: {
          status: "needs_context",
          output: {
            reason: "condition check intent detected but no trail was mentioned",
          },
        },
      },
    }),
    selectedTrail: null,
    conditions: null,
    weather: null,
  };
}

function readableSafetyLevel(level, language) {
  if (language === "el") {
    if (level === "unsafe") return "μη ασφαλές σήμερα";
    if (level === "suitable-with-checks") return "κατάλληλο με ελέγχους";
    return "χρειάζεται τοπική επιβεβαίωση";
  }

  if (level === "unsafe") return "unsafe today";
  if (level === "suitable-with-checks") return "suitable with checks";
  return "needs local verification";
}

function buildConditionTips(conditions, language) {
  if (language === "el") {
    if (conditions.safetyLevel === "unsafe") {
      return "Πρότεινα να το αποφύγεις σήμερα ή να επιλέξεις πιο προστατευμένη εναλλακτική.";
    }

    return "Έλεγξε τοπική σήμανση, πρόσφατη βροχή, διαθέσιμο φως ημέρας και νερό πριν ξεκινήσεις.";
  }

  if (conditions.safetyChecks?.length) {
    return conditions.safetyChecks.slice(0, 2).join(" ");
  }

  return "Check local signage, daylight, water, and recent rain before entering the trail.";
}

function localizeWeatherDescription(weather, language) {
  const current = weather?.current;
  const raw = current?.description || weather?.seasonal?.summary || "";
  const text = normalizeIntentText(raw);

  if (language !== "el") return raw || "seasonal conditions";
  if (!raw && weather?.seasonal?.level) return "εποχικός έλεγχος";

  if (text.includes("clear")) return "καθαρός ουρανός";
  if (text.includes("partly cloudy")) return "μερική συννεφιά";
  if (text.includes("cloud")) return "συννεφιά";
  if (text.includes("fog")) return "ομίχλη";
  if (text.includes("drizzle")) return "ψιλόβροχο";
  if (text.includes("rain")) return "βροχή";
  if (text.includes("snow")) return "χιόνι";
  if (text.includes("thunder")) return "καταιγίδα";
  if (text.includes("generally suitable")) return "η εποχή είναι γενικά κατάλληλη για τη διαδρομή";
  if (text.includes("summer heat")) return "χρειάζεται προσοχή στη ζέστη";
  if (text.includes("winter")) return "χρειάζεται προσοχή λόγω χειμερινών συνθηκών";
  if (text.includes("shoulder season")) return "οι συνθήκες μπορεί να αλλάζουν μέσα στην εποχή";

  return "εποχικός έλεγχος συνθηκών";
}

function buildConditionCheckMessage(userMessage, trail, conditions) {
  const language = responseLanguage(userMessage);
  const current = conditions.weather?.current;
  const temperature = Number.isFinite(current?.temperatureC)
    ? `${current.temperatureC}C`
    : language === "el"
      ? "χωρίς ζωντανή θερμοκρασία"
      : "live temperature unavailable";
  const description = localizeWeatherDescription(conditions.weather, language);
  const wind = Number.isFinite(current?.windKph) ? `${current.windKph} km/h` : language === "el" ? "μη διαθέσιμος" : "unavailable";
  const safety = readableSafetyLevel(conditions.safetyLevel, language);
  const tips = buildConditionTips(conditions, language);
  const suitable =
    language === "el"
      ? conditions.safetyLevel === "unsafe"
        ? "Δεν θα το θεωρούσα κατάλληλο σήμερα χωρίς ασφαλέστερη εναλλακτική."
        : "Φαίνεται κατάλληλο σήμερα, αν ακολουθήσεις τους ελέγχους ασφαλείας και επιβεβαιώσεις τοπικά."
      : conditions.safetyLevel === "unsafe"
        ? "I would not treat it as suitable today without a safer alternative."
        : "It looks suitable today if you follow the checks and verify local guidance.";

  if (language === "el") {
    return `${trail.name}: ${temperature}, ${description}, άνεμος ${wind}. Επίπεδο ασφάλειας: ${safety}. ${tips} ${suitable}`;
  }

  return `${trail.name}: ${temperature}, ${description}, wind ${wind}. Safety level: ${safety}. ${tips} ${suitable}`;
}

async function generateConditionCheckResponse(userMessage, conversationId, matchedTrail) {
  const started = Date.now();
  const memory = getConversationMemory(conversationId);
  const selectedTrail = matchedTrail || memory?.lastDestination;

  if (!selectedTrail) {
    return buildMissingConditionTrailResponse(userMessage);
  }

  const conditions = await assessConditions(selectedTrail);
  const language = responseLanguage(userMessage);
  const message = buildConditionCheckMessage(userMessage, selectedTrail, conditions);
  const response = {
    mode: "condition_check",
    content: message,
    message,
    selectedTrail: serializeTrail(selectedTrail),
    conditions,
    weather: conditions.weather,
    nextQuestions:
      language === "el"
        ? ["Να σου προτείνω ασφαλέστερη εναλλακτική;", "Να δω κοντινά πιο προστατευμένα σημεία;", "Θέλεις πλήρες itinerary για άλλη μέρα;"]
        : ["Should I suggest a safer alternative?", "Should I check sheltered nearby options?", "Do you want a full itinerary for another day?"],
    ai: {
      provider: conditions.weather?.source || "condition-agent",
      model: "condition-intent-router",
      fallbackUsed: conditions.weather?.source === "seasonal-fallback",
      latencyMs: Date.now() - started,
    },
    pipeline: {
      conditionAgent: {
        status: "completed",
        output: conditions,
      },
    },
  };

  rememberTrailContext(conversationId, {
    lastDestination: selectedTrail,
    lastOpenData: { weatherSource: conditions.weather?.source },
  });

  return response;
}

function sharedTerms(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function buildSimilarAlternatives(primary) {
  const primaryTerrain = primary.terrain || [];
  const primaryMood = primary.mood || [];

  return trails
    .filter((trail) => trail.id !== primary.id)
    .map((trail) => {
      const regionBonus = trail.region === primary.region ? 5 : 0;
      const score =
        sharedTerms(primaryTerrain, trail.terrain || []) * 6 +
        sharedTerms(primaryMood, trail.mood || []) * 4 +
        regionBonus +
        Math.max(0, 20 - Math.abs((trail.durationHours || 0) - (primary.durationHours || 0)) * 3) -
        Math.round((trail.crowdPressure || 0) / 15);

      return {
        ...trail,
        matchScore: Math.max(0, Math.round(score)),
        recommendationExplanation: `Similar terrain or travel mood to ${primary.name}.`,
      };
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.crowdPressure - b.crowdPressure;
    })
    .slice(0, 4)
    .map((trail) => ({
      id: trail.id,
      name: trail.name,
      region: trail.region,
      imageUrl: trail.imageUrl,
      reason: trail.recommendationExplanation,
      crowdPressure: trail.crowdPressure,
      difficulty: trail.difficulty,
      durationHours: trail.durationHours,
      matchScore: Math.min(100, trail.matchScore),
    }));
}

function buildTopCandidates(primary, alternatives) {
  return [
    {
      id: primary.id,
      name: primary.name,
      region: primary.region,
      imageUrl: primary.imageUrl,
      matchScore: Math.min(100, primary.matchScore || 95),
      difficulty: primary.difficulty,
      durationHours: primary.durationHours,
      crowdPressure: primary.crowdPressure,
      terrain: primary.terrain,
      seasonality: primary.seasonality,
      scoreBreakdown: primary.scoreBreakdown,
      reason: primary.recommendationExplanation,
    },
    ...alternatives.slice(0, 4).map((trail) => ({
      id: trail.id,
      name: trail.name,
      region: trail.region,
      imageUrl: trail.imageUrl,
      matchScore: trail.matchScore,
      difficulty: trail.difficulty,
      durationHours: trail.durationHours,
      crowdPressure: trail.crowdPressure,
      reason: trail.reason,
    })),
  ];
}

function serializeTrail(trail) {
  return {
    id: trail.id,
    name: trail.name,
    region: trail.region,
    coordinates: trail.coordinates,
    imageUrl: trail.imageUrl,
    difficulty: trail.difficulty,
    durationHours: trail.durationHours,
    distanceKm: trail.distanceKm,
    elevationGainM: trail.elevationGainM,
    crowdPressure: trail.crowdPressure,
    sustainabilityScore: trail.sustainabilityScore,
    seasonality: trail.seasonality,
  };
}

function mapRecommendedDestination(primary, sustainability, language) {
  return {
    id: primary.id,
    name: primary.name,
    region: primary.region,
    coordinates: primary.coordinates,
    imageUrl: primary.imageUrl,
    difficulty: CLEAN_TEXT.difficulty[language][primary.difficulty] || primary.difficulty,
    duration: language === "el" ? `${primary.durationHours} ώρες` : `${primary.durationHours} hours`,
    durationHours: primary.durationHours,
    distanceKm: primary.distanceKm,
    elevationGainM: primary.elevationGainM,
    sustainabilityScore: sustainability.sustainabilityScore,
    crowdPressure: sustainability.crowdPressure,
    localCommunityBenefit: sustainability.localCommunityBenefit,
    matchScore: Math.min(100, primary.matchScore || 0),
    highlights: primary.highlights,
    recommendationExplanation: primary.recommendationExplanation,
    seasonality: primary.seasonality,
  };
}

function mapAlternatives(alternatives, language) {
  return alternatives.map((item) => ({
    ...item,
    difficulty: CLEAN_TEXT.difficulty[language][item.difficulty] || item.difficulty,
    duration: language === "el" ? `${item.durationHours} ώρες` : `${item.durationHours} hours`,
  }));
}

function buildDirectTrailInfoMessage({ trail, conditions, sustainability, language }) {
  const weather = localizeWeatherDescription(conditions.weather, language);
  const safety = readableSafetyLevel(conditions.safetyLevel, language);

  if (language === "el") {
    return `${trail.name} βρίσκεται στην περιοχή ${trail.region}. Είναι ${CLEAN_TEXT.difficulty.el[trail.difficulty] || trail.difficulty} διαδρομή, περίπου ${trail.durationHours} ώρες, ${trail.distanceKm} km, με +${trail.elevationGainM} m ανάβαση.\n\nΤαιριάζει αν θέλεις ${trail.terrain?.slice(0, 3).join(", ")} και σημεία όπως ${trail.highlights?.slice(0, 3).join(", ")}.\n\nΣήμερα: ${weather}. Ασφάλεια: ${safety}. Sustainability score: ${sustainability.sustainabilityScore}/100, crowd pressure: ${trail.crowdPressure}/100.`;
  }

  return `${trail.name} is in ${trail.region}. It is a ${difficultyLabels.en[trail.difficulty] || trail.difficulty} route, about ${trail.durationHours} hours, ${trail.distanceKm} km, with +${trail.elevationGainM} m elevation gain.\n\nIt fits travelers looking for ${trail.terrain?.slice(0, 3).join(", ")} and highlights such as ${trail.highlights?.slice(0, 3).join(", ")}.\n\nToday: ${weather}. Safety: ${safety}. Sustainability score: ${sustainability.sustainabilityScore}/100, crowd pressure: ${trail.crowdPressure}/100.`;
}

function buildLocalPlaceVoice(trail, language) {
  const feature = trail.highlights?.[0] || trail.terrain?.[0] || "the trail";

  if (language === "el") {
    return `Είμαι το ${trail.name}. Περπάτησέ με αργά κοντά στο ${feature}, με σεβασμό στο τοπίο και στους ανθρώπους του.`;
  }

  return `I am ${trail.name}. Walk me slowly near ${feature}, with care for the landscape and the people who keep it alive.`;
}

function buildLocalSustainabilityNarrative(trail, sustainability, language) {
  if (language === "el") {
    return `Η επιλογή κρατά το crowd pressure στο ${trail.crowdPressure}/100 και στηρίζει την τοπική κοινότητα με score ${sustainability.localCommunityBenefit}/100. Μείνε στο σηματοδοτημένο μονοπάτι και προτίμησε τοπικές επιχειρήσεις.`;
  }

  return `This choice keeps crowd pressure at ${trail.crowdPressure}/100 and supports the local community with a ${sustainability.localCommunityBenefit}/100 local-impact score. Stay on marked paths and support small local businesses.`;
}

function buildLocalNextQuestions(trail, language) {
  if (language === "el") {
    return [
      `Να ελέγξω τις σημερινές συνθήκες για το ${trail.name};`,
      "Να ψάξω κοντινά μονοπάτια και σημεία ενδιαφέροντος;",
      "Θέλεις πιο εύκολη ή πιο απομονωμένη εναλλακτική;",
    ];
  }

  return [
    `Should I check today's conditions for ${trail.name}?`,
    "Should I look for nearby trails and points of interest?",
    "Do you want an easier or more remote alternative?",
  ];
}

function looksGreek(text) {
  return /[\u0370-\u03ff]/.test(String(text || ""));
}

function normalizeNarrativeForLanguage(narrative, context, language) {
  if (language === "el") return narrative;
  if (!looksGreek(narrative.content) && narrative.source !== "fallback") return narrative;

  return {
    ...narrative,
    content: buildDirectTrailInfoMessage({
      trail: context.trail,
      conditions: context.conditions,
      sustainability: context.sustainability,
      language: "en",
    }),
    placeVoice: buildLocalPlaceVoice(context.trail, "en"),
    sustainabilityNarrative: buildLocalSustainabilityNarrative(context.trail, context.sustainability, "en"),
    nextQuestions: buildLocalNextQuestions(context.trail, "en"),
  };
}

async function buildRecommendationResponse({
  userMessage,
  conversationId,
  travelerProfile,
  primary,
  alternatives,
  topCandidates,
  userBehaviorInsights,
  mode,
  directInfo = false,
}) {
  const language = responseLanguage(userMessage);
  const sustainability = assessSustainability(primary, alternatives);
  const conditions = await assessConditions(primary);
  const itinerary = buildItinerary(primary, travelerProfile, conditions);

  const context = {
    language,
    travelerProfile,
    trail: primary,
    alternatives,
    sustainability,
    conditions,
    itinerary,
    userBehaviorInsights,
    responseStyle: directInfo ? "direct_trail_info" : "recommendation_request",
  };

  const rawNarrative = directInfo
    ? {
        content: buildDirectTrailInfoMessage({ trail: primary, conditions, sustainability, language }),
        placeVoice: buildLocalPlaceVoice(primary, language),
        sustainabilityNarrative: buildLocalSustainabilityNarrative(primary, sustainability, language),
        nextQuestions: buildLocalNextQuestions(primary, language),
        source: "local",
        model: "direct-trail-info-template",
        fallbackUsed: false,
        latencyMs: 0,
        warning: undefined,
      }
    : await createNarrative(context);
  const narrative = normalizeNarrativeForLanguage(rawNarrative, context, language);

  const recommendedDestination = mapRecommendedDestination(primary, sustainability, language);
  const mappedAlternatives = mapAlternatives(alternatives, language);
  const scores = {
    ...sustainability,
    finalScore: Math.min(100, sustainability.finalScore),
  };
  const pipeline = {
    travelerProfileAgent: {
      status: "completed",
      output: travelerProfile,
    },
    trailMatchingAgent: {
      status: directInfo ? "direct_match" : "completed",
      output: {
        selectedTrailId: primary.id,
        selectedTrailName: primary.name,
        matchScore: Math.min(100, primary.matchScore || 95),
        recommendationExplanation: primary.recommendationExplanation,
        userBehaviorBonus: primary.scoreBreakdown?.userBehavior || 0,
        topCandidates,
        alternatives: alternatives.map((item) => ({
          id: item.id,
          name: item.name,
          reason: item.reason,
        })),
      },
    },
    sustainabilityAgent: {
      status: "completed",
      output: scores,
    },
    conditionsAgent: {
      status: "completed",
      output: conditions,
    },
    itineraryAgent: {
      status: "completed",
      output: itinerary,
    },
    narratorAgent: {
      status: "completed",
      output: {
        message: narrative.content,
        placeVoice: narrative.placeVoice,
        sustainabilityNarrative: narrative.sustainabilityNarrative,
        nextQuestions: narrative.nextQuestions,
        source: narrative.source,
        model: narrative.model,
        fallbackUsed: narrative.fallbackUsed,
        latencyMs: narrative.latencyMs,
        warning: narrative.warning,
        userBehaviorInsight: userBehaviorInsights?.insightText,
      },
    },
  };
  const ai = {
    provider: narrative.source,
    model: narrative.model,
    fallbackUsed: Boolean(narrative.fallbackUsed),
    latencyMs: narrative.latencyMs,
  };

  const response = {
    mode,
    content: narrative.content,
    message: narrative.content,
    placeVoice: narrative.placeVoice,
    sustainabilityNarrative: narrative.sustainabilityNarrative,
    nextQuestions: narrative.nextQuestions,
    source: narrative.source,
    warning: narrative.warning,
    travelerProfile,
    userBehaviorInsights,
    recommendedDestination,
    alternatives: mappedAlternatives,
    topCandidates,
    scores,
    conditions,
    weather: conditions.weather,
    biodiversity: {
      source: "mock-fallback",
      summary: "Biodiversity layer is ready for iNaturalist enrichment; using curated trail highlights for now.",
      highlights: primary.highlights,
    },
    openData: {
      trailSource: "curated-static-fallback",
      weatherSource: conditions.weather?.source,
      routingSource: "curated-static-fallback",
      plannedIntegrations: ["OpenStreetMap / Overpass", "OpenRouteService", "iNaturalist"],
    },
    itinerary,
    ai,
    pipeline,
    agents: [
      { name: "Traveler Profile Agent", status: "completed", output: travelerProfile },
      {
        name: "Trail Matcher Agent",
        status: directInfo ? "direct_match" : "completed",
        output: {
          selectedTrailId: primary.id,
          matchScore: Math.min(100, primary.matchScore || 95),
          topCandidates: topCandidates.map((item) => ({
            id: item.id,
            name: item.name,
            matchScore: item.matchScore,
            reason: item.reason,
          })),
          alternatives: alternatives.map((item) => item.id),
        },
      },
      { name: "Sustainability Agent", status: "completed", output: sustainability },
      { name: "Real-Time Conditions Agent", status: "completed", output: conditions },
      { name: "Itinerary Agent", status: "completed", output: itinerary },
      { name: "Narrator Agent", status: "completed", output: { source: narrative.source, warning: narrative.warning } },
    ],
  };

  rememberRecommendation(conversationId, {
    lastDestination: primary,
    lastOpenData: response.openData,
    lastRecommendation: response,
  });

  return response;
}

async function generateDirectTrailInfoResponse(userMessage, conversationId, matchedTrail) {
  const travelerProfile = buildTravelerProfile(userMessage);
  const userBehaviorInsights = getUserBehaviorInsights(travelerProfile);
  const primary = {
    ...matchedTrail,
    matchScore: 95,
    scoreBreakdown: {
      directTrailMatch: 95,
      userBehavior: 0,
    },
    recommendationExplanation: "The user explicitly asked about this trail.",
  };
  const alternatives = buildSimilarAlternatives(primary);

  return buildRecommendationResponse({
    userMessage,
    conversationId,
    travelerProfile,
    primary,
    alternatives,
    topCandidates: buildTopCandidates(primary, alternatives),
    userBehaviorInsights,
    mode: "direct_trail_info",
    directInfo: true,
  });
}

async function generateRecommendationResponse(userMessage, conversationId) {
  const travelerProfile = buildTravelerProfile(userMessage);
  const userBehaviorInsights = getUserBehaviorInsights(travelerProfile);
  const { primary, alternatives, topCandidates } = matchTrails(travelerProfile, trails, {
    userBehaviorInsights,
  });

  return buildRecommendationResponse({
    userMessage,
    conversationId,
    travelerProfile,
    primary,
    alternatives,
    topCandidates,
    userBehaviorInsights,
    mode: "recommendation_request",
  });
}

function buildExplainCurrentResponse(userMessage, conversationId) {
  const language = responseLanguage(userMessage);
  const memory = getConversationMemory(conversationId);
  const previous = memory?.lastRecommendation;
  const trail = memory?.lastDestination;

  if (!trail || !previous?.recommendedDestination) {
    return makeTextOnlyResponse({
      mode: "explain_current_recommendation",
      language,
      message:
        language === "el"
          ? "Δεν έχω ακόμα ενεργή πρόταση για να εξηγήσω. Πες μου τι είδους πεζοπορία θέλεις και θα σου προτείνω ένα μονοπάτι."
          : "I do not have an active recommendation to explain yet. Tell me what kind of hike you want and I will recommend a trail.",
      pipeline: {
        explanationAgent: {
          status: "needs_context",
          output: { reason: "no current recommendation in conversation memory" },
        },
      },
    });
  }

  const profile = previous.travelerProfile || {};
  const scores = previous.scores || {};
  const weather = previous.weather || {};
  const userBehaviorInsights = previous.userBehaviorInsights || {};
  const profileBits = [
    profile.fitnessLevel ? `fitness: ${profile.fitnessLevel}` : null,
    profile.availableHours ? `time: ${profile.availableHours}h` : null,
    profile.preferredTerrain?.length ? `terrain: ${profile.preferredTerrain.join(", ")}` : null,
    profile.quietPreference ? "low-crowd preference" : null,
  ].filter(Boolean);

  const message =
    language === "el"
      ? `${trail.name} επιλέχθηκε επειδή ταιριάζει στο προφίλ σου (${profileBits.join("; ") || "ισορροπημένες προτιμήσεις"}).\n\nΈχει sustainability score ${scores.sustainabilityScore ?? trail.sustainabilityScore}/100, crowd pressure ${scores.crowdPressure ?? trail.crowdPressure}/100 και σημερινό έλεγχο καιρού: ${weather.summary || "χρειάζεται τοπική επιβεβαίωση"}.\n\n${userBehaviorInsights.insightText || "Τα mock behavioral insights λειτουργούν μόνο υποστηρικτικά και δεν υπερισχύουν ασφάλειας ή καιρού."}`
      : `${trail.name} was chosen because it matches your profile (${profileBits.join("; ") || "balanced hiking preferences"}).\n\nIt has a sustainability score of ${scores.sustainabilityScore ?? trail.sustainabilityScore}/100, crowd pressure of ${scores.crowdPressure ?? trail.crowdPressure}/100, and today's weather check says: ${weather.summary || "verify locally before departure"}.\n\n${userBehaviorInsights.insightText || "The mock traveler-behavior insight is only a supporting signal and never overrides safety or weather."}`;

  return makeTextOnlyResponse({
    mode: "explain_current_recommendation",
    language,
    message,
    pipeline: {
      explanationAgent: {
        status: "completed",
        output: {
          selectedTrailId: trail.id,
          profileMatch: profileBits,
          sustainability: scores,
          weather,
          userBehaviorInsight: userBehaviorInsights.insightText,
        },
      },
    },
  });
}

function getSupportedIntents() {
  return SUPPORTED_INTENTS;
}

function attachOrchestration(response, route) {
  return {
    ...response,
    orchestration: {
      intent: route.intent,
      confidence: route.confidence,
      reason: route.reason,
      signals: route.signals,
    },
    pipeline: {
      intentRouter: {
        status: "completed",
        output: {
          intent: route.intent,
          confidence: route.confidence,
          reason: route.reason,
          signals: route.signals,
        },
      },
      ...(response.pipeline || {}),
    },
  };
}

async function generateAIResponse(userMessage, options = {}) {
  const conversationId = getConversationId(options.conversationId);
  const travelerProfile = buildTravelerProfile(userMessage);
  const matchedTrail = findDirectTrailMatch(travelerProfile, trails);
  const memory = getConversationMemory(conversationId);
  const route = classifyChatIntent({
    message: userMessage,
    matchedTrail,
    hasMemory: Boolean(memory?.lastDestination || memory?.lastRecommendation),
  });
  const language = route.language;
  let response;

  if (route.intent === "unsupported_off_topic") {
    response = buildUnsupportedResponse(language);
  } else if (route.intent === "onboarding_help") {
    response = buildOnboardingResponse(language);
  } else if (route.intent === "nearby_exploration") {
    response = await generateNearbyExplorationResponse(userMessage, conversationId);
  } else if (route.intent === "condition_check") {
    response = await generateConditionCheckResponse(userMessage, conversationId, matchedTrail);
  } else if (route.intent === "direct_trail_info" && matchedTrail) {
    response = await generateDirectTrailInfoResponse(userMessage, conversationId, matchedTrail);
  } else if (route.intent === "explain_current_recommendation") {
    response = buildExplainCurrentResponse(userMessage, conversationId);
  } else {
    response = await generateRecommendationResponse(userMessage, conversationId);
  }

  return attachOrchestration(response, route);
}

module.exports = {
  generateAIResponse,
  _intentHelpers: {
    detectOnboardingIntent,
    detectConditionIntent,
    detectExplainCurrentIntent,
    detectRecommendationIntent,
    detectOffTopicIntent,
    classifyChatIntent,
    getSupportedIntents,
  },
};
