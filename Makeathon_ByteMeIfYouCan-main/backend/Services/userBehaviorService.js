const fs = require("fs");
const path = require("path");

const DATA_SOURCE = "mock-simulated-pathfinder-users";
const FILE_PATHS = [
  path.join(__dirname, "..", "data", "pathfinder_analytics_dataset.csv"),
  path.join(__dirname, "..", "data", "pathfinder_analytics_dataset.xlsx"),
];

let cachedRows = null;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function average(rows, field) {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, row) => sum + toNumber(row[field]), 0);
  return Math.round((total / rows.length) * 10) / 10;
}

function sum(rows, field) {
  return Math.round(rows.reduce((total, row) => total + toNumber(row[field]), 0));
}

function topCounts(rows, field, limit = 5) {
  const counts = {};
  rows.forEach((row) => {
    const value = row[field];
    if (!value) return;
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function parseCsv(text) {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift() || "");
  return lines.map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = coerceValue(values[index]);
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function coerceValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && Number.isFinite(Number(value))) return Number(value);
  return value || null;
}

function isTruthy(value) {
  return value === true || value === 1 || normalize(value) === "true" || normalize(value) === "yes";
}

function readExcel(filePath) {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch (error) {
    throw new Error(`Excel parser dependency is not installed for ${path.basename(filePath)}.`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
}

function readRows() {
  if (cachedRows) return cachedRows;

  try {
    const existingPath = FILE_PATHS.find((filePath) => fs.existsSync(filePath));
    if (!existingPath) {
      cachedRows = [];
      return cachedRows;
    }

    cachedRows = existingPath.endsWith(".csv")
      ? parseCsv(fs.readFileSync(existingPath, "utf8"))
      : readExcel(existingPath);
    return cachedRows;
  } catch (error) {
    console.warn(`[userBehaviorService] Falling back; analytics dataset could not be read: ${error.message}`);
    cachedRows = [];
    return cachedRows;
  }
}

function mapFitness(value) {
  const fitness = normalize(value);
  if (["high", "advanced", "hard"].includes(fitness)) return "advanced";
  if (["low", "beginner", "easy"].includes(fitness)) return "beginner";
  return "moderate";
}

function moodMatches(profileMood, rowMood) {
  const mood = normalize(rowMood);
  const profileMoods = (profileMood || []).map(normalize);
  if (!profileMoods.length) return false;
  if (profileMoods.includes(mood)) return true;
  if (profileMoods.includes("remote") && ["quiet", "peaceful", "remote"].includes(mood)) return true;
  if (profileMoods.includes("adventure") && ["adventurous", "wild"].includes(mood)) return true;
  return false;
}

function terrainMatches(profileTerrain, rowTerrain) {
  const terrain = normalize(rowTerrain);
  const profileTerrains = (profileTerrain || []).map(normalize);
  if (profileTerrains.includes(terrain)) return true;
  if (profileTerrains.includes("sea") && ["coast", "island"].includes(terrain)) return true;
  if (profileTerrains.includes("island") && ["coast", "sea"].includes(terrain)) return true;
  return false;
}

function rowMatchScore(row, profile = {}) {
  let score = 0;
  if (profile.ageGroup && normalize(row.ageGroup) === normalize(profile.ageGroup)) score += 2;
  if (mapFitness(row.fitnessLevel) === mapFitness(profile.fitnessLevel)) score += 2;
  if (terrainMatches(profile.preferredTerrain, row.preferredTerrain)) score += 3;
  if (moodMatches(profile.moodTags || profile.preferredMood, row.preferredMood)) score += 2;
  if (Boolean(profile.quietPreference) === Boolean(row.avoidCrowds)) score += 1;
  if (normalize(profile.travelStyle) && normalize(row.travelStyle).includes(normalize(profile.travelStyle))) score += 1;
  return score;
}

function groupPopular(rows, filterField, filterValue, destinationField = "selectedDestination") {
  const target = normalize(filterValue);
  if (!target) return [];
  return topCounts(rows.filter((row) => normalize(row[filterField]) === target), destinationField);
}

function groupPopularWhere(rows, predicate, destinationField = "selectedDestination") {
  return topCounts(rows.filter(predicate), destinationField);
}

function fallbackInsights() {
  return {
    dataSource: DATA_SOURCE,
    matchingUserCount: 0,
    popularDestinationsForSimilarUsers: [],
    popularDestinationsByAgeGroup: [],
    popularDestinationsByFitness: [],
    popularDestinationsByTerrain: [],
    averageSustainabilityScore: 0,
    averageCrowdPressureAvoided: 0,
    averageLocalImpactEuro: 0,
    insightText: "No mock analytics rows are available right now, so this recommendation is based on trail fit, sustainability, and conditions.",
    confidence: "low",
  };
}

function getUserBehaviorInsights(profile = {}) {
  const rows = readRows();
  if (!rows.length) return fallbackInsights();

  const scoredRows = rows
    .map((row) => ({ row, score: rowMatchScore(row, profile) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score);
  const matchingRows = scoredRows.length ? scoredRows.map((item) => item.row) : rows.slice(0, 50);
  const popularForSimilar = topCounts(matchingRows, "selectedDestination");
  const terrain = (profile.preferredTerrain || [])[0];

  const insightText = popularForSimilar[0]
    ? `Similar travelers most often selected ${popularForSimilar[0].name}.`
    : "The mock analytics did not show a clear preference for this profile.";

  return {
    dataSource: DATA_SOURCE,
    matchingUserCount: scoredRows.length,
    popularDestinationsForSimilarUsers: popularForSimilar,
    popularDestinationsByAgeGroup: profile.ageGroup ? groupPopular(rows, "ageGroup", profile.ageGroup) : [],
    popularDestinationsByFitness: groupPopularWhere(rows, (row) => mapFitness(row.fitnessLevel) === mapFitness(profile.fitnessLevel)),
    popularDestinationsByTerrain: terrain ? groupPopularWhere(rows, (row) => terrainMatches([terrain], row.preferredTerrain)) : [],
    averageSustainabilityScore: average(matchingRows, "sustainabilityScore"),
    averageCrowdPressureAvoided: average(matchingRows, "crowdPressureAvoided"),
    averageLocalImpactEuro: average(matchingRows, "localImpactEuro"),
    insightText,
    confidence: scoredRows.length >= 35 ? "high" : scoredRows.length >= 12 ? "medium" : "low",
  };
}

function getOverallUserBehaviorAnalytics() {
  const rows = readRows();
  if (!rows.length) {
    return {
      dataSource: DATA_SOURCE,
      totalUsers: 0,
      topRecommendedDestinations: [],
      topSelectedDestinations: [],
      topAvoidedHotspots: [],
      averageSustainabilityScore: 0,
      averageCrowdPressureAvoided: 0,
      totalLocalImpactEuro: 0,
      completionRate: 0,
      recommendationRate: 0,
    };
  }

  const completed = rows.filter((row) => row.completedTrail);
  const wouldRecommend = rows.filter((row) => isTruthy(row.wouldRecommend));

  return {
    dataSource: DATA_SOURCE,
    totalUsers: rows.length,
    topRecommendedDestinations: topCounts(rows, "recommendedDestination"),
    topSelectedDestinations: topCounts(rows, "selectedDestination"),
    topAvoidedHotspots: topCounts(rows, "avoidedHotspot"),
    averageSustainabilityScore: average(rows, "sustainabilityScore"),
    averageCrowdPressureAvoided: average(rows, "crowdPressureAvoided"),
    totalLocalImpactEuro: sum(rows, "localImpactEuro"),
    completionRate: Math.round((completed.length / rows.length) * 1000) / 10,
    recommendationRate: Math.round((wouldRecommend.length / rows.length) * 1000) / 10,
  };
}

function getImpactMetricsFromBehavior() {
  const analytics = getOverallUserBehaviorAnalytics();
  const rows = readRows();
  return {
    dataSource: DATA_SOURCE,
    redirectedUsers: rows.filter((row) => row.avoidedHotspot && row.selectedDestination).length,
    crowdReductionPercent: analytics.averageCrowdPressureAvoided,
    totalLocalImpactEuro: analytics.totalLocalImpactEuro,
    averageSustainabilityScore: analytics.averageSustainabilityScore,
  };
}

module.exports = {
  getUserBehaviorInsights,
  getOverallUserBehaviorAnalytics,
  getImpactMetricsFromBehavior,
  _readRows: readRows,
};
