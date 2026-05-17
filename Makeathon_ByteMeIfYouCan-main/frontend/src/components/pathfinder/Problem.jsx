import { TrendingDown, MapPin, Users, Coins } from "lucide-react";

const crowd1 = "https://images.unsplash.com/photo-1506755594592-349d12a7c52a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHx0b3VyaXN0JTIwY3Jvd2R8ZW58MHx8fHwxNzc4OTIyNzQ0fDA&ixlib=rb-4.1.0&q=85";
const hidden1 = "https://images.unsplash.com/photo-1687866979162-495885f06b3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxncmVlY2UlMjBoaWtpbmd8ZW58MHx8fHwxNzc4OTIyNzQ0fDA&ixlib=rb-4.1.0&q=85";

export default function Problem() {
  return (
    <section id="problem" data-testid="problem-section" className="relative py-24 md:py-36 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#00F0FF] mb-4">01 — The Problem</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#E8E1D5] leading-[1.05]">
            Greece welcomes <span className="text-[#00F0FF]">36 million</span> tourists.
            Most never leave the same five postcards.
          </h2>
          <p className="mt-6 text-lg text-[#A3ADAA] font-light max-w-2xl">
            Overtourism is suffocating Greece's iconic sites while hundreds of stunning trails,
            gorges and villages sit empty — and local communities miss out on the revenue.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Big stat 1 */}
          <div data-testid="problem-stat-tourists" className="md:col-span-5 pf-glass rounded-3xl p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B3B2E]/30 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[#A3ADAA]">
                <Users size={14} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Annual Tourists</span>
              </div>
              <div className="mt-6 font-display text-7xl md:text-8xl font-extralight text-[#E8E1D5] tracking-tighter">
                36M<span className="text-[#00F0FF]">+</span>
              </div>
              <p className="mt-4 text-sm text-[#A3ADAA] max-w-xs">
                A record-breaking inflow concentrated almost entirely on Santorini, Mykonos, Athens and Acropolis.
              </p>
              <div className="mt-8 h-px bg-gradient-to-r from-[#00F0FF]/40 to-transparent" />
              <div className="mt-3 font-mono text-[10px] text-[#A3ADAA] uppercase tracking-wider">+12.8% vs last year</div>
            </div>
          </div>

          {/* Image overcrowded */}
          <div className="md:col-span-7 rounded-3xl overflow-hidden relative group">
            <img src={crowd1} alt="Crowded tourist scene" className="w-full h-72 md:h-full object-cover saturate-[0.6]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#050907] via-[#050907]/40 to-transparent" />
            <div className="absolute inset-0 bg-[#1B3B2E]/30 mix-blend-overlay" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-red-200">Critical · Overcrowded</span>
              </div>
              <div className="font-display text-2xl md:text-3xl text-[#E8E1D5] font-light">Santorini · 2M visitors / year</div>
              <div className="font-mono text-xs text-[#A3ADAA] mt-1">Population: 15,500</div>
            </div>
          </div>

          {/* Region concentration */}
          <div data-testid="problem-stat-concentration" className="md:col-span-4 pf-glass rounded-3xl p-8 relative">
            <TrendingDown size={20} className="text-[#00F0FF] mb-5" />
            <div className="font-display text-5xl font-extralight text-[#E8E1D5]">5%</div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-2">of regions</p>
            <p className="mt-5 text-sm text-[#A3ADAA]">absorb <span className="text-[#E8E1D5]">68%</span> of all visitor traffic.</p>
            <div className="mt-6 flex gap-1.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className={`flex-1 h-8 rounded-sm ${i < 14 ? "bg-[#00F0FF]/80" : "bg-[#E8E1D5]/10"}`} />
              ))}
            </div>
          </div>

          {/* Image hidden */}
          <div className="md:col-span-4 rounded-3xl overflow-hidden relative group">
            <img src={hidden1} alt="Hidden Greek trail" className="w-full h-full min-h-[260px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050907] via-[#050907]/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF]">Hidden Trail</span>
              </div>
              <div className="font-display text-xl text-[#E8E1D5] font-light">Pindus · Empty year-round</div>
            </div>
          </div>

          {/* Lost revenue */}
          <div data-testid="problem-stat-revenue" className="md:col-span-4 pf-glass rounded-3xl p-8 relative">
            <Coins size={20} className="text-[#00F0FF] mb-5" />
            <div className="font-display text-5xl font-extralight text-[#E8E1D5]">€2.4B</div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA] mt-2">Lost local revenue</p>
            <p className="mt-5 text-sm text-[#A3ADAA]">
              estimated annual revenue rural villages miss when travelers don't venture beyond the highlights.
            </p>
          </div>

          {/* Wide undiscovered band */}
          <div data-testid="problem-stat-undiscovered" className="md:col-span-12 pf-glass rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <MapPin size={28} className="text-[#00F0FF]" />
              <div>
                <div className="font-display text-3xl md:text-4xl text-[#E8E1D5] font-light">
                  1,200+ Registered Nature Trails in Greece
                </div>
                <p className="text-sm text-[#A3ADAA] mt-1 max-w-xl">
                  A vast, fragmented network waiting to be digitized. Less than 0.4% of annual visitors ever set foot on them.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3ADAA]">
                Crowd vs Hidden ratio
              </div>
              <div className="flex items-center gap-1">
                <span className="font-display text-xl text-[#E8E1D5]">99.6</span>
                <span className="text-[#A3ADAA] text-sm">/</span>
                <span className="font-display text-xl text-[#00F0FF]">0.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
