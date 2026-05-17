const {
  generateAIResponse: generateProviderResponse,
  parseJsonContent,
} = require("../Services/providerLlmService.js");

function buildNarratorMessages(context) {
  return [
    {
      role: "system",
      content:
        "You are Pathfinder, a focused AI trail companion for sustainable hiking and outdoor travel in Greece. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Create the final traveler-facing narration from this JSON:
${JSON.stringify(context, null, 2)}

Return exactly this JSON shape:
{
  "assistantMessage": "Concise recommendation under 160 words",
  "placeVoice": "One cinematic first-person sentence as the selected trail/place",
  "sustainabilityNarrative": "Eco-conscious explanation under 70 words",
  "nextQuestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}

Rules:
- Use English unless context.language is "el". Use Greek only when context.language is "el".
- Keep chat concise and practical. Keep cinematic tone mostly in placeVoice.
- Do not invent facts outside the JSON.
- Mention difficulty, duration, elevation, weather/season risk and sustainability.
- If userBehaviorInsights.insightText is relevant, mention it once in one short sentence.
- Treat user behavior analytics as simulated supporting evidence, not as the reason to override safety, sustainability, weather or destination suitability.
- Do not mention provider names, quotas, raw API errors, or stack traces.`,
    },
  ];
}

function normalizeNarration(providerResult, context) {
  const parsed = parseJsonContent(providerResult.content);

  if (providerResult.provider === "fallback") {
    return {
      content: providerResult.assistantMessage,
      placeVoice: providerResult.placeVoice,
      sustainabilityNarrative: providerResult.sustainabilityNarrative,
      nextQuestions: providerResult.nextQuestions,
      source: providerResult.provider,
      model: providerResult.model,
      fallbackUsed: providerResult.fallbackUsed,
      latencyMs: providerResult.latencyMs,
      warning: undefined,
    };
  }

  if (!parsed?.assistantMessage || !parsed?.placeVoice) {
    const fallback = require("../providers/fallbackProvider.js");
    return fallback.generateFallbackNarration(context).then((fallbackResult) => ({
      content: fallbackResult.assistantMessage,
      placeVoice: fallbackResult.placeVoice,
      sustainabilityNarrative: fallbackResult.sustainabilityNarrative,
      nextQuestions: fallbackResult.nextQuestions,
      source: "fallback",
      model: fallbackResult.model,
      fallbackUsed: true,
      latencyMs: providerResult.latencyMs + fallbackResult.latencyMs,
      warning: undefined,
    }));
  }

  return {
    content: parsed.assistantMessage,
    placeVoice: parsed.placeVoice,
    sustainabilityNarrative: parsed.sustainabilityNarrative,
    nextQuestions: Array.isArray(parsed.nextQuestions) ? parsed.nextQuestions.slice(0, 3) : [],
    source: providerResult.provider,
    model: providerResult.model,
    fallbackUsed: providerResult.fallbackUsed,
    latencyMs: providerResult.latencyMs,
    warning: undefined,
  };
}

async function createNarrative(context) {
  const providerResult = await generateProviderResponse({
    messages: buildNarratorMessages(context),
    context,
    options: {
      temperature: 0.45,
      maxTokens: 650,
      timeoutMs: 12000,
      retries: 2,
    },
  });

  return normalizeNarration(providerResult, context);
}

module.exports = { createNarrative };
