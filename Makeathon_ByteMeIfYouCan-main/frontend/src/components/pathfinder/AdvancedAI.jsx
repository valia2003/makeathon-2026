import { useEffect, useState } from "react";
import { Activity, Camera, Shuffle, ArrowUpRight, Upload, Loader2 } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const cards = [
  {
    icon: Activity,
    title: "Real-Time Trail Condition Agent",
    desc: "Checks weather, seasonality, route risk and live-ready safety signals before you step out.",
    badge: "Live-ready",
    metric: "Safety",
    metricLabel: "condition check",
    testid: "advanced-ai-trail-condition",
    mode: "conditions",
  },
  {
    icon: Camera,
    title: "Photo-to-Trail Matching",
    desc: "Upload a landscape you love. Pathfinder reads the terrain and mood, then finds a Greek trail with the same feeling.",
    badge: "Vision model",
    metric: "Image",
    metricLabel: "visual trail match",
    testid: "advanced-ai-photo-match",
    mode: "photo",
  },
  {
    icon: Shuffle,
    title: "Dynamic Itinerary Adaptation",
    desc: "Tell Pathfinder what changed: rain, fatigue, faster pace, delays. The plan updates without losing the spirit of the trip.",
    badge: "Adaptive",
    metric: "Reroute",
    metricLabel: "multi-agent plan",
    testid: "advanced-ai-adaptation",
    mode: "adapt",
  },
];

