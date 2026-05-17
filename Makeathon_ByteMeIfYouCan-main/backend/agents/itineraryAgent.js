function formatHours(hours) {
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

function buildItinerary(trail, profile, conditions) {
  const startTime = conditions.weather.current?.temperatureC > 28 ? "07:00" : "08:30";
  const totalHours = profile.availableHours
    ? Math.min(profile.availableHours, trail.durationHours)
    : trail.durationHours;

  return {
    title: `${trail.name} conscious trail plan`,
    recommendedStart: startTime,
    totalDuration: formatHours(totalHours),
    distanceKm: trail.distanceKm,
    elevationGainM: trail.elevationGainM,
    routeType: "point-to-point / flexible return depending on group energy",
    stops: [
      {
        time: startTime,
        label: "Trailhead check-in",
        detail: "Confirm weather, water, offline map, and group pace before entering the route.",
      },
      {
        time: "+45m",
        label: trail.highlights[0],
        detail: "Slow down, observe terrain, and keep the group together.",
      },
      {
        time: "+2h",
        label: trail.highlights[1],
        detail: "Main scenic pause. Keep distance from wildlife and avoid off-trail photo spots.",
      },
      {
        time: `+${Math.max(3, Math.round(totalHours - 1))}h`,
        label: "Local community stop",
        detail: "Finish with a village cafe, local food, or small guesthouse instead of rushing onward.",
      },
    ],
    packing: [
      "1.5-2L water per person",
      "grippy hiking shoes",
      "offline map",
      "sun/rain layer depending on forecast",
      "small trash bag",
    ],
  };
}

module.exports = { buildItinerary };
