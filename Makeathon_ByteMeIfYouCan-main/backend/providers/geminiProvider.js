const { retry } = require("../utils/retry.js");
const logger = require("../utils/logger.js");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function hasGeminiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  return (
    Boolean(key && key !== "") &&
    process.env.DISABLE_GEMINI_PROVIDER !== "true"
  );
}

function messagesToGeminiText(messages) {
  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text).filter(Boolean).join("").trim();
}

async function generateGeminiResponse(messages, options = {}) {
  if (!hasGeminiKey()) {
    const error = new Error("Gemini API key is not configured");
    error.status = 401;
    throw error;
  }

  const started = Date.now();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const selectedModel = options.model || model;
  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(
    selectedModel
  )}:generateContent`;

  const data = await retry(
    async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: messagesToGeminiText(messages) }],
            },
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.75,
            maxOutputTokens: options.maxTokens || 700,
          },
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body?.error?.message || `Gemini failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return body;
    },
    {
      retries: options.retries ?? 2,
      timeoutMs: options.timeoutMs ?? 12000,
      label: "gemini",
      onRetry: ({ attempt, delayMs, error }) =>
        logger.warn("provider_retry", {
          provider: "gemini",
          attempt,
          delayMs,
          reason: error?.status || error?.message,
        }),
    }
  );

  const content = extractGeminiText(data);
  if (!content) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    provider: "gemini",
    model: selectedModel,
    content,
    latencyMs: Date.now() - started,
    success: true,
  };
}

module.exports = { generateGeminiResponse, hasGeminiKey, model };
