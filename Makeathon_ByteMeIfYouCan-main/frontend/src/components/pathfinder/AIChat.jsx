import { useEffect, useRef, useState } from "react";
import { Send, Cloud, Mountain, Clock, Shield, Leaf, Camera, MapPin, Users } from "lucide-react";

const chatBg = "https://static.prod-images.emergentagent.com/jobs/4b882ed6-0c4e-445d-a9ec-c11ffed676fd/images/7f25b254f24abc1be91acff59d72e108f5c7d4f1f256e226d2392c61f71828be.png";
const DEFAULT_TRAIL_IMAGE_URL = "https://static.prod-images.emergentagent.com/jobs/4b882ed6-0c4e-445d-a9ec-c11ffed676fd/images/3acd25739759ca0e9673a70287ac30474c6ede54e38c2bb8890f23a7847e1933.png";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const onboardingMessage =
  "Hi, I'm Pathfinder - your AI trail companion for sustainable hiking in Greece.\n\nTell me your fitness level, available time, terrain preferences, mood, age group, group type, or crowd tolerance, and I'll recommend a trail.\n\nYou can also ask me about a specific destination, current weather and safety conditions, nearby trails, or alternatives.";

function createStableId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasPanelData(response) {
  return Boolean(
    response?.recommendedDestination ||
      (response?.mode === "condition_check" && response?.conditions) ||
      response?.nearbyTrails?.length ||
      response?.nearbyPOIs?.length ||
      response?.baseDestination
  );
}

function createResponseSnapshot(response) {
  return {
    recommendedDestination: response.recommendedDestination,
    selectedTrail: response.selectedTrail,
    scores: response.scores,
    weather: response.weather,
    conditions: response.conditions,
    itinerary: response.itinerary,
    alternatives: response.alternatives,
    nearbyTrails: response.nearbyTrails,
    nearbyPOIs: response.nearbyPOIs,
    baseDestination: response.baseDestination,
    openData: response.openData,
    route: response.route,
    placeVoice: response.placeVoice,
    smartSwap: response.smartSwap,
    mode: response.mode,
    travelerProfile: response.travelerProfile,
  };
}

