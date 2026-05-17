const KEYWORDS = {
  terrain: {
    island: ["island", "\u03bd\u03b7\u03c3\u03b9", "\u03bd\u03b7\u03c3\u03b9\u03c9\u03c4\u03b9\u03ba"],
    mountain: ["mountain", "\u03b2\u03bf\u03c5\u03bd\u03bf", "\u03bf\u03c1\u03b5\u03b9\u03bd", "\u03ba\u03bf\u03c1\u03c5\u03c6\u03b7", "ridge", "high", "very high", "high altitude", "altitude", "alpine", "summit", "peak", "elevation", "\u03c8\u03b7\u03bb\u03b1", "\u03c5\u03c8\u03bf\u03bc\u03b5\u03c4\u03c1\u03bf"],
    river: ["river", "\u03c0\u03bf\u03c4\u03b1\u03bc\u03b9", "\u03bd\u03b5\u03c1\u03bf", "stream", "water"],
    forest: ["forest", "\u03b4\u03b1\u03c3\u03bf\u03c2", "\u03c3\u03ba\u03b9\u03b1", "trees", "woods"],
    village: ["village", "\u03c7\u03c9\u03c1\u03b9\u03bf", "\u03c0\u03b1\u03c1\u03b1\u03b4\u03bf\u03c3\u03b9\u03b1\u03ba", "stone village"],
    sea: ["sea", "\u03b8\u03b1\u03bb\u03b1\u03c3\u03c3\u03b1", "coast", "coastal", "beach", "\u03c0\u03b1\u03c1\u03b1\u03bb\u03b9\u03b1"],
    lake: ["lake", "\u03bb\u03b9\u03bc\u03bd\u03b7", "wetland"],
    gorge: ["gorge", "\u03c6\u03b1\u03c1\u03b1\u03b3\u03b3\u03b9", "canyon"],
  },
  mood: {
    cinematic: ["cinematic", "\u03c4\u03bf\u03c0\u03b9\u03bf", "view", "views", "sunset", "\u03c6\u03c9\u03c4\u03bf", "photo", "romantic", "couple", "fiance", "fianc\u00e9", "girlfriend", "boyfriend", "wife", "husband", "\u03b6\u03b5\u03c5\u03b3\u03b1\u03c1\u03b9", "\u03c1\u03bf\u03bc\u03b1\u03bd\u03c4\u03b9\u03ba"],
    adventure: ["adventure", "\u03c0\u03b5\u03c1\u03b9\u03c0\u03b5\u03c4\u03b5\u03b9\u03b1", "\u03b1\u03b3\u03c1\u03b9\u03b1", "\u03c6\u03c5\u03c3\u03b7", "challenging", "wild", "waterfall"],
    spiritual: ["spiritual", "monastery", "\u03bc\u03bf\u03bd\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9", "chapel", "history", "sacred"],
    remote: ["remote", "hidden", "quiet", "\u03b7\u03c3\u03c5\u03c7\u03bf", "\u03b1\u03c0\u03bf\u03bc\u03bf\u03bd\u03c9\u03bc\u03b5\u03bd\u03bf", "\u03c7\u03c9\u03c1\u03b9\u03c2 \u03ba\u03bf\u03c3\u03bc\u03bf", "\u03c7\u03c9\u03c1\u03b9\u03c2 \u03c0\u03bf\u03bb\u03c5 \u03ba\u03bf\u03c3\u03bc\u03bf", "\u03bb\u03b9\u03b3\u03bf \u03ba\u03bf\u03c3\u03bc\u03bf"],
    authentic: ["authentic", "local", "village", "\u03c7\u03c9\u03c1\u03b9\u03bf", "\u03c0\u03b1\u03c1\u03b1\u03b4\u03bf\u03c3\u03b9\u03b1\u03ba\u03bf", "taverna"],
  },
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text, words) {
  return words.some((word) => text.includes(normalize(word)));
}

function collectMatches(text, groups) {
  return Object.entries(groups)
    .filter(([, words]) => includesAny(text, words))
    .map(([key]) => key);
}

function inferFitness(text) {
  if (includesAny(text, ["\u03b4\u03c5\u03c3\u03ba\u03bf\u03bb\u03bf", "hard", "experienced", "\u03b5\u03bc\u03c0\u03b5\u03b9\u03c1\u03bf\u03c2", "advanced"])) {
    return "advanced";
  }

  if (includesAny(text, ["\u03b5\u03c5\u03ba\u03bf\u03bb\u03bf", "beginner", "\u03b1\u03c1\u03c7\u03b1\u03c1\u03b9\u03bf\u03c2", "\u03c0\u03b1\u03b9\u03b4\u03b9\u03b1", "family"])) {
    return "beginner";
  }

  return "moderate";
}

function inferAvailableHours(text) {
  const hourMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(\u03c9\u03c1\u03b5\u03c2|\u03c9\u03c1\u03b1|hours|hour|hrs|h)/i);
  if (!hourMatch) return null;

  return Number(hourMatch[1].replace(",", "."));
}

