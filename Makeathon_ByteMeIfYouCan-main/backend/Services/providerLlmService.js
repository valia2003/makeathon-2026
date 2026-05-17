const { generateGroqResponse, hasGroqKey, model: groqModel } = require("../providers/groqProvider.js");
const {
  generateGeminiResponse,
  hasGeminiKey,
  model: geminiModel,
} = require("../providers/geminiProvider.js");
const { generateFallbackNarration } = require("../providers/fallbackProvider.js");
const logger = require("../utils/logger.js");

function safeFailure(error) {
  return {
    status: error?.status,
    message: "provider failed",
  };
}

function parseJsonContent(content) {
  try {
    return JSON.parse(String(content || "").replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

function buildResult(providerResult, fallbackUsed, extra = {}) {
  return {
    provider: providerResult.provider,
    model: providerResult.model,
    content: providerResult.content,
    fallbackUsed,
    latencyMs: providerResult.latencyMs,
    ...extra,
  };
}

async function generateAIResponse(payload) {
  const { messages = [], context, options = {} } = payload;
  const started = Date.now();

  try {
    const groq = await generateGroqResponse(messages, options);
    logger.info("provider_success", {
      provider: "groq",
      model: groq.model,
      latencyMs: groq.latencyMs,
    });
    return buildResult(groq, false);
  } catch (error) {
    logger.warn("provider_failure", {
      provider: "groq",
      ...safeFailure(error),
    });
  }

  try {
    const gemini = await generateGeminiResponse(messages, options);
    logger.info("provider_success", {
      provider: "gemini",
      model: gemini.model,
      latencyMs: gemini.latencyMs,
    });
    return buildResult(gemini, false);
  } catch (error) {
    logger.warn("provider_failure", {
      provider: "gemini",
      ...safeFailure(error),
    });
  }

  const fallback = await generateFallbackNarration(context);
  logger.warn("provider_fallback_used", {
    provider: "fallback",
    latencyMs: fallback.latencyMs,
  });

  return {
    ...buildResult(fallback, true, {
      assistantMessage: fallback.assistantMessage,
      placeVoice: fallback.placeVoice,
      sustainabilityNarrative: fallback.sustainabilityNarrative,
      nextQuestions: fallback.nextQuestions,
    }),
    latencyMs: Date.now() - started,
  };
}

function getProviderStatus() {
  return {
    activeProviders: ["groq", "gemini", "fallback"],
    availability: {
      groq: hasGroqKey(),
      gemini: hasGeminiKey(),
      fallback: true,
    },
    loadedApiKeys: {
      GROQ_API_KEY: hasGroqKey(),
      GEMINI_API_KEY: hasGeminiKey(),
      OPENWEATHER_API_KEY: Boolean(process.env.OPENWEATHER_API_KEY),
      OPENROUTESERVICE_API_KEY: Boolean(process.env.OPENROUTESERVICE_API_KEY),
    },
    models: {
      groq: groqModel,
      gemini: geminiModel,
      fallback: "local-cinematic-template",
    },
    fallbackOrder: ["groq", "gemini", "fallback"],
  };
}

module.exports = {
  generateAIResponse,
  getProviderStatus,
  parseJsonContent,
};
