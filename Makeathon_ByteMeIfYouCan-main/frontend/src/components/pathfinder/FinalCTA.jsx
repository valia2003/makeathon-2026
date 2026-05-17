import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const go = () => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section data-testid="final-cta-section" className="relative py-32 md:py-44 px-6 md:px-10 overflow-hidden">
      {/* radial glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-[680px] h-[680px] rounded-full bg-[#00F0FF]/15 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center pf-fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00F0FF] mb-6">— The Future —</p>
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tighter text-[#E8E1D5] leading-[1.05]">
          The future of tourism<br />
          <span className="text-[#A3ADAA]">is not more travelers.</span><br />
          <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#E8E1D5] to-[#00F0FF]">It is smarter journeys.</em>
        </h2>

        <p className="mt-8 max-w-xl mx-auto text-lg text-[#A3ADAA] font-light">
          Be among the first to walk the Greece nobody else sees — quietly, mindfully, beautifully.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
          <button
            data-testid="final-cta-find-trail-btn"
            onClick={go}
            className="group inline-flex items-center gap-2 px-9 py-5 rounded-full bg-[#00F0FF] text-[#050907] font-medium text-base hover:bg-white transition-all duration-300 pf-glow-cyan"
          >
            Find Your Trail
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A3ADAA]">
            Leave no trace · Find your trail
          </span>
        </div>
      </div>
    </section>
  );
}
