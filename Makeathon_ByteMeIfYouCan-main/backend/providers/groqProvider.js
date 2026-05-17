const Groq = require("groq-sdk");
const { retry } = require("../utils/retry.js");
const logger = require("../utils/logger.js");

const model = "llama-3.3-70b-versatile";

function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY) && process.env.DISABLE_GROQ_PROVIDER !== "true";
}

function normalizeMessages(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
    content: String(message.content || ""),
  }));
}

async function generateGroqResponse(messages, options = {}) {
  if (!hasGroqKey()) {
    const error = new Error("Groq API key is not configured");
    error.status = 401;
    throw error;
  }

  const started = Date.now();
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await retry(
    async () =>
      client.chat.completions.create({
        model: options.model || model,
        messages: normalizeMessages(messages),
        temperature: options.temperature ?? 0.75,
        max_tokens: options.maxTokens || 700,
      }),
    {
      retries: options.retries ?? 2,
      timeoutMs: options.timeoutMs ?? 12000,
      label: "groq",
      onRetry: ({ attempt, delayMs, error }) =>
        logger.warn("provider_retry", {
          provider: "groq",
          attempt,
          delayMs,
          reason: error?.status || error?.message,
        }),
    }
  );

  const content = completion?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return {
    provider: "groq",
    model: options.model || model,
    content,
    latencyMs: Date.now() - started,
    success: true,
  };
}

module.exports = { generateGroqResponse, hasGroqKey, model };
