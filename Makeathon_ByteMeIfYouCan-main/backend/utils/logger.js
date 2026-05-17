function timestamp() {
  return new Date().toISOString();
}

function sanitizeMeta(meta = {}) {
  const blocked = /key|token|secret|authorization|stack|rawError/i;
  return Object.fromEntries(
    Object.entries(meta).filter(([key]) => !blocked.test(key))
  );
}

function log(level, event, meta = {}) {
  const payload = {
    ts: timestamp(),
    level,
    event,
    ...sanitizeMeta(meta),
  };

  console.log(`[pathfinder] ${JSON.stringify(payload)}`);
}

module.exports = {
  info: (event, meta) => log("info", event, meta),
  warn: (event, meta) => log("warn", event, meta),
  error: (event, meta) => log("error", event, meta),
};
