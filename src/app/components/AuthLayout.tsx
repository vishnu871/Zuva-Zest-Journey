import { ReactNode } from "react";
import { Sparkles, Sprout } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel — Rich Branding ── */}
      <div className="w-full lg:w-[42%] relative overflow-hidden min-h-[280px] lg:min-h-screen">
        {/* Deep gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg,
              #2E0B45 0%,
              #4A1C5C 25%,
              #3D6D6C 55%,
              #4A1C5C 75%,
              #AA5D53 100%
            )`,
          }}
        />

        {/* Animated shimmer overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 15% 40%, rgba(212,168,67,0.18) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 70%, rgba(61,109,108,0.20) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 0%, rgba(74,28,92,0.30) 0%, transparent 60%)
            `,
          }}
        />

        {/* Floating animated seeds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Seed 1 */}
          <svg
            className="absolute opacity-25"
            style={{ top: "12%", right: "15%", animation: "floatSeed1 8s ease-in-out infinite" }}
            width="48" height="48" viewBox="0 0 48 48"
          >
            <g stroke="white" strokeWidth="0.8" fill="none">
              <line x1="24" y1="24" x2="24" y2="4" /><circle cx="24" cy="4" r="2.5" fill="white" />
              <line x1="24" y1="24" x2="38" y2="10" /><circle cx="38" cy="10" r="2.5" fill="white" />
              <line x1="24" y1="24" x2="44" y2="24" /><circle cx="44" cy="24" r="2.5" fill="white" />
              <line x1="24" y1="24" x2="10" y2="10" /><circle cx="10" cy="10" r="2.5" fill="white" />
              <line x1="24" y1="24" x2="4" y2="24" /><circle cx="4" cy="24" r="2.5" fill="white" />
            </g>
          </svg>

          {/* Seed 2 */}
          <svg
            className="absolute opacity-15"
            style={{ bottom: "25%", left: "12%", animation: "floatSeed2 11s ease-in-out infinite" }}
            width="36" height="36" viewBox="0 0 36 36"
          >
            <g stroke="white" strokeWidth="0.7" fill="none">
              <line x1="18" y1="18" x2="18" y2="4" /><circle cx="18" cy="4" r="2" fill="white" />
              <line x1="18" y1="18" x2="28" y2="8" /><circle cx="28" cy="8" r="2" fill="white" />
              <line x1="18" y1="18" x2="8" y2="8" /><circle cx="8" cy="8" r="2" fill="white" />
            </g>
          </svg>

          {/* Seed 3 */}
          <svg
            className="absolute opacity-20"
            style={{ top: "60%", right: "8%", animation: "floatSeed3 13s ease-in-out infinite" }}
            width="30" height="30" viewBox="0 0 30 30"
          >
            <g stroke="rgba(212,168,67,0.8)" strokeWidth="0.7" fill="none">
              <line x1="15" y1="15" x2="15" y2="3" /><circle cx="15" cy="3" r="1.8" fill="rgba(212,168,67,0.8)" />
              <line x1="15" y1="15" x2="24" y2="6" /><circle cx="24" cy="6" r="1.8" fill="rgba(212,168,67,0.8)" />
              <line x1="15" y1="15" x2="6" y2="6" /><circle cx="6" cy="6" r="1.8" fill="rgba(212,168,67,0.8)" />
              <line x1="15" y1="15" x2="27" y2="15" /><circle cx="27" cy="15" r="1.8" fill="rgba(212,168,67,0.8)" />
            </g>
          </svg>

          {/* Tree ring rings */}
          <div className="absolute bottom-12 right-6 opacity-10 lg:opacity-15">
            <svg viewBox="0 0 100 100" width="120" height="120">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(212,168,67,0.5)" strokeWidth="1" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(212,168,67,0.6)" strokeWidth="1" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(212,168,67,0.7)" strokeWidth="1" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(212,168,67,0.8)" strokeWidth="1" />
              <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(212,168,67,0.9)" strokeWidth="1" />
              <circle cx="50" cy="50" r="6" fill="none" stroke="rgba(212,168,67,1)" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-6 lg:p-12 text-white h-full w-full lg:min-h-screen">
          {/* Logo and Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#D4A843] flex items-center justify-center shadow-lg shadow-[#D4A843]/30">
                <Sprout className="w-6 h-6 text-[#2C1810]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                  Zuva Life
                </h2>
                <p className="text-xs text-white/70 tracking-wider uppercase">Zest Journey</p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-5 py-8 lg:py-0">
            {/* Accent line */}
            <div className="w-12 h-1 rounded-full bg-[#D4A843]" />
            <h1
              className="text-3xl lg:text-5xl xl:text-6xl leading-[1.15] text-white"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Your Journey of<br />
              <span className="text-[#D4A843]">Reinvention</span><br />
              Begins
            </h1>
            <p className="text-base lg:text-lg text-white/80 max-w-xs lg:max-w-sm leading-relaxed">
              Navigate life's transitions with clarity, purpose, and renewed zest.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["Guided Reflection", "Personal Growth", "Life Design"].map((pill) => (
                <span
                  key={pill}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/75 backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Footer Message */}
          <div className="hidden lg:block space-y-3">
            <div className="w-full h-px bg-white/10" />
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="w-4 h-4 text-[#D4A843] flex-shrink-0" />
              <p className="text-sm">Guided reflection for life's next chapter</p>
            </div>
            <p className="text-xs text-white/40">
              Premium coaching experience for adults navigating meaningful transitions
            </p>
          </div>
        </div>

        {/* CSS animations injected inline */}
        <style>{`
          @keyframes floatSeed1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-8px, -12px) rotate(5deg); }
            66% { transform: translate(6px, -8px) rotate(-3deg); }
          }
          @keyframes floatSeed2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            40% { transform: translate(10px, -10px) rotate(-6deg); }
            70% { transform: translate(-5px, -15px) rotate(4deg); }
          }
          @keyframes floatSeed3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            35% { transform: translate(-10px, 8px) rotate(8deg); }
            70% { transform: translate(8px, -6px) rotate(-5deg); }
          }
        `}</style>
      </div>

      {/* ── Right Panel — Auth Form ── */}
      <div
        className="flex-1 lg:w-[58%] flex items-center justify-center p-6 lg:p-12 relative"
        style={{
          background: `
            radial-gradient(ellipse at 0% 0%, rgba(74,28,92,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(61,109,108,0.04) 0%, transparent 50%),
            #F8F4F0
          `,
        }}
      >
        {/* Subtle dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(74,28,92,0.15) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Form card */}
        <div
          className="relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(74,28,92,0.10)",
            boxShadow: "0 8px 40px rgba(74,28,92,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
