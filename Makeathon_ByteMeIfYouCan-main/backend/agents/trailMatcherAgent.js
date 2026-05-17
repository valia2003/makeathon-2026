const DIFFICULTY_ORDER = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const SCORE_WEIGHTS = {
  terrain: 28,
  mood: 22,
  crowd: 16,
  duration: 14,
  difficulty: 12,
  travelStyle: 12,
  seasonality: 10,
  interests: 8,
  sustainability: 8,
  localImpact: 4,
  userBehavior: 10,
};

const TERRAIN_GROUPS = {
  island: ["island", "crete", "coast", "coast access", "coastal", "sea"],
  sea: ["sea", "coast", "coast access", "coastal", "beach", "island"],
  mountain: ["mountain", "ridge", "summit", "gorge", "alpine", "peak", "high altitude", "elevation"],
  river: ["river", "dry riverbed", "waterfall", "lake", "wetland"],
  forest: ["forest", "shade", "trees", "woods"],
  village: ["village", "stone villages", "local food", "local stay", "village stay"],
};

const MOOD_GROUPS = {
  cinematic: ["cinematic", "photography", "views", "nature immersion", "romantic views", "summit views"],
  adventure: ["adventure", "classic hike", "summit culture"],
  spiritual: ["spiritual", "monastery", "monasteries", "mythology", "history"],
  remote: ["remote", "quiet", "low crowd", "slow travel"],
  authentic: ["authentic", "local food", "local stay", "village stay", "cultural"],
};

const MEMORY_LIMIT = 5;
const SIMILAR_SCORE_THRESHOLD = 10;
const lastRecommendedDestinations = [];
const DIRECT_MATCH_STOP_TERMS = new Set(["greece", "greek", "trail", "trails", "gorge", "river", "forest", "mountain"]);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .trim();
}

function normalizedList(values) {
  return (values || []).map(normalize).filter(Boolean);
}

function expandedTerms(values, groups) {
  const terms = new Set();

  normalizedList(values).forEach((value) => {
    terms.add(value);
    (groups[value] || []).forEach((alias) => terms.add(normalize(alias)));
  });

  return [...terms];
}

function preferredMaxDifficulty(profile) {
  if (profile.fitnessLevel === "beginner") return 1;
  if (profile.fitnessLevel === "advanced") return 3;
  return 2;
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 17);
}

function overlapRatio(requested, available) {
  if (!requested.length) return 0;
  const availableSet = new Set(available);
  const matches = requested.filter((item) => availableSet.has(item)).length;
  return matches / requested.length;
}

function hasAny(values, keys, groups = {}) {
  const expanded = expandedTerms(keys, groups);
  const valueSet = new Set(values);
  return expanded.some((term) => valueSet.has(term));
}

function monthNow(options = {}) {
  return options.currentMonth || new Date().getMonth() + 1;
}

function scoreSeasonality(trail, currentMonth) {
  const seasonality = trail.seasonality || {};
  if ((seasonality.idealMonths || trail.bestMonths || []).includes(currentMonth)) {
    return SCORE_WEIGHTS.seasonality;
  }

  if ((seasonality.cautionMonths || []).includes(currentMonth)) {
    return Math.round(SCORE_WEIGHTS.seasonality * 0.25);
  }

  if ((seasonality.avoidMonths || []).includes(currentMonth)) {
    return -18;
  }

  return 0;
}

function scoreDifficulty(trail, profile) {
  const trailDifficulty = DIFFICULTY_ORDER[trail.difficulty] || 2;
  const maxDifficulty = preferredMaxDifficulty(profile);

  if (trailDifficulty > maxDifficulty) {
    return -18 * (trailDifficulty - maxDifficulty);
  }

  if (profile.fitnessLevel === "advanced" && trailDifficulty === 1) {
    return Math.round(SCORE_WEIGHTS.difficulty * 0.45);
  }

  return SCORE_WEIGHTS.difficulty;
}

