import { useEffect, useState } from "react";
import { Compass, Menu, X } from "lucide-react";

const links = [
  { id: "problem", label: "The Problem" },
  { id: "how", label: "How It Works" },
  { id: "chat", label: "AI Companion" },
  { id: "itinerary", label: "Itinerary" },
  { id: "impact", label: "Impact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3 backdrop-blur-xl bg-[#050907]/70 border-b border-white/5" : "py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <button
          data-testid="navbar-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 group"
        >
          <div className="relative">
            <Compass size={22} className="text-[#00F0FF] group-hover:rotate-45 transition-transform duration-500" />
            <div className="absolute inset-0 blur-md bg-[#00F0FF]/40 -z-10" />
          </div>
          <span className="font-display text-lg tracking-tight text-[#E8E1D5]">
            path<span className="text-[#00F0FF]">finder</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              data-testid={`nav-link-${l.id}`}
              onClick={() => go(l.id)}
              className="px-4 py-2 text-sm text-[#A3ADAA] hover:text-[#E8E1D5] transition-colors"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex">
          <button
            data-testid="navbar-cta-btn"
            onClick={() => go("chat")}
            className="text-xs font-mono uppercase tracking-[0.18em] px-5 py-2.5 rounded-full border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#050907] transition-all duration-300"
          >
            Start Journey
          </button>
        </div>

        <button
          data-testid="navbar-mobile-toggle"
          className="md:hidden text-[#E8E1D5]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-3 mx-4 rounded-2xl pf-glass p-4 flex flex-col gap-1" data-testid="navbar-mobile-menu">
          {links.map((l) => (
            <button
              key={l.id}
              data-testid={`nav-mobile-${l.id}`}
              onClick={() => go(l.id)}
              className="text-left px-3 py-2 text-sm text-[#E8E1D5] hover:bg-white/5 rounded-lg"
            >
              {l.label}
            </button>
          ))}
          <button
            data-testid="navbar-mobile-cta"
            onClick={() => go("chat")}
            className="mt-2 text-xs font-mono uppercase tracking-[0.18em] px-5 py-2.5 rounded-full bg-[#00F0FF] text-[#050907]"
          >
            Start Journey
          </button>
        </div>
      )}
    </header>
  );
}
