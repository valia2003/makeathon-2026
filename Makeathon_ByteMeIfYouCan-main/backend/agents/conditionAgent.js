const { getWeatherContext } = require("../tools/weatherTool.js");

function buildTrailSafetyChecks(trail, weather) {
  const checks = [];

  if (trail.terrain.includes("gorge")) {
    checks.push("Avoid entering gorge sections after heavy rain or storm forecasts.");
  }

  if (trail.terrain.includes("river")) {
    checks.push("Expect slippery stones near water and avoid crossing streams after rainfall.");
  }

  if (trail.difficulty === "Hard") {
    checks.push("Carry offline maps, headlamp, first-aid kit, and turn back if pace drops early.");
  }

  if (weather.current?.risk === "unsafe") {
    checks.push("Current weather looks unsafe; postpone or choose a sheltered village walk.");
  } else if (weather.current?.risk === "caution" || weather.seasonal.level === "caution") {
    checks.push("Treat conditions with caution and shorten the plan if heat, wind, or storms increase.");
  }

  return checks;
}

async function assessConditions(trail) {
  const weather = await getWeatherContext(trail);
  const safetyChecks = buildTrailSafetyChecks(trail, weather);

  return {
    weather,
    safetyLevel: safetyChecks.some((item) => item.includes("unsafe")) ? "unsafe" : "suitable-with-checks",
    safetyChecks,
    recentConditionSignals: [
      {
        source: "live-data-placeholder",
        credibility: "medium",
        summary:
          "Real-time forum/news trail-condition search is ready as an agent slot; connect a web search API for live closure reports.",
      },
    ],
  };
}

module.exports = { assessConditions };