function scoreDuration(trail, profile) {
  if (!profile.availableHours) return Math.round(SCORE_WEIGHTS.duration * 0.6);

  const difference = Math.abs(trail.durationHours - profile.availableHours);
  return Math.max(0, SCORE_WEIGHTS.duration - Math.round(difference * 4));
}

function scoreCrowd(trail, profile) {
  const wantsQuiet = Boolean(profile.quietPreference) || hasAny(normalizedList(profile.moodTags), ["remote"], MOOD_GROUPS);
  if (!wantsQuiet) {
    return Math.round(SCORE_WEIGHTS.crowd * (1 - trail.crowdPressure / 140));
  }

  return Math.round(SCORE_WEIGHTS.crowd * (1 - trail.crowdPressure / 80));
}

function scoreHighAltitude(trail, profile) {
  if (profile.elevationPreference !== "high") return 0;

  const trailTerms = normalizedList([
    ...(trail.terrain || []),
    ...(trail.interests || []),
    ...(trail.mood || []),
    ...(trail.travelStyles || []),
    trail.seasonality?.note,
  ]);
  const highSignals = [
    "alpine",
    "mountain ridge",
    "summit",
    "summit culture",
    "high mountain peaks",
    "high altitudes",
    "peak",
    "ridge",
  ];
  const terrainBonus = highSignals.some((signal) => trailTerms.includes(normalize(signal))) ? 35 : 0;
  const elevationBonus = Math.min(30, Math.round((trail.elevationGainM || 0) / 35));
  const crowdPenalty = trail.crowdPressure > 55 ? 6 : 0;

  return terrainBonus + elevationBonus - crowdPenalty;
}

function negativeIntentPenalty(trailTerms, profileTerrain, profileMood) {
  let penalty = 0;
  const wantsSeaOrIsland = hasAny(profileTerrain, ["sea", "island"], TERRAIN_GROUPS);
  const trailHasSeaOrIsland = hasAny(trailTerms, ["sea", "island"], TERRAIN_GROUPS);
  const trailMountainHeavy = hasAny(trailTerms, ["mountain"], TERRAIN_GROUPS) && !trailHasSeaOrIsland;

  if (wantsSeaOrIsland && !trailHasSeaOrIsland) penalty += 38;
  if (wantsSeaOrIsland && trailMountainHeavy) penalty += 12;
  if (hasAny(profileTerrain, ["mountain"], TERRAIN_GROUPS) && trailHasSeaOrIsland && !hasAny(trailTerms, ["mountain"], TERRAIN_GROUPS)) penalty += 10;
  if (hasAny(profileTerrain, ["river"], TERRAIN_GROUPS) && !hasAny(trailTerms, ["river"], TERRAIN_GROUPS)) penalty += 14;
  if (hasAny(profileTerrain, ["forest"], TERRAIN_GROUPS) && !hasAny(trailTerms, ["forest"], TERRAIN_GROUPS)) penalty += 10;
  if ((hasAny(profileTerrain, ["village"], TERRAIN_GROUPS) || hasAny(profileMood, ["authentic"], MOOD_GROUPS)) && !hasAny(trailTerms, ["village"], TERRAIN_GROUPS)) penalty += 10;

  return penalty;
}

function memoryPenalty(trailId) {
  const index = lastRecommendedDestinations.indexOf(trailId);
  if (index === -1) return 0;
  return [18, 12, 8, 5, 3][index] || 3;
}

