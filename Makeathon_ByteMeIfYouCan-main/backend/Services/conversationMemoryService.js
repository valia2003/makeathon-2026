const MEMORY_TTL_MS = 1000 * 60 * 60 * 3;
const conversationMemory = {};

function getConversationId(value) {
  return String(value || "default").slice(0, 120);
}

function cleanupMemory() {
  const now = Date.now();
  Object.entries(conversationMemory).forEach(([conversationId, memory]) => {
    if (!memory?.timestamp || now - memory.timestamp > MEMORY_TTL_MS) {
      delete conversationMemory[conversationId];
    }
  });
}

function getConversationMemory(conversationId) {
  cleanupMemory();
  return conversationMemory[getConversationId(conversationId)] || null;
}

function rememberRecommendation(conversationId, payload) {
  cleanupMemory();
  conversationMemory[getConversationId(conversationId)] = {
    lastDestination: payload.lastDestination,
    lastOpenData: payload.lastOpenData,
    lastRecommendation: payload.lastRecommendation,
    timestamp: Date.now(),
  };
}

function rememberTrailContext(conversationId, payload) {
  cleanupMemory();
  const id = getConversationId(conversationId);
  const current = conversationMemory[id] || {};

  conversationMemory[id] = {
    ...current,
    lastDestination: payload.lastDestination || current.lastDestination,
    lastOpenData: payload.lastOpenData || current.lastOpenData,
    lastRecommendation: payload.lastRecommendation || current.lastRecommendation,
    timestamp: Date.now(),
  };
}

module.exports = {
  getConversationId,
  getConversationMemory,
  rememberRecommendation,
  rememberTrailContext,
  _conversationMemory: conversationMemory,
};
