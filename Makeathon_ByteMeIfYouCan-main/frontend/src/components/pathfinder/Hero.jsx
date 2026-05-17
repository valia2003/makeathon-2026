import { useEffect, useState } from "react";
import GreeceMap from "./GreeceMap";
import { ArrowRight, Cloud, Users, Leaf, Mountain } from "lucide-react";

const heroBg = "https://static.prod-images.emergentagent.com/jobs/4b882ed6-0c4e-445d-a9ec-c11ffed676fd/images/d43ce6433f1ebd177533c6a5013ffb440d1857f1ed8f63329278612b0784606e.png";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function crowdDensity(crowdPressure) {
  if (crowdPressure <= 30) return "LOW";
  if (crowdPressure <= 65) return "MODERATE";
  return "HIGH";
}

function weatherFallback(trail) {
  return trail ? "Seasonal check" : "Loading trail weather";
}

function formatWeatherSummary(summary, fallback) {
  if (!summary) return fallback;
  const match = String(summary).match(/([^,]+),\s*(-?\d+)C/i);
  if (!match) return summary;
  return `${match[2]}° · ${match[1]}`;
}

export default function Hero({ onSelectedTrailChange }) {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const [mapTrails, setMapTrails] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [weatherText, setWeatherText] = useState(weatherFallback(null));
  const selectedCrowdDensity = crowdDensity(selectedTrail?.crowdPressure || 0);
  const sustainabilityScore = selectedTrail?.sustainabilityScore || 0;
  const sustainabilityOffset = Math.max(0, 88 - (88 * sustainabilityScore) / 100);

  useEffect(() => {
    let cancelled = false;

    async function loadMapTrails() {
      try {
        const response = await fetch(`${API_URL}/api/trails`);
        const data = await response.json();
        const loadedTrails = Array.isArray(data?.trails) ? data.trails : [];
        console.log("Loaded trails for map:", loadedTrails.length);

        if (!cancelled) {
          setMapTrails(loadedTrails);
          setSelectedTrail((current) => {
            const nextTrail = current || loadedTrails[0] || null;
            if (nextTrail) onSelectedTrailChange?.(nextTrail);
            return nextTrail;
          });
        }
      } catch {
        console.log("Loaded trails for map:", 0);
        if (!cancelled) {
          setMapTrails([]);
          setSelectedTrail(null);
        }
      }
    }

    loadMapTrails();

    return () => {
      cancelled = true;
    };
  }, [onSelectedTrailChange]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedTrail) {
      setWeatherText(weatherFallback(null));
      return undefined;
    }

    setWeatherText(weatherFallback(selectedTrail));

    async function fetchTrailWeather() {
      try {
        const response = await fetch(`${API_URL}/api/advanced/conditions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailId: selectedTrail.id }),
        });
        const data = await response.json();
        const summary = data?.conditions?.weather?.summary;
        if (!cancelled && response.ok && summary) {
          setWeatherText(formatWeatherSummary(summary, weatherFallback(selectedTrail)));
        }
      } catch {
        if (!cancelled) setWeatherText(weatherFallback(selectedTrail));
      }
    }

    fetchTrailWeather();

    return () => {
      cancelled = true;
    };
  }, [selectedTrail]);

  return (
    <section
      data-testid="hero-section"
      className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden pf-grain"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img src={heroBg} alt="Greek mountains at dawn" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050907] via-[#050907]/85 to-[#050907]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050907]" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-10 grid lg:grid-cols-12 gap-10 items-center">
        {/* Left content */}
        <div className="lg:col-span-7 pf-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8E1D5]/15 bg-white/5 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#E8E1D5]/80">
              AI Trail Companion · Greece
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-tighter leading-[0.95] text-[#E8E1D5]">
            Discover the<br />
            Greece <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#E8E1D5]">nobody</span><br />
            else sees.
          </h1>

          <p className="mt-7 max-w-xl text-lg md:text-xl font-light leading-relaxed text-[#A3ADAA]">
            An AI trail companion that matches you with sustainable outdoor experiences
            across the hidden gorges, mountains and coastlines of Greece.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              data-testid="hero-start-journey-btn"
              onClick={() => go("chat")}
              className="group relative inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#00F0FF] text-[#050907] font-medium text-sm tracking-wide hover:bg-white transition-all duration-300 pf-glow-cyan"
            >
              Start Your Journey
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              data-testid="hero-explore-trails-btn"
              onClick={() => go("itinerary")}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-[#E8E1D5]/20 backdrop-blur-md text-[#E8E1D5] text-sm hover:bg-[#E8E1D5]/10 transition-all duration-300"
            >
              Explore Hidden Trails
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            {[
              { k: "100", v: "Curated trails" },
              { k: "44", v: "Hidden villages" },
              { k: "63%", v: "Crowd reduction" },
            ].map((s) => (
              <div key={s.v} data-testid={`hero-stat-${s.v}`}>
                <div className="font-display text-2xl md:text-3xl text-[#E8E1D5] font-light">{s.k}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A3ADAA] mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Map + floating cards */}
        <div className="lg:col-span-5 relative">
          <div className="relative pf-glass rounded-3xl p-6 md:p-8 pf-glow-cyan">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mountain size={14} className="text-[#00F0FF]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8E1D5]/80">Live Trail Map · Greece</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                <span className="font-mono text-[9px] text-[#A3ADAA]">REAL-TIME</span>
              </div>
            </div>
            <GreeceMap
              trails={mapTrails}
              selectedTrailId={selectedTrail?.id}
              onSelectTrail={(trail) => {
                setSelectedTrail(trail);
                onSelectedTrailChange?.(trail);
              }}
            />
          </div>

          {/* Floating Weather Badge */}
          <div data-testid="hero-weather-badge" className="absolute -top-12 -left-4 md:-left-10 pf-glass rounded-2xl px-4 py-3 pf-float hidden sm:block">
            <div className="flex items-center gap-3">
              <Cloud size={18} className="text-[#00F0FF]" />
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">{selectedTrail?.name || "Trail"} · Now</div>
                <div className="font-display text-sm text-[#E8E1D5]">{weatherText}</div>
              </div>
            </div>
          </div>

          {/* Crowd indicator */}
          <div data-testid="hero-crowd-badge" className="absolute top-1/3 -right-3 md:-right-8 pf-glass rounded-2xl px-4 py-3 pf-float-slow hidden sm:block">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-[#E8E1D5]" />
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">Crowd density</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-6 h-1 rounded-full bg-[#00F0FF]" />
                  <span className={`w-6 h-1 rounded-full ${selectedCrowdDensity !== "LOW" ? "bg-[#00F0FF]" : "bg-[#E8E1D5]/20"}`} />
                  <span className={`w-6 h-1 rounded-full ${selectedCrowdDensity === "HIGH" ? "bg-[#00F0FF]" : "bg-[#E8E1D5]/20"}`} />
                  <span className="text-[10px] font-mono text-[#00F0FF] ml-1">{selectedCrowdDensity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability score */}
          <div data-testid="hero-sustainability-badge" className="absolute -bottom-5 left-6 md:left-2 pf-glass rounded-2xl px-4 py-3 pf-float hidden sm:block">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                  <circle cx="18" cy="18" r="14" stroke="rgba(232,225,213,0.1)" strokeWidth="3" fill="none" />
                  <circle cx="18" cy="18" r="14" stroke="#00F0FF" strokeWidth="3" fill="none" strokeDasharray="88" strokeDashoffset={sustainabilityOffset} strokeLinecap="round" />
                </svg>
                <Leaf size={12} className="text-[#00F0FF]" />
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">Sustainability</div>
                <div className="font-display text-sm text-[#E8E1D5]">Score · {sustainabilityScore}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#A3ADAA]">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#00F0FF] to-transparent" />
      </div>
    </section>
  );
}