function destinationAliases(trail) {
  const aliases = [trail.name, trail.region, trail.id, ...(trail.aliases || [])];
  const id = normalize(trail.id);

  if (id.includes("zagori") || id.includes("vikos")) aliases.push("Zagori / Vikos Gorge", "Zagori", "Vikos");
  if (id.includes("prespa")) aliases.push("Prespes", "Prespa");
  if (id.includes("lousios") || id.includes("mainalo")) aliases.push("Menalon Trail", "Mainalo", "Lousios");
  if (id.includes("menalon")) aliases.push("Menalon Trail", "Mainalo", "Lousios", "Vytina", "Nymphasia");
  if (id.includes("taygetos")) aliases.push("Taygetos", "Taygetos Ravines", "Ravines of Taygetos", "Ταΰγετος");
  if (id.includes("crete") || id.includes("agia-irini")) aliases.push("Crete", "Kythera Trails", "Sifnos", "Poros Trails");
  if (id.includes("pelion")) aliases.push("Pertouli Trails", "Tzoumerka");
  if (id.includes("olympus")) aliases.push("Olympus", "Tzoumerka");
  if (id.includes("zagori") || id.includes("vikos")) aliases.push("Ζαγόρι", "Βίκος", "Φαράγγι Βίκου");
  if (id.includes("menalon") || id.includes("mainalo") || id.includes("lousios")) aliases.push("Μαίναλο", "Μαιναλο", "Λούσιος", "Λουσιος");
  if (id.includes("andros")) aliases.push("Άνδρος", "Ανδρος");
  if (id.includes("olympus")) aliases.push("Όλυμπος", "Ολυμπος");

  return aliases.map(normalize);
}

