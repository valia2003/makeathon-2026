const { trails } = require("../data/trails.js");
const { assessConditions } = require("../agents/conditionAgent.js");
const { assessSustainability } = require("../agents/sustainabilityAgent.js");
const { buildItinerary } = require("../agents/itineraryAgent.js");
const { buildTravelerProfile } = require("../agents/travelerProfileAgent.js");
const { matchTrails } = require("../agents/trailMatcherAgent.js");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};

function hasGeminiApiKey() {
  return (
    geminiConfig.apiKey &&
    geminiConfig.apiKey !== "PASTE_YOUR_GOOGLE_AI_STUDIO_KEY_HERE"
  );
}

function findTrail(trailId) {
  return trails.find((trail) => trail.id === trailId) || trails[0];
}

function cleanDataUrl(imageData) {
  const match = String(imageData || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) return { mimeType: "image/jpeg", base64: imageData };
  return { mimeType: match[1], base64: match[2] };
}

function terrainPromptFromVision(vision) {
  const text = `${vision.terrain || ""} ${vision.mood || ""} ${vision.features || ""}`.toLowerCase();
  const terms = [];

  if (/river|water|stream|lake|wetland|coast|sea/.test(text)) terms.push("river");
  if (/mountain|gorge|cliff|ridge|alpine/.test(text)) terms.push("mountain");
  if (/forest|trees|green|shade/.test(text)) terms.push("forest");
  if (/quiet|remote|calm|solitude/.test(text)) terms.push("quiet");
  if (/village|stone|traditional/.test(text)) terms.push("village");

  return terms.length ? terms.join(" ") : "quiet mountain river trail";
}

async function analyzeImageWithGemini(imageData) {
  if (!hasGeminiApiKey()) {
    return {
      terrain: "mountain river forest",
      mood: "quiet cinematic natural landscape",
      features: "hidden trail, water, green terrain",
      source: "fallback",
    };
  }

  const image = cleanDataUrl(imageData);
  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(
    geminiConfig.model
  )}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiConfig.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Analyze this landscape for trail matching in Greece. Return only compact JSON with keys terrain, mood, features, suitableTrailType.",
            },
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini vision failed with status ${response.status}`);
  }

  const raw = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
  const jsonText = raw.replace(/```json|```/g, "").trim();

  try {
    return { ...JSON.parse(jsonText), source: "gemini-vision" };
  } catch {
    return {
      terrain: raw,
      mood: "visual match",
      features: raw,
      source: "gemini-vision",
    };
  }
}

async function checkTrailConditions({ trailId }) {
  const trail = findTrail(trailId);
  const conditions = await assessConditions(trail);

  return {
    trail: {
      id: trail.id,
      name: trail.name,
      region: trail.region,
      difficulty: trail.difficulty,
    },
    status: conditions.safetyLevel === "unsafe" ? "caution" : "go-with-checks",
    headline:
      conditions.safetyLevel === "unsafe"
        ? "Conditions need caution today."
        : "Trail looks suitable with standard checks.",
    conditions,
  };
}

async function photoToTrail({ imageData }) {
  const vision = await analyzeImageWithGemini(imageData);
  const profile = buildTravelerProfile(terrainPromptFromVision(vision));
  const { primary, alternatives } = matchTrails(profile, trails);
  const sustainability = assessSustainability(primary, alternatives);

  return {
    vision,
    match: {
      id: primary.id,
      name: primary.name,
      region: primary.region,
      difficulty: primary.difficulty,
      durationHours: primary.durationHours,
      distanceKm: primary.distanceKm,
      elevationGainM: primary.elevationGainM,
      matchScore: Math.min(100, primary.matchScore),
      why:
        "Matched by visual terrain, mood, water/mountain/forest signals, and lower crowd pressure.",
    },
    sustainability,
    alternatives,
  };
}

async function adaptItinerary({ trailId, update, currentPlan }) {
  const trail = findTrail(trailId || currentPlan?.recommendedDestination?.id);
  const profile = buildTravelerProfile(update || "");
  const conditions = await assessConditions(trail);
  const baseItinerary = buildItinerary(trail, profile, conditions);
  const updateText = String(update || "").toLowerCase();

  let adaptationReason = "Updated around your latest travel context.";
  let itinerary = { ...baseItinerary };

  if (/storm|rain|καταιγ|βροχ|weather|καιρ/.test(updateText)) {
    adaptationReason = "Weather risk detected, so the plan starts earlier and shortens exposed stops.";
    itinerary = {
      ...itinerary,
      recommendedStart: "07:00",
      totalDuration: "3.5h",
      stops: itinerary.stops.map((stop, index) =>
        index === 2
          ? { ...stop, detail: "Keep this as a short viewpoint stop and leave before weather builds." }
          : stop
      ),
    };
  }

  if (/tired|κουρασ|slow|αργ|kids|παιδ/.test(updateText)) {
    adaptationReason = "Lower energy detected, so the plan becomes shorter and easier.";
    itinerary = {
      ...itinerary,
      totalDuration: "2.5h",
      routeType: "short out-and-back with optional village stop",
      stops: itinerary.stops.slice(0, 3),
    };
  }

  if (/faster|γρήγορ|γρηγορ|early|νωρίς/.test(updateText)) {
    adaptationReason = "You are moving faster than expected, so Pathfinder adds one low-impact extension.";
    itinerary = {
      ...itinerary,
      stops: [
        ...itinerary.stops,
        {
          time: "+5h",
          label: "Optional quiet extension",
          detail: "Add a nearby viewpoint only if daylight and weather remain stable.",
        },
      ],
    };
  }

  return {
    trail: {
      id: trail.id,
      name: trail.name,
      region: trail.region,
    },
    adaptationReason,
    itinerary,
    safety: conditions.safetyChecks,
  };
}

module.exports = {
  checkTrailConditions,
  photoToTrail,
  adaptItinerary,
};
