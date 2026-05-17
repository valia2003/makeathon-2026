import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="footer" className="relative border-t border-white/5 py-12 px-6 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-[#00F0FF]" />
          <span className="font-display text-base text-[#E8E1D5]">path<span className="text-[#00F0FF]">finder</span></span>
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A3ADAA]">Find your trail. Leave no trace.</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A3ADAA]">
          <a href="#problem" className="hover:text-[#E8E1D5] transition-colors">Manifesto</a>
          <a href="#how" className="hover:text-[#E8E1D5] transition-colors">How it works</a>
          <a href="#chat" className="hover:text-[#E8E1D5] transition-colors">AI Companion</a>
          <a href="#impact" className="hover:text-[#E8E1D5] transition-colors">Impact</a>
          <span className="text-[#A3ADAA]/60">© 2026 Pathfinder · Athens · Greece</span>
        </div>
      </div>
    </footer>
  );
}
