import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-gray-200 flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* ───────────────── Liquid Green Glass Header (FULL STRIP) ───────────────── */}
        <header
          className="
            sticky top-0 z-40
            h-20
            flex items-center
            overflow-hidden

            border-b border-white/6
            glass
          "
          aria-label="Webloom header"
        >
          {/* Decorative layered surfaces (purely visual) */}
          {/* Layer 1: heavy neon tint + depth (full header volume) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              // Use your neon token (#32FFC3) with careful stops
              background:
                "linear-gradient(180deg, rgb(15, 15, 16) 0%, rgba(0, 0, 0, 0.45) 22%, rgba(0, 0, 0, 0.52) 45%, rgba(10, 12, 11, 0.77) 60%, rgba(2, 2, 2, 0.72) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(3, 2, 2, 0.69), inset 0 -10px 30px rgba(0,0,0,0.45), 0 8px 40px rgba(2,6,23,0.6)",
              backdropFilter: "blur(14px)",
            }}
          />

          {/* Layer 2: wide neon glass spine — thicker and softer (the 'green glass' look) */}
          <div
            className="pointer-events-none absolute left-6 right-6 top-3 bottom-3 rounded-[10px]"
            style={{
              background:
                "linear-gradient(90deg, rgb(5, 6, 6) 0%, rgba(0, 0, 0, 0.18) 20%, rgba(10, 11, 11, 0.28) 50%, rgba(2, 28, 20, 0.18) 80%, rgba(50,255,195,0.06) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(7, 245, 217, 0.61), inset 0 -8px 20px rgba(0,0,0,0.35), 0 6px 30px rgba(50,255,195,0.12)",
              border: "1px solid rgba(10, 237, 234, 0.96)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            }}
          />

          {/* Layer 3: subtle top & bottom highlight lines to give thickness */}
          <div
            className="pointer-events-none absolute left-6 right-6 top-3 h-[2px] rounded-t-md"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(5, 76, 57, 0.07), transparent)",
              opacity: 0.95,
            }}
          />
          <div
            className="pointer-events-none absolute left-6 right-6 bottom-3 h-[2px] rounded-b-md"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.25), transparent)",
              opacity: 0.8,
            }}
          />

          {/* Layer 4: animated sheen for 'liquid' movement (VERY subtle) */}
          <div
            className="pointer-events-none absolute left-6 right-6 top-3 bottom-3 rounded-[10px] overflow-hidden"
            style={{
              mixBlendMode: "screen",
            }}
          >
            <div
              className="absolute inset-0 opacity-30 animate-sheen"
              style={{
                background:
                  "radial-gradient(60% 40% at 10% 20%, rgba(255,255,255,0.12), transparent 20%, rgba(50,255,195,0.06) 45%, transparent 60%)",
                transform: "translateX(-30%)",
              }}
            />
          </div>

          {/* Layer 5: micro grain for material feel */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.04]"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.55\"/></svg>')",
            }}
          />

          {/* Content wrapper ensures brand sits inside the glass area (framed) */}
          <div className="relative w-full px-8">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between h-14">
              {/* Left: Brand framed inside the liquid glass */}
              <div className="flex items-center gap-4">
                {/* Vertical brand pill — heavier, neon matching */}
                <span
                  className="rounded-pill"
                  style={{
                    width: 10,
                    height: 34,
                    display: "inline-block",
                    background: "linear-gradient(180deg,rgb(52, 220, 175), rgba(50,255,195,0.6))",
                    boxShadow: "0 0 22px rgba(16, 214, 158, 0.12)",
                    borderRadius: 9999,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                />

                <div className="flex flex-col leading-tight gap-1">
                  <span className="text-[25px] text-sm font-semibold tracking-[0.18em] uppercase text-white">
                    WEBLOOM
                  </span>
                  <span className="text-[15px] tracking-wider text-muted-1 ">
                    Live Web Change Intelligence
                  </span>
                </div>
              </div>

              {/* Right: phase meta (kept subtle) */}
             
            </div>
          </div>

          {/* Sheen animation CSS */}
          <style>{`
            @keyframes sheenMove {
              0% { transform: translateX(-40%) translateY(-4%); opacity: 0.28; }
              50% { transform: translateX(40%) translateY(4%); opacity: 0.34; }
              100% { transform: translateX(-40%) translateY(-4%); opacity: 0.28; }
            }
            .animate-sheen {
              animation: sheenMove 18s linear infinite;
              will-change: transform, opacity;
            }

            /* small accessibility friendly reduction for motion preference */
            @media (prefers-reduced-motion: reduce) {
              .animate-sheen { animation: none; opacity: 0.18 !important; transform: none !important; }
            }
          `}</style>
        </header>

        {/* ───────────────── Main Content ───────────────── */}
        {/* 🔧 FIX 1: disable page scroll here */}
        <main className="flex-1 overflow-hidden px-10 py-8">
          {/* 🔧 FIX 2: give child full height */}
          <div className="max-w-[1600px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
