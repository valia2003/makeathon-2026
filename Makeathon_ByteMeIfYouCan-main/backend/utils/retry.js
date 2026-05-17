function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(operation, timeoutMs, label = "operation") {
  if (!timeoutMs) return operation();

  return Promise.race([
    operation(),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

function isRetryable(error) {
  const status = error?.status || error?.response?.status;
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  return /timeout|timed out|rate|network|fetch failed|ECONNRESET|ETIMEDOUT/i.test(
    error?.message || ""
  );
}

async function retry(operation, options = {}) {
  const {
    retries = 2,
    baseDelayMs = 300,
    maxDelayMs = 2500,
    timeoutMs = 12000,
    label = "operation",
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(operation, timeoutMs, label);
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < retries && isRetryable(error);

      if (!shouldRetry) break;

      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      onRetry?.({ attempt: attempt + 1, delayMs: delay, error });
      await sleep(delay);
    }
  }

  throw lastError;
}

module.exports = { retry, withTimeout, isRetryable };
