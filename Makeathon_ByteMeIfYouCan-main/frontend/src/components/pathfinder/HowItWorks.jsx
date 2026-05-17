import { MessagesSquare, Sparkles, Leaf, RefreshCw } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: MessagesSquare,
    title: "Conversational AI Intake",
    desc: "Tell Pathfinder your fitness, experience, group size, time, interests — mountain or sea, easy or challenging.",
    points: ["Fitness · Experience", "Mountain / Sea", "Group · Duration"],
  },
  {
    id: 2,
    icon: Sparkles,
    title: "Personalized Trail Matching",
    desc: "Receive curated routes with duration, elevation, difficulty, biodiversity, and what to expect — all ranked for you.",
    points: ["Duration · Elevation", "Biodiversity", "What to expect"],
  },
  {
    id: 3,
    icon: Leaf,
    title: "Sustainability Intelligence",
    desc: "Flags crowded trails, suggests low-impact alternatives, and routes you to community-supporting villages.",
    points: ["Crowd flagging", "Low-impact routes", "Local economy"],
  },
  {
    id: 4,
    icon: RefreshCw,
    title: "Real-Time Adaptation",
    desc: "Weather shifts, fire alerts, seasonality — your itinerary dynamically reroutes itself before you even ask.",
    points: ["Weather · Safety", "Seasonality", "Dynamic rerouting"],
  },
];

export default function HowItWorks() {
  return (
    <section id="how" data-testid="howitworks-section" className="relative py-24 md:py-36 px-6 md:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-20">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">02 — How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05]">
            A four-step journey from <em className="not-italic text-[#00F0FF]">stranger</em> to <em className="font-light italic">storyteller</em>.
          </h2>
        </div>

        <div className="relative">
          {/* Tracing beam */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-[#00F0FF]/40 to-transparent" />
          </div>

          <div className="space-y-12 md:space-y-20">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const leftSide = i % 2 === 0;
              return (
                <div
                  key={s.id}
                  data-testid={`how-step-${s.id}`}
                  className={`relative grid md:grid-cols-2 gap-8 md:gap-16 items-center`}
                >
                  {/* Number marker */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-4 z-10">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#050907] border border-[#00F0FF]/40 flex items-center justify-center pf-glow-cyan">
                        <Icon size={18} className="text-[#00F0FF]" />
                      </div>
                      <div className="absolute -inset-2 rounded-full border border-[#00F0FF]/15" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`${leftSide ? "md:col-start-1 md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"} pl-20 md:pl-0`}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A3ADAA] mb-2">Step 0{s.id}</div>
                    <h3 className="font-display text-2xl md:text-3xl font-light text-[#E8E1D5]">{s.title}</h3>
                    <p className="mt-3 text-[#A3ADAA] text-base font-light leading-relaxed max-w-md md:inline-block">{s.desc}</p>
                    <div className={`mt-5 flex flex-wrap gap-2 ${leftSide ? "md:justify-end" : ""}`}>
                      {s.points.map((p) => (
                        <span key={p} className="px-3 py-1 rounded-full bg-[#1B3B2E]/60 border border-[#E8E1D5]/10 text-[10px] font-mono uppercase tracking-wider text-[#E8E1D5]/80">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decorative tile */}
                  <div className={`hidden md:block ${leftSide ? "md:col-start-2 md:pl-16" : "md:col-start-1 md:pr-16 md:row-start-1"}`}>
                    <div className="pf-glass rounded-2xl p-6 relative overflow-hidden h-44 flex items-end">
                      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#00F0FF]/10 blur-3xl" />
                      <div className="relative">
                        <div className="font-display text-5xl font-extralight text-[#00F0FF]/40">0{s.id}</div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-1">{s.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