export default function AIChat({ onRecommendationSelected }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: createStableId("msg"),
      role: "assistant",
      text: onboardingMessage,
    },
  ]);
  const [recommendationPanels, setRecommendationPanels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(`pathfinder-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, recommendationPanels, isLoading]);

  async function handleSubmit(event) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { id: createStableId("msg"), role: "user", text };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: conversationIdRef.current }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Pathfinder backend failed");
      }

      const assistantMessage = {
        id: createStableId("msg"),
        role: "assistant",
        text: data.message,
        warning: data.warning,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      if (hasPanelData(data)) {
        setRecommendationPanels((current) => [
          ...current,
          {
            id: createStableId("panel"),
            messageId: assistantMessage.id,
            timestamp: Date.now(),
            responseSnapshot: createResponseSnapshot(data),
          },
        ]);
      }

      if (data.recommendedDestination) {
        onRecommendationSelected?.({
          ...data.recommendedDestination,
          difficulty: data.recommendedDestination.difficulty || data.itinerary?.difficulty,
          route: data.route,
          imageUrl: data.recommendedDestination.imageUrl,
          weather: data.weather,
          conditions: data.conditions,
        });
      } else if (data.mode === "condition_check" && data.selectedTrail) {
        onRecommendationSelected?.({
          ...data.selectedTrail,
          imageUrl: data.selectedTrail.imageUrl,
          weather: data.weather,
          conditions: data.conditions,
        });
      }
    } catch (requestError) {
      setError(`Could not reach the backend: ${requestError.message}`);
      setMessages((current) => [
        ...current,
        {
          id: createStableId("msg"),
          role: "assistant",
          text: "I cannot connect to the Pathfinder backend right now. Check that it is running on port 8000 and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="chat" data-testid="aichat-section" className="relative py-24 md:py-36 px-6 md:px-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={chatBg} alt="" className="w-full h-full object-cover opacity-25" style={{ filter: "blur(40px)" }} />
        <div className="absolute inset-0 bg-[#050907]/70" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">03 - Meet your AI companion</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05]">
            Talk to Pathfinder.<br />
            Get a journey, not a search result.
          </h2>
        </div>

        <div className="pf-glass rounded-3xl p-4 md:p-6 pf-glow-cyan relative">
          <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#1B3B2E] flex items-center justify-center">
                  <Mountain size={14} className="text-[#050907]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00F0FF] border-2 border-[#0E2419]" />
              </div>
              <div>
                <div className="font-display text-sm text-[#E8E1D5]">Pathfinder AI</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">
                  Online · Trail companion
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
              Multi-agent trail intelligence
            </div>
          </div>

          <div className="px-2 md:px-4 py-6 space-y-5 max-h-[680px] overflow-y-auto">
            {messages.map((message) => (
              <ChatTimelineItem
                key={message.id}
                message={message}
                panels={recommendationPanels.filter((panel) => panel.messageId === message.id)}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-[#A3ADAA]">
                <span className="font-mono text-[10px] uppercase tracking-wider">Pathfinder</span>
                <span className="w-1 h-1 rounded-full bg-[#00F0FF] animate-pulse" />
                <span className="font-mono text-[10px]">profiling traveler · matching trails · checking safety...</span>
              </div>
            )}

            {error && (
              <div className="max-w-2xl rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="px-2 md:px-4 pt-3 pb-1 border-t border-white/5">
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-3 border border-white/10 focus-within:border-[#00F0FF]/50 transition-colors">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Try: quiet river and mountain trail, moderate difficulty, 5 hours..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#E8E1D5] placeholder:text-[#A3ADAA] outline-none"
                disabled={isLoading}
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                data-testid="chat-send-btn"
                className="w-9 h-9 rounded-full bg-[#00F0FF] flex items-center justify-center text-[#050907] hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end" data-testid="chat-user-msg">
        <div className="max-w-md bg-[#00F0FF] text-[#050907] px-5 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start" data-testid="chat-ai-msg">
      <div className="max-w-2xl pf-glass-light rounded-2xl rounded-bl-md px-5 py-4 text-sm text-[#E8E1D5] leading-relaxed whitespace-pre-line">
        {message.text}
        {message.warning && (
          <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#00F0FF]/80">
            {message.warning}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatTimelineItem({ message, panels }) {
  return (
    <>
      <ChatBubble message={message} />
      {message.role === "assistant" &&
        panels.map((panel) => (
          <TrailRecommendationCard key={panel.id} plan={panel.responseSnapshot} />
        ))}
    </>
  );
}

function TrailRecommendationCard({ plan }) {
  if (plan.mode === "condition_check") {
    return <ConditionCheckCard plan={plan} />;
  }

  if (plan.mode === "nearby_exploration") {
    return <NearbyExplorationPanel plan={plan} />;
  }

  const destination = plan.recommendedDestination || plan.baseDestination || {};
  const imageUrl = destination.imageUrl || DEFAULT_TRAIL_IMAGE_URL;
  const scores = plan.scores || {};
  const conditions = plan.conditions || {};
  const itinerary = plan.itinerary || {};
  const profile = plan.travelerProfile || {};
  const weatherText = conditions.weather?.current
    ? conditions.weather.summary
    : "Seasonal check: suitable, verify local weather before departure";

  return (
    <div className="flex justify-start" data-testid="chat-trail-card">
      <div className="w-full max-w-3xl pf-glass rounded-2xl overflow-hidden border border-[#00F0FF]/15">
        <div className="grid md:grid-cols-5">
          <div className="md:col-span-2 relative h-44 md:h-auto">
            <img
              src={imageUrl}
              alt={destination.name || "Greek trail"}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== DEFAULT_TRAIL_IMAGE_URL) {
                  event.currentTarget.src = DEFAULT_TRAIL_IMAGE_URL;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/40 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">Recommended</span>
            </div>
          </div>

          <div className="md:col-span-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">
                  {destination.region || "Greece"}
                </div>
                <h4 className="font-display text-xl text-[#E8E1D5] font-light mt-1">
                  {destination.name || "Personalized Greek trail"}
                </h4>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-[#00F0FF] font-light">{scores.finalScore || destination.sustainabilityScore || 0}</div>
                <div className="font-mono text-[9px] uppercase text-[#A3ADAA]">Eco score</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric icon={Clock} label="Duration" value={itinerary.totalDuration || destination.duration || "TBD"} />
              <Metric icon={Mountain} label="Elevation" value={`+${destination.elevationGainM || 0}m`} />
              <Metric icon={Users} label="Crowds" value={`${destination.crowdPressure || scores.crowdPressure || 0}/100`} />
              <Metric icon={Camera} label="Match" value={`${destination.matchScore || 0}%`} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge icon={Cloud} text={weatherText} />
              <Badge icon={Shield} text={readableSafety(conditions.safetyLevel)} />
              <Badge icon={Leaf} text="Lower-impact choice" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#A3ADAA]">
              <MapPin size={11} className="text-[#00F0FF]" />
              {itinerary.recommendedStart || "08:30"} start · {destination.difficulty || "Medium"} · {profile.fitnessLevel || "personalized"}
            </div>

            {itinerary.stops?.length > 0 && (
              <div className="mt-4 grid gap-2">
                {itinerary.stops.slice(0, 3).map((stop) => (
                  <div key={`${stop.time}-${stop.label}`} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">{stop.time}</div>
                    <div className="text-xs text-[#E8E1D5]">{stop.label}</div>
                  </div>
                ))}
              </div>
            )}

            {plan.alternatives?.length > 0 && (
              <div className="mt-4 text-[10px] text-[#A3ADAA]">
                Alternatives: {plan.alternatives.slice(0, 2).map((item) => item.name).join(" · ")}
              </div>
            )}

            {plan.mode === "nearby_exploration" && <NearbyExplorationCards plan={plan} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConditionCheckCard({ plan }) {
  const trail = plan.selectedTrail || {};
  const conditions = plan.conditions || {};
  const weather = plan.weather || conditions.weather || {};
  const current = weather.current || {};
  const checks = conditions.safetyChecks || [];

  return (
    <div className="flex justify-start" data-testid="chat-condition-card">
      <div className="w-full max-w-3xl pf-glass rounded-2xl overflow-hidden border border-[#00F0FF]/15 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF]">
              Live condition check
            </div>
            <h4 className="font-display text-xl text-[#E8E1D5] font-light mt-1">
              {trail.name || "Selected trail"}
            </h4>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-1">
              {trail.region || "Greece"} · weather and safety check
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl text-[#00F0FF] font-light">
              {Number.isFinite(current.temperatureC) ? `${current.temperatureC}°` : "--"}
            </div>
            <div className="font-mono text-[9px] uppercase text-[#A3ADAA]">
              {current.description || "Seasonal"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric icon={Cloud} label="Weather" value={current.description || weather.seasonal?.level || "Check"} />
          <Metric icon={Mountain} label="Wind" value={Number.isFinite(current.windKph) ? `${current.windKph} km/h` : "TBD"} />
          <Metric icon={Shield} label="Safety" value={readableSafety(conditions.safetyLevel)} />
          <Metric icon={Leaf} label="Season" value={weather.seasonal?.level || "Watch"} />
        </div>

        {weather.summary && (
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-xs text-[#E8E1D5]">
            {weather.summary}
          </div>
        )}

        {checks.length > 0 && (
          <div className="mt-4 grid gap-2">
            {checks.slice(0, 3).map((check) => (
              <div key={check} className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <Shield size={12} className="text-[#00F0FF] shrink-0 mt-0.5" />
                <span className="text-xs text-[#A3ADAA]">{check}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NearbyExplorationCards({ plan }) {
  const nearbyTrails = plan.nearbyTrails || [];
  const nearbyPOIs = plan.nearbyPOIs || [];
  const items = [
    ...nearbyTrails.map((item) => ({ ...item, category: "Trail" })),
    ...nearbyPOIs.map((item) => ({ ...item, category: readablePoiType(item.type) })),
  ].slice(0, 8);

  if (!items.length) return null;

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">Nearby exploration</div>
          <div className="text-xs text-[#A3ADAA]">
            Around {plan.baseDestination?.name || plan.recommendedDestination?.name || "the selected area"}
          </div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">
          open data
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={`${item.category}-${item.id}-${item.name}`} className="rounded-xl bg-white/5 border border-white/10 px-3 py-3">
            <div className="flex items-start gap-2">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-10 w-12 rounded-lg object-cover border border-white/10 shrink-0"
                  onError={(event) => {
                    if (event.currentTarget.src !== DEFAULT_TRAIL_IMAGE_URL) {
                      event.currentTarget.src = DEFAULT_TRAIL_IMAGE_URL;
                    }
                  }}
                />
              ) : (
                <MapPin size={13} className="text-[#00F0FF] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#00F0FF]">{item.category}</span>
                  {Number.isFinite(item.distanceKm) && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">{item.distanceKm} km</span>
                  )}
                </div>
                <div className="text-xs text-[#E8E1D5] truncate">{item.name}</div>
                {item.region && <div className="text-[10px] text-[#A3ADAA] truncate">{item.region}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NearbyExplorationPanel({ plan }) {
  return (
    <div className="flex justify-start" data-testid="chat-nearby-card">
      <div className="w-full max-w-3xl pf-glass rounded-2xl overflow-hidden border border-[#00F0FF]/15 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF]">
              Nearby exploration
            </div>
            <h4 className="font-display text-xl text-[#E8E1D5] font-light mt-1">
              Around {plan.baseDestination?.name || "the selected area"}
            </h4>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-1">
              Trails, viewpoints, villages, and nature POIs
            </div>
          </div>
          <MapPin size={22} className="text-[#00F0FF] shrink-0" />
        </div>

        <NearbyExplorationCards plan={plan} />
      </div>
    </div>
  );
}

function readablePoiType(type) {
  if (type === "viewpoint") return "Viewpoint";
  if (type === "village") return "Village";
  if (type === "river") return "River";
  if (type === "lake") return "Lake";
  if (type === "shelter") return "Shelter";
  if (type === "nature") return "Nature";
  return "POI";
}

function readableSafety(value) {
  if (value === "unsafe") return "Unsafe today";
  if (value === "suitable-with-checks") return "Suitable with checks";
  return "Safety checked";
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={14} className="text-[#00F0FF] shrink-0" />
      <div className="min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-wider text-[#A3ADAA]">{label}</div>
        <div className="font-display text-sm text-[#E8E1D5] truncate">{value}</div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, text }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#E8E1D5]">
      <Icon size={11} className="text-[#00F0FF] shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}
