const { trails } = require("../data/trails.js");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const SEARCH_RADIUS_M = 18000;

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectNearbyIntent(message) {
  const text = normalize(message);
  const greekPhrases = [
    "τι αλλο υπαρχει κοντα",
    "τι αλλο εχει εκει κοντα",
    "υπαρχει κατι κοντα",
    "αλλο μονοπατι κοντα",
    "κοντινα μονοπατια",
    "κοντα",
  ];

  if (greekPhrases.some((phrase) => text.includes(normalize(phrase)))) return true;

  return [
    "what else is nearby",
    "what else is in the area",
    "what else is around there",
    "anything nearby",
    "nearby trails",
    "nearby places",
    "other trails nearby",
    "other options nearby",
    "τι αλλο υπαρχει στην περιοχη",
    "τι αλλο εχει εκει κοντα",
    "υπαρχει κατι κοντα",
    "αλλο μονοπατι κοντα",
    "τι αλλο μπορω να δω εκει",
    "κοντινα μονοπατια",
    "κοντα",
  ].some((phrase) => text.includes(normalize(phrase)));
}

function distanceKm(a, b) {
  if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return Infinity;
  const earthKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function elementCoordinates(element) {
  return {
    lat: element.lat || element.center?.lat,
    lon: element.lon || element.center?.lon,
  };
}

function elementName(element, fallback) {
  return element.tags?.name || element.tags?.["name:en"] || element.tags?.["name:el"] || fallback;
}

function classifyElement(element) {
  const tags = element.tags || {};
  if (tags.route === "hiking" || tags.sac_scale || tags.highway === "path" || tags.highway === "footway") return "trail";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.place === "village") return "village";
  if (tags.waterway === "river") return "river";
  if (tags.natural === "water" || tags.natural === "lake") return "lake";
  if (tags.amenity === "shelter" || tags.tourism === "alpine_hut" || tags.tourism === "wilderness_hut") return "shelter";
  if (tags.natural) return "nature";
  return "poi";
}

function imageQueryForNearbyItem(name, type, baseDestination) {
  const imagesByType = {
    trail: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=75",
    viewpoint: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75",
    village: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=75",
    river: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=75",
    lake: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=75",
    shelter: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=75",
    nature: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=75",
  };

  return imagesByType[type] || imagesByType.nature;
}

function overpassQuery({ lat, lon }, radius = SEARCH_RADIUS_M) {
  return `
[out:json][timeout:14];
(
  relation(around:${radius},${lat},${lon})["route"="hiking"];
  way(around:${radius},${lat},${lon})["highway"~"path|footway|track"]["sac_scale"];
  node(around:${radius},${lat},${lon})["tourism"="viewpoint"];
  way(around:${radius},${lat},${lon})["tourism"="viewpoint"];
  node(around:${radius},${lat},${lon})["place"="village"];
  node(around:${radius},${lat},${lon})["waterway"="river"];
  way(around:${radius},${lat},${lon})["waterway"="river"];
  node(around:${radius},${lat},${lon})["natural"~"water|lake|spring|peak|wood"];
  way(around:${radius},${lat},${lon})["natural"~"water|lake|wood"];
  node(around:${radius},${lat},${lon})["amenity"="shelter"];
  node(around:${radius},${lat},${lon})["tourism"~"alpine_hut|wilderness_hut"];
);
out center tags 60;
`;
}

async function fetchOverpassNearby(baseDestination) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: overpassQuery(baseDestination.coordinates) }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Overpass failed with status ${response.status}`);
    }

    return data.elements || [];
  } finally {
    clearTimeout(timeout);
  }
}

function parseNearbyElements(elements, baseDestination) {
  const seen = new Set();
  const trailsList = [];
  const pois = [];

  elements.forEach((element) => {
    const coordinates = elementCoordinates(element);
    const type = classifyElement(element);
    const name = elementName(element, type === "trail" ? "Nearby hiking route" : "Nearby natural point");
    const key = `${type}:${normalize(name)}:${Math.round((coordinates.lat || 0) * 1000)}:${Math.round((coordinates.lon || 0) * 1000)}`;
    if (seen.has(key) || !coordinates.lat || !coordinates.lon) return;
    seen.add(key);

    const item = {
      id: `${element.type}-${element.id}`,
      name,
      type,
      distanceKm: Math.round(distanceKm(baseDestination.coordinates, coordinates) * 10) / 10,
      coordinates,
      imageUrl: imageQueryForNearbyItem(name, type, baseDestination),
      source: "openstreetmap-overpass",
    };

    if (type === "trail") trailsList.push(item);
    else pois.push(item);
  });

  return {
    nearbyTrails: trailsList.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6),
    nearbyPOIs: pois.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10),
  };
}

function fallbackNearby(baseDestination) {
  const nearbyTrails = trails
    .filter((trail) => trail.id !== baseDestination.id)
    .map((trail) => ({
      id: trail.id,
      name: trail.name,
      type: "trail",
      region: trail.region,
      imageUrl: trail.imageUrl,
      distanceKm: Math.round(distanceKm(baseDestination.coordinates, trail.coordinates) * 10) / 10,
      difficulty: trail.difficulty,
      durationHours: trail.durationHours,
      source: "curated-static-fallback",
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);

  return {
    nearbyTrails,
    nearbyPOIs: [],
    openData: {
      source: "curated-static-fallback",
      radiusMeters: SEARCH_RADIUS_M,
      warning: "OpenStreetMap nearby search was unavailable; showing curated nearby trail alternatives.",
    },
  };
}

async function getNearbyOpenData(baseDestination) {
  if (!baseDestination?.coordinates?.lat || !baseDestination?.coordinates?.lon) {
    return fallbackNearby(baseDestination || {});
  }

  try {
    const elements = await fetchOverpassNearby(baseDestination);
    const parsed = parseNearbyElements(elements, baseDestination);
    return {
      ...parsed,
      openData: {
        source: "openstreetmap-overpass",
        radiusMeters: SEARCH_RADIUS_M,
        elementCount: elements.length,
      },
    };
  } catch (error) {
    return fallbackNearby(baseDestination);
  }
}

module.exports = {
  detectNearbyIntent,
  getNearbyOpenData,
};
