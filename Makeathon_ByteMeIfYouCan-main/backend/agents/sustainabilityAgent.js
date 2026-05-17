function assessSustainability(trail, alternatives) {
  const overcrowded = trail.crowdPressure >= 60;
  const bestAlternative = alternatives.find((item) => item.crowdPressure < trail.crowdPressure);

  return {
    sustainabilityScore: trail.sustainabilityScore,
    crowdPressure: trail.crowdPressure,
    localCommunityBenefit: trail.localCommunityBenefit,
    finalScore: Math.round(
      trail.sustainabilityScore * 0.45 +
        (100 - trail.crowdPressure) * 0.25 +
        trail.localCommunityBenefit * 0.3
    ),
    crowdFlag: overcrowded ? "High crowd pressure" : "Low to moderate crowd pressure",
    recommendation: overcrowded
      ? `Prefer ${bestAlternative?.name || "a lower-pressure nearby trail"} for a calmer, lower-impact trip.`
      : "This route fits a low-impact, lower-crowd travel pattern.",
    lowImpactBehaviors: trail.lowImpactTips,
  };
}

module.exports = { assessSustainability };
