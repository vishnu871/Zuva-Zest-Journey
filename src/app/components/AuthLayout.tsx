import { ReactNode } from "react";
import { Sparkles, Sprout } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding Section (40% on desktop, full width on mobile) */}
      <div className="w-full lg:w-[40%] relative overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, 
                #4A1C5C 0%, 
                #5A2C6C 25%, 
                #3D6D6C 50%, 
                #4A1C5C 75%, 
                #AA5D53 100%
              )
            `
          }}
        />
        
        {/* Decorative Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212, 168, 67, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(61, 109, 108, 0.3) 0%, transparent 50%)`
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-6 lg:p-12 text-white w-full lg:min-h-screen">
          {/* Logo and Brand */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#D4A843] flex items-center justify-center">
                <Sprout className="w-7 h-7 text-[#4A1C5C]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Zuva Life
                </h2>
                <p className="text-sm text-white/80">Zest Journey</p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-3 lg:space-y-4">
              <h1
                className="text-3xl lg:text-5xl leading-tight text-white"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Your Journey of
                <br />
                Reinvention Begins
              </h1>
              <p className="text-base lg:text-lg text-white/90 max-w-md">
                Navigate life's transitions with clarity, purpose, and renewed zest.
              </p>
            </div>

            {/* Tree Ring Decorative Element */}
            <div className="relative w-24 h-24 lg:w-32 lg:h-32 opacity-60">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 168, 67, 0.3)" strokeWidth="1"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(212, 168, 67, 0.4)" strokeWidth="1"/>
                <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(212, 168, 67, 0.5)" strokeWidth="1"/>
                <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(212, 168, 67, 0.6)" strokeWidth="1"/>
                <circle cx="50" cy="50" r="17" fill="none" stroke="rgba(212, 168, 67, 0.7)" strokeWidth="1"/>
                <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(212, 168, 67, 0.8)" strokeWidth="1"/>
              </svg>
            </div>
          </div>

          {/* Footer Message */}
          <div className="space-y-3 hidden lg:block">
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="w-5 h-5 text-[#D4A843]" />
              <p className="text-sm">
                Guided reflection for life's next chapter
              </p>
            </div>
            <p className="text-xs text-white/60">
              Premium coaching experience for adults navigating meaningful transitions
            </p>
          </div>
        </div>

        {/* Dandelion Seeds Decorative Elements */}
        <div className="absolute top-20 right-10 opacity-20">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <g>
              <line x1="30" y1="30" x2="30" y2="5" stroke="white" strokeWidth="0.5"/>
              <circle cx="30" cy="5" r="2" fill="white"/>
              <line x1="30" y1="30" x2="45" y2="15" stroke="white" strokeWidth="0.5"/>
              <circle cx="45" cy="15" r="2" fill="white"/>
              <line x1="30" y1="30" x2="50" y2="30" stroke="white" strokeWidth="0.5"/>
              <circle cx="50" cy="30" r="2" fill="white"/>
              <line x1="30" y1="30" x2="15" y2="15" stroke="white" strokeWidth="0.5"/>
              <circle cx="15" cy="15" r="2" fill="white"/>
            </g>
          </svg>
        </div>
        
        <div className="absolute bottom-40 left-20 opacity-15">
          <svg width="50" height="50" viewBox="0 0 50 50">
            <g>
              <line x1="25" y1="25" x2="25" y2="5" stroke="white" strokeWidth="0.5"/>
              <circle cx="25" cy="5" r="1.5" fill="white"/>
              <line x1="25" y1="25" x2="40" y2="10" stroke="white" strokeWidth="0.5"/>
              <circle cx="40" cy="10" r="1.5" fill="white"/>
              <line x1="25" y1="25" x2="10" y2="10" stroke="white" strokeWidth="0.5"/>
              <circle cx="10" cy="10" r="1.5" fill="white"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Right Panel - Authentication Form (60% on desktop, full width on mobile) */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
