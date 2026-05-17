import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Sun, Cloud, CloudDrizzle, Compass, Backpack, CalendarDays, Route } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const demoTrail = {
  id: "cape-tenaro-loop",
  name: "Cape Tenaro Loop",
  distanceKm: 5.5,
  elevationGainM: 198,
  difficulty: "Medium",
};

function normalizeDifficulty(difficulty) {
  const value = String(difficulty || "").toLowerCase();
  if (value.includes("hard") || value.includes("απαι")) return "hard";
  if (value.includes("easy") || value.includes("ευκ")) return "easy";
  return "medium";
}

function buildMockElevationProfile(trail) {
  const distanceKm = Number(trail.distanceKm) || demoTrail.distanceKm;
  const elevationGainM = Number(trail.elevationGainM) || demoTrail.elevationGainM;
  const difficulty = normalizeDifficulty(trail.difficulty);
  const roughness = difficulty === "hard" ? 0.24 : difficulty === "easy" ? 0.1 : 0.16;
  const pointCount = 12;

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const mainClimb = Math.sin(Math.PI * progress) * elevationGainM;
    const secondaryRoll = Math.sin(Math.PI * progress * 3) * elevationGainM * roughness;
    const endDrop = progress > 0.72 ? elevationGainM * (progress - 0.72) * 0.45 : 0;

    return {
      km: Math.round(distanceKm * progress * 10) / 10,
      m: Math.max(0, Math.round(12 + mainClimb + secondaryRoll - endDrop)),
    };
  });
}

function normalizeRouteElevationProfile(profile, trail) {
  if (!Array.isArray(profile) || profile.length === 0) return null;
  const distanceKm = Number(trail.distanceKm) || demoTrail.distanceKm;

  return profile.map((point, index) => {
    const fallbackProgress = profile.length === 1 ? 0 : index / (profile.length - 1);
    return {
      km: Number(point.km ?? point.distanceKm ?? point.distance ?? distanceKm * fallbackProgress),
      m: Number(point.m ?? point.elevationM ?? point.elevation ?? point.altitudeM ?? 0),
    };
  });
}

function elevationDataForTrail(trail) {
  const routeProfile = normalizeRouteElevationProfile(trail.route?.elevationProfile, trail);
  return routeProfile || buildMockElevationProfile(trail);
}

function iconForWeather(description = "", risk = "") {
  const text = `${description} ${risk}`.toLowerCase();
  if (/rain|drizzle|shower|storm|thunder|precipitation/.test(text)) return CloudDrizzle;
  if (/cloud|fog|mist|overcast/.test(text)) return Cloud;
  return Sun;
}

function headlineForWeather(weatherContext) {
  const current = weatherContext?.current;
  if (current?.description) return `Today · ${current.description}`;
  if (weatherContext?.seasonal?.summary) return `Today · ${weatherContext.seasonal.level || "Seasonal check"}`;
  return "Today · Seasonal check";
}

function buildWeatherTimeline(weatherContext, trail) {
  const current = weatherContext?.current;
  const baseTemp = Number.isFinite(current?.temperatureC)
    ? current.temperatureC
    : Math.max(10, Math.min(26, 18 - Math.round((Number(trail.elevationGainM) || 200) / 220)));
  const description = current?.description || weatherContext?.seasonal?.summary || "seasonal conditions";
  const risk = current?.risk || weatherContext?.seasonal?.level || "watch";
  const Icon = iconForWeather(description, risk);
  const rainy = Icon === CloudDrizzle;
  const cloudy = Icon === Cloud;
  const offsets = rainy ? [-1, 0, 1, 0, -1] : cloudy ? [-2, 0, 1, 0, -1] : [-3, 0, 4, 3, 0];
  const icons = rainy
    ? [Cloud, CloudDrizzle, CloudDrizzle, CloudDrizzle, Cloud]
    : cloudy
      ? [Cloud, Cloud, Icon, Cloud, Cloud]
      : [Cloud, Sun, Sun, Sun, Cloud];

  return ["06:00", "09:00", "12:00", "15:00", "18:00"].map((time, index) => ({
    t: time,
    icon: icons[index],
    temp: Math.round(baseTemp + offsets[index]),
  }));
}

const dayPlan = [
  { time: "06:30", title: "Sunrise at Cape Tenaro lighthouse", note: "Coastal cliffs, soft golden light" },
  { time: "08:45", title: "Coastal trail descent", note: "Wild herbs, hidden coves" },
  { time: "11:30", title: "Lunch in Vatheia village", note: "Stone-tower taverna · €14" },
  { time: "14:00", title: "Chapel of Asomati viewpoint", note: "Sea panorama · low-traffic" },
  { time: "17:30", title: "Sunset swim at Marmari cove", note: "Crowd index: 02 / 10" },
];

