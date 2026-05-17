const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { generateAIResponse } = require("./Services/llmService.js");
const { getProviderStatus } = require("./Services/providerLlmService.js");
const { trails } = require("./data/trails.js");
const {
  checkTrailConditions,
  photoToTrail,
  adaptItinerary,
} = require("./Services/advancedAIService.js");
const {
  getOverallUserBehaviorAnalytics,
  getImpactMetricsFromBehavior,
} = require("./Services/userBehaviorService.js");

const app = express();

app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Pathfinder AI backend",
  });
});

app.get("/api/trails", (req, res) => {
  res.json({
    trails: trails.map((trail) => ({
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
      terrain: trail.terrain,
      mood: trail.mood,
      travelStyles: trail.travelStyles,
      seasonality: trail.seasonality,
    })),
  });
});

app.get("/api/debug/providers", (req, res) => {
  res.json(getProviderStatus());
});

app.get("/api/debug/health", (req, res) => {
  const providerStatus = getProviderStatus();
  res.json({
    status: "ok",
    providers: providerStatus.availability,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

app.get("/api/user-behavior-insights", (req, res) => {
  res.json(getOverallUserBehaviorAnalytics());
});

app.get("/api/impact-metrics", (req, res) => {
  res.json(getImpactMetricsFromBehavior());
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const aiResponse = await generateAIResponse(message, { conversationId });

    res.json({
      mode: aiResponse.mode,
      message: aiResponse.content || aiResponse.message,
      content: aiResponse.content || aiResponse.message,
      orchestration: aiResponse.orchestration,
      aiSource: aiResponse.source,
      warning: aiResponse.warning,
      travelerProfile: aiResponse.travelerProfile,
      userBehaviorInsights: aiResponse.userBehaviorInsights,
      recommendedDestination: aiResponse.recommendedDestination,
      selectedTrail: aiResponse.selectedTrail,
      alternatives: aiResponse.alternatives,
      topCandidates: aiResponse.topCandidates,
      scores: aiResponse.scores,
      conditions: aiResponse.conditions,
      weather: aiResponse.weather,
      biodiversity: aiResponse.biodiversity,
      openData: aiResponse.openData,
      itinerary: aiResponse.itinerary,
      ai: aiResponse.ai,
      pipeline: aiResponse.pipeline,
      agents: aiResponse.agents,
      placeVoice: aiResponse.placeVoice,
      nextQuestions: aiResponse.nextQuestions,
      baseDestination: aiResponse.baseDestination,
      nearbyTrails: aiResponse.nearbyTrails,
      nearbyPOIs: aiResponse.nearbyPOIs,
    });
  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      error: "AI response failed",
      details: "The AI pipeline failed safely. Please try again.",
    });
  }
});

app.post("/api/advanced/conditions", async (req, res) => {
  try {
    res.json(await checkTrailConditions(req.body || {}));
  } catch (error) {
    console.error("Condition agent error:", error);
    res.status(500).json({ error: "Condition agent failed", details: "Unable to check conditions safely." });
  }
});

app.post("/api/advanced/photo-match", async (req, res) => {
  try {
    const { imageData } = req.body || {};
    if (!imageData) {
      return res.status(400).json({ error: "imageData is required" });
    }

    res.json(await photoToTrail({ imageData }));
  } catch (error) {
    console.error("Photo-to-trail agent error:", error);
    res.status(500).json({ error: "Photo-to-trail agent failed", details: "Unable to match the image safely." });
  }
});

app.post("/api/advanced/adapt-itinerary", async (req, res) => {
  try {
    const { update } = req.body || {};
    if (!update) {
      return res.status(400).json({ error: "update is required" });
    }

    res.json(await adaptItinerary(req.body));
  } catch (error) {
    console.error("Itinerary adaptation agent error:", error);
    res.status(500).json({ error: "Itinerary adaptation agent failed", details: "Unable to adapt the itinerary safely." });
  }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Pathfinder backend running on http://localhost:${PORT}`);
});

const demoQuestions = [
  {
    label: "Quiet Mountain Escape",
    prompt:
      "I want a quiet mountain trail with rivers and low crowds",
  },

  {
    label: "Specific Trail Info",
    prompt:
      "Tell me about Menalon Trail",
  },

  {
    label: "Weather & Safety",
    prompt:
      "What is the weather in Zagori?",
  },

  {
    label: "Nearby Exploration",
    prompt:
      "What else is nearby?",
  },

  {
    label: "Easy Coastal Route",
    prompt:
      "I want an easier coastal trail with sea views",
  },

  {
    label: "Sustainable Alternative",
    prompt:
      "Show me a sustainable alternative to Santorini",
  },

  {
    label: "Forest & Villages",
    prompt:
      "I want a peaceful forest trail near traditional villages",
  },

  {
    label: "Adventure Experience",
    prompt:
      "I want a more adventurous hiking experience with elevation and dramatic landscapes",
  },

  {
    label: "Why This Trail?",
    prompt:
      "Why did you choose this trail?",
  },

  {
    label: "Off-topic Guardrail",
    prompt:
      "Tell me a joke",
  },
];