function uniqueNormalizedTerms(values) {
  return [...new Set(normalizedList(values))]
    .map((term) => term.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function directTrailAliases(trail) {
  return uniqueNormalizedTerms([
    trail.name,
    trail.region,
    trail.id,
    ...(trail.aliases || []),
    ...(trail.keywords || []),
    ...destinationAliases(trail),
  ]).filter((term) => {
    if (term.length < 4) return false;
    if (DIRECT_MATCH_STOP_TERMS.has(term)) return false;
    return true;
  });
}

function directMatchText(profile = {}) {
  return normalize([
    profile.rawMessage,
    profile.rawRequest,
    profile.message,
    profile.originalMessage,
  ].filter(Boolean).join(" "));
}

function directAliasMatchScore(input, alias) {
  if (!input || !alias) return 0;
  if (input.includes(alias)) return 100 + alias.length;

  const inputTokens = input
    .split(/[^a-z0-9α-ω]+/)
    .filter((token) => token.length >= 4 && !DIRECT_MATCH_STOP_TERMS.has(token));
  const aliasTokens = alias
    .split(/[^a-z0-9α-ω]+/)
    .filter((token) => token.length >= 4 && !DIRECT_MATCH_STOP_TERMS.has(token));
  const inputTokenSet = new Set(inputTokens);

  if (inputTokens.some((token) => alias === token)) return 90 + alias.length;
  if (inputTokens.some((token) => alias.includes(token))) return 70 + alias.length;
  if (aliasTokens.some((token) => inputTokenSet.has(token))) return 55 + alias.length;

  return 0;
}

function findDirectTrailMatch(profile, trails) {
  const input = directMatchText(profile);
  if (!input) return null;

  return trails.reduce((best, trail) => {
    const aliases = directTrailAliases(trail);
    const score = aliases.reduce((max, alias) => Math.max(max, directAliasMatchScore(input, alias)), 0);
    if (!score || (best && best.score >= score)) return best;
    return { trail, score };
  }, null)?.trail || null;
}

function scoreUserBehavior(trail, userBehaviorInsights) {
  if (!userBehaviorInsights || userBehaviorInsights.matchingUserCount === 0) return 0;

  const aliases = destinationAliases(trail);
  const lists = [
    userBehaviorInsights.popularDestinationsForSimilarUsers || [],
    userBehaviorInsights.popularDestinationsByFitness || [],
    userBehaviorInsights.popularDestinationsByTerrain || [],
  ];
  const allDestinations = lists.flat();
  if (!allDestinations.length) return 0;

  const topCount = Math.max(...allDestinations.map((item) => item.count || 0), 1);
  const bestMatch = allDestinations.reduce((best, item) => {
    const itemName = normalize(item.name);
    const matches = aliases.some((alias) => itemName.includes(alias) || alias.includes(itemName));
    if (!matches) return best;
    return Math.max(best, item.count || 0);
  }, 0);

  const confidenceMultiplier = userBehaviorInsights.confidence === "high" ? 1 : userBehaviorInsights.confidence === "medium" ? 0.75 : 0.45;
  return Math.round(SCORE_WEIGHTS.userBehavior * (bestMatch / topCount) * confidenceMultiplier);
}

function makeExplanation(trail, breakdown, profile) {
  const reasons = [];
  const terrain = expandedTerms(profile.preferredTerrain, TERRAIN_GROUPS);
  const mood = expandedTerms(profile.moodTags, MOOD_GROUPS);
  const trailTerms = normalizedList([
    ...(trail.terrain || []),
    ...(trail.interests || []),
    ...(trail.mood || []),
    ...(trail.travelStyles || []),
  ]);

  if (overlapRatio(terrain, trailTerms) > 0) reasons.push("matches the requested terrain");
  if (overlapRatio(mood, trailTerms) > 0) reasons.push("fits the travel mood");
  if (profile.quietPreference && trail.crowdPressure < 35) reasons.push("keeps crowd pressure low");
  if (profile.availableHours && Math.abs(trail.durationHours - profile.availableHours) <= 1) reasons.push("fits the available time");
  if (breakdown.seasonality > 0) reasons.push("is seasonally appropriate right now");
  if (breakdown.highAltitude > 0) reasons.push("matches the high-altitude preference");
  if (breakdown.userBehavior > 0) reasons.push("is supported by similar traveler behavior");
  if (trail.sustainabilityScore >= 88) reasons.push("has a strong sustainability score");

  if (!reasons.length) reasons.push("has the best balanced score for the current profile");

  return `${trail.name} was selected because it ${reasons.slice(0, 3).join(", ")}.`;
}

function scoreTrail(trail, profile, options = {}) {
  const currentMonth = monthNow(options);
  const trailTerms = normalizedList([
    ...(trail.terrain || []),
    ...(trail.interests || []),
    ...(trail.mood || []),
    ...(trail.travelStyles || []),
  ]);
  const requestedTerrain = expandedTerms(profile.preferredTerrain, TERRAIN_GROUPS);
  const requestedMood = expandedTerms(profile.moodTags, MOOD_GROUPS);
  const requestedInterests = normalizedList(profile.interests);
  const requestedTravelStyle = expandedTerms(
    [profile.travelStyle, ...(profile.quietPreference ? ["low crowd"] : [])],
    MOOD_GROUPS
  );

  const breakdown = {
    terrain: Math.round(SCORE_WEIGHTS.terrain * overlapRatio(requestedTerrain, trailTerms)),
    mood: Math.round(SCORE_WEIGHTS.mood * overlapRatio(requestedMood, trailTerms)),
    crowd: scoreCrowd(trail, profile),
    duration: scoreDuration(trail, profile),
    difficulty: scoreDifficulty(trail, profile),
    travelStyle: Math.round(SCORE_WEIGHTS.travelStyle * overlapRatio(requestedTravelStyle, trailTerms)),
    seasonality: scoreSeasonality(trail, currentMonth),
    interests: Math.round(SCORE_WEIGHTS.interests * overlapRatio(requestedInterests, trailTerms)),
    sustainability: Math.round((trail.sustainabilityScore / 100) * SCORE_WEIGHTS.sustainability),
    localImpact: Math.round((trail.localCommunityBenefit / 100) * SCORE_WEIGHTS.localImpact),
    highAltitude: scoreHighAltitude(trail, profile),
    userBehavior: scoreUserBehavior(trail, options.userBehaviorInsights),
    negativeIntentPenalty: negativeIntentPenalty(trailTerms, requestedTerrain, requestedMood),
    memoryPenalty: memoryPenalty(trail.id),
  };

  const positiveScore = Object.entries(breakdown)
    .filter(([key]) => !key.endsWith("Penalty"))
    .reduce((sum, [, value]) => sum + value, 0);
  const penaltyScore = breakdown.negativeIntentPenalty + breakdown.memoryPenalty;

  return {
    matchScore: Math.max(0, Math.round(positiveScore - penaltyScore)),
    breakdown,
  };
}

function rememberRecommendation(trailId) {
  const existingIndex = lastRecommendedDestinations.indexOf(trailId);
  if (existingIndex !== -1) lastRecommendedDestinations.splice(existingIndex, 1);
  lastRecommendedDestinations.unshift(trailId);
  lastRecommendedDestinations.splice(MEMORY_LIMIT);
}

function selectPrimary(ranked, profile) {
  const bestScore = ranked[0]?.matchScore || 0;
  let closeCandidates = ranked
    .filter((trail) => bestScore - trail.matchScore <= SIMILAR_SCORE_THRESHOLD)
    .slice(0, 3);

  const requestedTerrain = expandedTerms(profile.preferredTerrain, TERRAIN_GROUPS);
  const requiredTerrainGroups = ["sea", "island", "river", "forest", "village"].filter((group) => {
    return hasAny(requestedTerrain, [group], TERRAIN_GROUPS);
  });

  requiredTerrainGroups.forEach((group) => {
    const filtered = closeCandidates.filter((trail) => {
      const trailTerms = normalizedList([
        ...(trail.terrain || []),
        ...(trail.interests || []),
        ...(trail.mood || []),
        ...(trail.travelStyles || []),
      ]);
      return hasAny(trailTerms, [group], TERRAIN_GROUPS);
    });

    if (filtered.length) closeCandidates = filtered;
  });

  if (closeCandidates.length <= 1) return closeCandidates[0] || ranked[0];

  const seed = `${profile.rawRequest || ""}|${lastRecommendedDestinations.join("|")}`;
  return closeCandidates[hashString(seed) % closeCandidates.length];
}

function buildTopCandidate(trail) {
  return {
    id: trail.id,
    name: trail.name,
    region: trail.region,
    imageUrl: trail.imageUrl,
    matchScore: Math.min(100, trail.matchScore),
    difficulty: trail.difficulty,
    durationHours: trail.durationHours,
    crowdPressure: trail.crowdPressure,
    terrain: trail.terrain,
    seasonality: trail.seasonality,
    scoreBreakdown: trail.scoreBreakdown,
    reason: trail.recommendationExplanation,
  };
}

function rankTrails(profile, trails, options = {}) {
  return trails
    .map((trail) => {
      const scored = scoreTrail(trail, profile, options);
      const candidate = {
        ...trail,
        matchScore: scored.matchScore,
        scoreBreakdown: scored.breakdown,
      };
      candidate.recommendationExplanation = makeExplanation(candidate, scored.breakdown, profile);
      return candidate;
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.crowdPressure - b.crowdPressure;
    });
}

function buildAlternatives(ranked, primaryId) {
  return ranked
    .filter((trail) => trail.id !== primaryId)
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

function matchTrails(profile, trails, options = {}) {
  const matchedTrail = findDirectTrailMatch(profile, trails);

  const ranked = rankTrails(profile, trails, options);

  if (matchedTrail) {
    const scored = scoreTrail(matchedTrail, profile, options);
    const primary = {
      ...matchedTrail,
      matchScore: 95,
      scoreBreakdown: {
        ...scored.breakdown,
        directTrailMatch: 95,
      },
      recommendationExplanation: "The user explicitly asked about this trail.",
    };

    rememberRecommendation(primary.id);

    const topCandidates = [
      buildTopCandidate(primary),
      ...ranked
        .filter((trail) => trail.id !== primary.id)
        .slice(0, 4)
        .map(buildTopCandidate),
    ];

    return {
      primary,
      alternatives: buildAlternatives(ranked, primary.id),
      topCandidates,
    };
  }

  const primary = selectPrimary(ranked, profile);
  rememberRecommendation(primary.id);

  return {
    primary,
    alternatives: buildAlternatives(ranked, primary.id),
    topCandidates: ranked.slice(0, 5).map(buildTopCandidate),
  };
}

module.exports = {
  matchTrails,
  findDirectTrailMatch,
  _lastRecommendedDestinations: lastRecommendedDestinations,
};