export default function Itinerary({ activeTrail }) {
  const trail = activeTrail || demoTrail;
  const [weatherContext, setWeatherContext] = useState(activeTrail?.weather || activeTrail?.conditions?.weather || null);
  const elevation = elevationDataForTrail(trail);
  const distanceKm = Number(trail.distanceKm) || demoTrail.distanceKm;
  const elevationGainM = Number(trail.elevationGainM) || demoTrail.elevationGainM;
  const yMax = Math.max(elevationGainM, ...elevation.map((point) => point.m), 50);
  const weatherTimeline = buildWeatherTimeline(weatherContext, trail);
  const weatherHeadline = headlineForWeather(weatherContext);

  useEffect(() => {
    let cancelled = false;
    const providedWeather = activeTrail?.weather || activeTrail?.conditions?.weather || null;

    if (providedWeather) {
      setWeatherContext(providedWeather);
      return undefined;
    }

    if (!activeTrail?.id || activeTrail.id === demoTrail.id) {
      setWeatherContext(null);
      return undefined;
    }

    async function loadConditions() {
      try {
        const response = await fetch(`${API_URL}/api/advanced/conditions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailId: activeTrail.id }),
        });
        const data = await response.json();
        if (!cancelled && response.ok) {
          setWeatherContext(data?.conditions?.weather || null);
        }
      } catch {
        if (!cancelled) setWeatherContext(null);
      }
    }

    setWeatherContext(null);
    loadConditions();

    return () => {
      cancelled = true;
    };
  }, [activeTrail]);

  return (
    <section id="itinerary" data-testid="itinerary-section" className="relative py-24 md:py-36 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">04 — Your living itinerary</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05] max-w-3xl">
              One day. One trail.<br />A hundred small decisions made for you.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1.5 rounded-full bg-[#1B3B2E]/60 border border-[#E8E1D5]/10 text-[10px] font-mono uppercase tracking-wider text-[#E8E1D5]/80 inline-flex items-center gap-1.5"><CalendarDays size={11} /> Best: May–Oct</span>
            <span className="px-3 py-1.5 rounded-full bg-[#1B3B2E]/60 border border-[#E8E1D5]/10 text-[10px] font-mono uppercase tracking-wider text-[#E8E1D5]/80 inline-flex items-center gap-1.5"><Route size={11} /> {distanceKm} km · {trail.difficulty || "Moderate"}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left visuals */}
          <div className="lg:col-span-7 space-y-6">
            {/* Elevation graph */}
            <div data-testid="itinerary-elevation" className="pf-glass rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">Elevation profile</div>
                  <div className="font-display text-xl text-[#E8E1D5] mt-1">{trail.name} · +{elevationGainM}m peak</div>
                </div>
                <Compass size={18} className="text-[#00F0FF]" />
              </div>
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={elevation} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#1B3B2E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="km" domain={[0, distanceKm]} stroke="#A3ADAA" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} unit="km" />
                    <YAxis domain={[0, Math.ceil(yMax / 50) * 50]} stroke="#A3ADAA" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} unit="m" />
                    <Tooltip
                      contentStyle={{ background: "#050907", border: "1px solid rgba(0,240,255,0.3)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#E8E1D5" }}
                      itemStyle={{ color: "#00F0FF" }}
                    />
                    <Area type="monotone" dataKey="m" stroke="#00F0FF" strokeWidth={2} fill="url(#elevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weather timeline */}
            <div data-testid="itinerary-weather" className="pf-glass rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">Weather timeline</div>
                  <div className="font-display text-xl text-[#E8E1D5] mt-1">{weatherHeadline}</div>
                </div>
                <span className="font-mono text-[10px] text-[#00F0FF]">
                  {weatherContext?.source ? weatherContext.source.toUpperCase() : "REAL-TIME"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {weatherTimeline.map((w) => {
                  const Icon = w.icon;
                  return (
                    <div key={w.t} className="text-center pf-glass-light rounded-2xl py-4">
                      <div className="font-mono text-[10px] text-[#A3ADAA]">{w.t}</div>
                      <Icon size={20} className="text-[#00F0FF] mx-auto my-2" />
                      <div className="font-display text-lg text-[#E8E1D5]">{w.temp}°</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right day plan */}
          <div className="lg:col-span-5">
            <div className="pf-glass rounded-3xl p-6 md:p-8 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">Day plan</div>
                  <div className="font-display text-2xl text-[#E8E1D5] mt-1">Saturday · May 18</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-[#00F0FF]">92</div>
                  <div className="font-mono text-[9px] uppercase text-[#A3ADAA]">Sustainability</div>
                </div>
              </div>

              <ol className="space-y-5 relative">
                <span className="absolute left-[18px] top-2 bottom-2 w-px bg-[#00F0FF]/20" />
                {dayPlan.map((d, i) => (
                  <li key={i} data-testid={`day-plan-item-${i}`} className="relative flex gap-4">
                    <div className="relative z-10 w-9 h-9 rounded-full bg-[#050907] border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
                      <span className="font-mono text-[9px] text-[#00F0FF]">{d.time.split(":")[0]}</span>
                    </div>
                    <div className="pt-1">
                      <div className="font-display text-base text-[#E8E1D5]">{d.title}</div>
                      <div className="text-xs text-[#A3ADAA] mt-1">{d.note}</div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-7 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Backpack size={14} className="text-[#00F0FF]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">Packing tips</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Sun hat", "2L water", "Hiking shoes", "Light jacket", "Reusable bottle", "Trail snacks"].map((p) => (
                    <span key={p} className="px-3 py-1 rounded-full bg-[#1B3B2E]/60 border border-[#E8E1D5]/10 text-[10px] font-mono uppercase tracking-wider text-[#E8E1D5]/80">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
