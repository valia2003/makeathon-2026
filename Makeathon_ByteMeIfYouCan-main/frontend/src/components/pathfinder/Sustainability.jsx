import { Users, HeartHandshake, ShieldCheck, Leaf, ArrowDown } from "lucide-react";

const sustBg = "https://static.prod-images.emergentagent.com/jobs/4b882ed6-0c4e-445d-a9ec-c11ffed676fd/images/148c0f73a84b498ab80cc7b584a34fce60f3db41786dd84618bb4b308ed8b133.png";

const tips = [
  "Pack out everything · including biodegradables",
  "Stay on marked trails to protect rare flora",
  "Support family-run tavernas in hidden villages",
  "Travel in shoulder seasons (May, September)",
  "Refill at village fountains · skip plastic bottles",
];

export default function Sustainability() {
  return (
    <section id="impact" data-testid="sustainability-section" className="relative py-24 md:py-36 px-6 md:px-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={sustBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050907] via-[#050907]/85 to-[#050907]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">05 — Impact</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05]">
            Travel that <em className="not-italic text-[#00F0FF]">measurably</em> gives back.
          </h2>
          <p className="mt-6 text-lg text-[#A3ADAA] font-light max-w-2xl">
            Every Pathfinder journey carries a real footprint score — visible, transparent, and verifiable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Metric
            icon={ArrowDown}
            label="Crowd Reduction Score"
            value="86"
            unit="/100"
            sub="vs. iconic sites"
            color="cyan"
            testid="metric-crowd"
          />
          <Metric
            icon={HeartHandshake}
            label="Community Support Index"
            value="€124"
            sub="per traveler · local"
            color="beige"
            testid="metric-community"
          />
          <Metric
            icon={ShieldCheck}
            label="Trail Preservation"
            value="A+"
            sub="ranger-verified"
            color="green"
            testid="metric-preservation"
          />
          <Metric
            icon={Leaf}
            label="CO₂ Footprint"
            value="-42%"
            sub="vs. typical itinerary"
            color="cyan"
            testid="metric-co2"
          />
        </div>

        {/* Low-impact tips */}
        <div className="mt-10 pf-glass rounded-3xl p-8 md:p-12 grid lg:grid-cols-3 gap-10 items-start" data-testid="low-impact-tips">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF] mb-3">Low-impact travel</div>
            <h3 className="font-display text-2xl md:text-3xl font-light text-[#E8E1D5]">Five tiny habits.<br />One healed coastline.</h3>
          </div>
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#1B3B2E]/40 border border-[#E8E1D5]/10">
                <div className="w-6 h-6 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
                  <Leaf size={11} className="text-[#00F0FF]" />
                </div>
                <span className="text-sm text-[#E8E1D5]/90 leading-relaxed">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, unit, sub, color, testid }) {
  const accent = color === "cyan" ? "text-[#00F0FF]" : color === "beige" ? "text-[#E8E1D5]" : "text-[#7CFFB3]";
  return (
    <div data-testid={testid} className="pf-glass rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#00F0FF]/5 blur-3xl group-hover:bg-[#00F0FF]/15 transition-colors" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <Icon size={18} className="text-[#00F0FF]" />
          <Users size={12} className="text-[#A3ADAA]/0" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`font-display text-5xl font-extralight ${accent}`}>{value}</span>
          {unit && <span className="font-mono text-xs text-[#A3ADAA]">{unit}</span>}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-2">{sub}</div>
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="font-display text-sm text-[#E8E1D5]">{label}</div>
        </div>
      </div>
    </div>
  );
}