export default function AdvancedAI() {
  const [trails, setTrails] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_URL}/api/trails`)
      .then((response) => response.json())
      .then((data) => {
        if (isMounted) setTrails(data.trails || []);
      })
      .catch(() => {
        if (isMounted) setTrails([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section data-testid="advancedai-section" className="relative py-24 md:py-36 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">06 - Inside the engine</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05] max-w-3xl">
              Three intelligences,<br />you can actually use.
            </h2>
          </div>
          <p className="max-w-sm text-base text-[#A3ADAA] font-light">
            Conditions, visual matching, and adaptive replanning now run as working Pathfinder agents.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <AdvancedCard key={card.title} card={card} trails={trails} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvancedCard({ card, trails }) {
  const Icon = card.icon;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [adaptText, setAdaptText] = useState("Rain is coming in after lunch, keep the route safer and shorter.");
  const [selectedTrailId, setSelectedTrailId] = useState("");

  const activeTrailId = selectedTrailId || trails[0]?.id || "zagori-vikos-voidomatis";
  const selectedTrail = trails.find((trail) => trail.id === activeTrailId);

  useEffect(() => {
    if (!selectedTrailId && trails[0]?.id) {
      setSelectedTrailId(trails[0].id);
    }
  }, [selectedTrailId, trails]);

  async function callAgent(body, endpoint) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Agent request failed");
      }

      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageData = await fileToDataUrl(file);
    await callAgent({ imageData }, "/api/advanced/photo-match");
  }

  return (
    <div data-testid={card.testid} className="group relative pf-glass rounded-3xl p-7 overflow-hidden flex flex-col min-h-[440px]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#00F0FF]/8 blur-3xl group-hover:bg-[#00F0FF]/20 transition-all duration-500" />

      <div className="relative flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-[#1B3B2E]/80 border border-[#00F0FF]/30 flex items-center justify-center pf-glow-cyan">
            <Icon size={18} className="text-[#00F0FF]" />
          </div>
          <ArrowUpRight size={16} className="text-[#A3ADAA] group-hover:text-[#00F0FF] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>

        <h3 className="mt-7 font-display text-xl md:text-2xl font-light text-[#E8E1D5] leading-tight">{card.title}</h3>
        <p className="mt-3 text-sm text-[#A3ADAA] leading-relaxed">{card.desc}</p>

        <div className="mt-6">
          {(card.mode === "conditions" || card.mode === "adapt") && (
            <TrailSelect
              trails={trails}
              value={activeTrailId}
              onChange={(trailId) => {
                setSelectedTrailId(trailId);
                setResult(null);
                setError("");
              }}
            />
          )}

          {card.mode === "conditions" && (
            <button
              type="button"
              onClick={() => callAgent({ trailId: activeTrailId }, "/api/advanced/conditions")}
              className="mt-3 w-full rounded-full bg-[#00F0FF] px-4 py-3 text-sm font-medium text-[#050907] transition-transform hover:scale-[1.02] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Checking..." : `Check ${shortName(selectedTrail?.name || "trail")} now`}
            </button>
          )}

          {card.mode === "photo" && (
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00F0FF] px-4 py-3 text-sm font-medium text-[#050907] transition-transform hover:scale-[1.02]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {loading ? "Matching..." : "Upload landscape"}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={loading} />
            </label>
          )}

          {card.mode === "adapt" && (
            <div className="space-y-3">
              <textarea
                value={adaptText}
                onChange={(event) => setAdaptText(event.target.value)}
                className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#E8E1D5] outline-none focus:border-[#00F0FF]/50"
              />
              <button
                type="button"
                onClick={() =>
                  callAgent(
                    { trailId: activeTrailId, update: adaptText },
                    "/api/advanced/adapt-itinerary"
                  )
                }
                className="w-full rounded-full bg-[#00F0FF] px-4 py-3 text-sm font-medium text-[#050907] transition-transform hover:scale-[1.02] disabled:opacity-50"
                disabled={loading || !adaptText.trim()}
              >
                {loading ? "Replanning..." : "Adapt itinerary"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto pt-5">
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-100">
              {error}
            </div>
          )}

          {result && <AgentResult mode={card.mode} result={result} />}

          {!result && !error && (
            <div className="mt-7 pt-5 border-t border-white/5 flex items-end justify-between">
              <div>
                <div className="font-display text-3xl font-extralight text-[#00F0FF]">{card.metric}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">{card.metricLabel}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#1B3B2E]/60 border border-[#E8E1D5]/10 text-[9px] font-mono uppercase tracking-wider text-[#E8E1D5]/80">{card.badge}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentResult({ mode, result }) {
  if (mode === "conditions") {
    return (
      <ResultBox
        title={result.headline}
        lines={[
          result.trail?.name,
          result.conditions?.weather?.summary,
          ...(result.conditions?.safetyChecks || []).slice(0, 2),
        ]}
      />
    );
  }

  if (mode === "photo") {
    return (
      <ResultBox
        title={result.match?.name}
        lines={[
          result.match?.region,
          result.match?.why,
          `Visual mood: ${result.vision?.mood || "landscape match"}`,
        ]}
      />
    );
  }

  return (
    <ResultBox
      title={result.adaptationReason}
      lines={[
        `${result.trail?.name} · ${result.itinerary?.totalDuration}`,
        `Start: ${result.itinerary?.recommendedStart}`,
        ...(result.itinerary?.stops || []).slice(0, 2).map((stop) => `${stop.time} ${stop.label}`),
      ]}
    />
  );
}

function TrailSelect({ trails, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">
        Destination
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#07110C] px-4 py-3 text-sm text-[#E8E1D5] outline-none focus:border-[#00F0FF]/50"
      >
        {trails.length === 0 && <option value="zagori-vikos-voidomatis">Zagori / Vikos Gorge</option>}
        {trails.map((trail) => (
          <option key={trail.id} value={trail.id}>
            {trail.name} - {trail.region}
          </option>
        ))}
      </select>
    </label>
  );
}

function shortName(name) {
  return name.split("/")[0].trim();
}

function ResultBox({ title, lines }) {
  return (
    <div className="mt-5 rounded-2xl border border-[#00F0FF]/15 bg-[#00F0FF]/5 p-4">
      <div className="font-display text-base text-[#E8E1D5]">{title}</div>
      <div className="mt-3 space-y-2">
        {lines.filter(Boolean).map((line) => (
          <div key={line} className="text-xs leading-relaxed text-[#A3ADAA]">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
