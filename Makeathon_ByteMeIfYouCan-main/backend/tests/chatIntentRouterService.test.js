const assert = require("node:assert/strict");

const { buildTravelerProfile } = require("../agents/travelerProfileAgent.js");
const { findDirectTrailMatch } = require("../agents/trailMatcherAgent.js");
const { trails } = require("../data/trails.js");
const { classifyChatIntent } = require("../Services/chatIntentRouterService.js");

function directMatch(message) {
  return findDirectTrailMatch(buildTravelerProfile(message), trails);
}

function route(message, options = {}) {
  return classifyChatIntent({
    message,
    matchedTrail: options.matchedTrail === undefined ? directMatch(message) : options.matchedTrail,
    hasMemory: Boolean(options.hasMemory),
  });
}

const cases = [
  ["what can you do?", "onboarding_help"],
  ["i would like to go somewhere very high with my fiance", "recommendation_request"],
  ["quiet river and mountain trail, moderate difficulty, 5 hours", "recommendation_request"],
  ["Tell me about Taygetos Ravines", "direct_trail_info"],
  ["Tell me about Menalon Trail", "direct_trail_info"],
  ["What is Zagori like?", "direct_trail_info"],
  ["Is Menalon safe today?", "condition_check"],
  ["What is the weather in Zagori?", "condition_check"],
  ["what else is nearby?", "nearby_exploration"],
  ["why?", "explain_current_recommendation"],
  ["what is quantum physics?", "unsupported_off_topic"],
  ["where can I buy a laptop?", "unsupported_off_topic"],
  ["football match in Greece", "unsupported_off_topic"],
  ["I want a trail today", "recommendation_request"],
  ["high mountain trail today", "recommendation_request"],
  ["\u03b8\u03b5\u03bb\u03c9 \u03b7\u03c3\u03c5\u03c7\u03bf \u03bc\u03bf\u03bd\u03bf\u03c0\u03b1\u03c4\u03b9 \u03c3\u03b5 \u03b2\u03bf\u03c5\u03bd\u03bf \u03b3\u03b9\u03b1 4 \u03c9\u03c1\u03b5\u03c2", "recommendation_request"],
  ["\u03c4\u03b9 \u03ba\u03b1\u03b9\u03c1\u03bf \u03b5\u03c7\u03b5\u03b9 \u03c3\u03c4\u03bf \u0396\u03b1\u03b3\u03bf\u03c1\u03b9;", "condition_check"],
  ["\u03b3\u03b9\u03b1\u03c4\u03b9;", "explain_current_recommendation"],
];

for (const [message, expectedIntent] of cases) {
  assert.equal(route(message).intent, expectedIntent, message);
}

assert.equal(
  route("what is quantum physics?", { hasMemory: true, matchedTrail: null }).intent,
  "unsupported_off_topic",
  "conversation memory must not make unrelated general questions in-domain"
);

assert.equal(
  route("what about today?", { hasMemory: true, matchedTrail: null }).intent,
  "condition_check",
  "memory should support weather/safety follow-ups"
);

console.log(`chat intent regression tests passed (${cases.length + 2})`);