function inferGroupSize(text) {
  if (includesAny(text, ["couple", "fiance", "fianc\u00e9", "girlfriend", "boyfriend", "wife", "husband", "\u03b6\u03b5\u03c5\u03b3\u03b1\u03c1\u03b9", "\u03b1\u03c1\u03c1\u03b1\u03b2\u03c9\u03bd\u03b9\u03b1\u03c3\u03c4"])) {
    return 2;
  }

  const groupMatch = text.match(/(\d+)\s*(\u03b1\u03c4\u03bf\u03bc\u03b1|people|persons)/i);
  if (!groupMatch) return null;

  return Number(groupMatch[1]);
}

function inferTravelStyle(text, moodTags) {
  if (includesAny(text, ["couple", "fiance", "fianc\u00e9", "romantic", "\u03b6\u03b5\u03c5\u03b3\u03b1\u03c1\u03b9", "\u03c1\u03bf\u03bc\u03b1\u03bd\u03c4\u03b9\u03ba"])) return "scenic";
  if (moodTags.includes("remote")) return "low-crowd";
  if (moodTags.includes("adventure")) return "adventure";
  if (moodTags.includes("spiritual")) return "cultural";
  if (moodTags.includes("authentic")) return "local";
  if (moodTags.includes("cinematic")) return "scenic";
  return includesAny(text, ["slow", "\u03c7\u03b1\u03bb\u03b1\u03c1\u03b1", "calm"]) ? "slow" : "balanced";
}

function buildTravelerProfile(message) {
  const text = normalize(message);
  const preferredTerrain = collectMatches(text, KEYWORDS.terrain);
  const moodTags = collectMatches(text, KEYWORDS.mood);
  const quietPreference = moodTags.includes("remote");
  const availableHours = inferAvailableHours(text);
  const wantsHighAltitude = includesAny(text, [
    "high",
    "very high",
    "high altitude",
    "altitude",
    "alpine",
    "summit",
    "peak",
    "elevation",
    "\u03c8\u03b7\u03bb\u03b1",
    "\u03c5\u03c8\u03bf\u03bc\u03b5\u03c4\u03c1\u03bf",
    "\u03ba\u03bf\u03c1\u03c5\u03c6\u03b7",
  ]);
  const coupleContext = includesAny(text, [
    "couple",
    "fiance",
    "fianc\u00e9",
    "girlfriend",
    "boyfriend",
    "wife",
    "husband",
    "romantic",
    "\u03b6\u03b5\u03c5\u03b3\u03b1\u03c1\u03b9",
    "\u03b1\u03c1\u03c1\u03b1\u03b2\u03c9\u03bd\u03b9\u03b1\u03c3\u03c4",
    "\u03c1\u03bf\u03bc\u03b1\u03bd\u03c4\u03b9\u03ba",
  ]);

  return {
    fitnessLevel: inferFitness(text),
    experience: includesAny(text, ["first time", "\u03c0\u03c1\u03c9\u03c4\u03b7 \u03c6\u03bf\u03c1\u03b1"]) ? "first-timer" : "some outdoor experience",
    groupSize: inferGroupSize(text) || 1,
    interests: [
      ...(wantsHighAltitude ? ["high altitude", "summit views"] : []),
      ...(coupleContext ? ["romantic views"] : []),
      ...(quietPreference ? ["quiet"] : []),
      ...(moodTags.includes("cinematic") ? ["photography"] : []),
      ...(includesAny(text, ["wildlife", "birds", "\u03c0\u03bf\u03c5\u03bb\u03b9\u03b1"]) ? ["wildlife"] : []),
      ...(moodTags.includes("spiritual") ? ["history"] : []),
    ],
    availableHours,
    preferredTerrain: preferredTerrain.length ? preferredTerrain : ["mountain", "river"],
    moodTags,
    travelStyle: inferTravelStyle(text, moodTags),
    quietPreference,
    elevationPreference: wantsHighAltitude ? "high" : null,
    groupType: coupleContext ? "couple" : "solo",
    rawRequest: message,
    missingInfoQuestions: [
      !availableHours ? "\u03a0\u03cc\u03c3\u03b5\u03c2 \u03ce\u03c1\u03b5\u03c2 \u03ad\u03c7\u03b5\u03b9\u03c2 \u03b4\u03b9\u03b1\u03b8\u03ad\u03c3\u03b9\u03bc\u03b5\u03c2;" : null,
      !includesAny(text, ["\u03b5\u03c5\u03ba\u03bf\u03bb\u03bf", "\u03bc\u03b5\u03c4\u03c1\u03b9\u03bf", "\u03bc\u03b5\u03c4\u03c1\u03b9\u03b1", "\u03b4\u03c5\u03c3\u03ba\u03bf\u03bb\u03bf", "hard", "moderate", "easy"])
        ? "\u0398\u03ad\u03bb\u03b5\u03b9\u03c2 \u03b5\u03cd\u03ba\u03bf\u03bb\u03b7, \u03bc\u03ad\u03c4\u03c1\u03b9\u03b1 \u03ae \u03b1\u03c0\u03b1\u03b9\u03c4\u03b7\u03c4\u03b9\u03ba\u03ae \u03b4\u03b9\u03b1\u03b4\u03c1\u03bf\u03bc\u03ae;"
        : null,
    ].filter(Boolean),
  };
}

module.exports = { buildTravelerProfile };
