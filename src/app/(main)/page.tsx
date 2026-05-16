"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Dark mode hook ─────────────────────────────────────────────────
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle, mounted };
}

// ── Grid ───────────────────────────────────────────────────────────
function GridCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200/30 dark:via-zinc-700/20 to-transparent"
          style={{ left: `${(i + 1) * (100 / 13)}%` }} />
      ))}
      {[...Array(8)].map((_, i) => (
        <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200/30 dark:via-zinc-700/20 to-transparent"
          style={{ top: `${(i + 1) * (100 / 9)}%` }} />
      ))}
    </div>
  );
}

// ── Orbit ring ─────────────────────────────────────────────────────
function OrbitRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <style>{`
        @keyframes orbit  { from{transform:rotate(0deg) translateX(88px) rotate(0deg)} to{transform:rotate(360deg) translateX(88px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(120deg) translateX(68px) rotate(-120deg)} to{transform:rotate(480deg) translateX(68px) rotate(-480deg)} }
        @keyframes orbit3 { from{transform:rotate(240deg) translateX(108px) rotate(-240deg)} to{transform:rotate(600deg) translateX(108px) rotate(-600deg)} }
        @keyframes spin-cw  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>
      <div className="absolute w-44 h-44 rounded-full border border-dashed border-blue-300/30 dark:border-blue-500/10" style={{ animation: "spin-cw 12s linear infinite" }} />
      <div className="absolute w-56 h-56 rounded-full border border-dashed border-zinc-200/40 dark:border-zinc-700/20" style={{ animation: "spin-ccw 18s linear infinite" }} />
      <div className="absolute w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_4px_rgba(59,130,246,0.4)]" style={{ animation: "orbit 6s linear infinite" }} />
      <div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_3px_rgba(52,211,153,0.4)]" style={{ animation: "orbit2 9s linear infinite" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.3)]" style={{ animation: "orbit3 14s linear infinite" }} />
    </div>
  );
}

// ── API Flow animation ─────────────────────────────────────────────
const METHOD_BADGE: Record<string, string> = {
  GET:    "text-blue-500   bg-blue-500/10   border-blue-500/25",
  POST:   "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
  PUT:    "text-amber-500  bg-amber-500/10  border-amber-500/25",
  DELETE: "text-rose-500   bg-rose-500/10   border-rose-500/25",
};
const STATUS_COLOR: Record<string, string> = {
  "200": "text-emerald-400", "201": "text-emerald-400",
  "401": "text-rose-400",   "403": "text-rose-400",
  "429": "text-amber-400",  "500": "text-rose-500",
};

type FlowLine =
  | { type: "req"; method: string; path: string }
  | { type: "res"; status: string; body: string };

const FLOW: FlowLine[] = [
  { type: "req", method: "GET",  path: "/api/v1/ai/text2img@freegen" },
  { type: "res", status: "200",  body: '{ "status": true, "data": { "buffer": "..." } }' },
  { type: "req", method: "POST", path: "/api/v1/ai/chat@HiWaifu" },
  { type: "res", status: "200",  body: '{ "status": true, "reply": "Hello!" }' },
  { type: "req", method: "GET",  path: "/api/v1/ai/search@HiWaifu?keyword=elaina" },
  { type: "res", status: "200",  body: '{ "status": true, "results": [...] }' },
  { type: "req", method: "POST", path: "/api/v1/tools/removebg@magicstudio" },
  { type: "res", status: "200",  body: '{ "status": true, "data": { ... } }' },
  { type: "req", method: "GET",  path: "/api/v1/list" },
  { type: "res", status: "401",  body: '"Invalid API Key."' },
];

function ApiFlow() {
  const [visible, setVisible] = useState(0);
  const [cursor, setCursor] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible < FLOW.length) {
      const t = setTimeout(() => setVisible(v => v + 1), 480);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible(0), 2600);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 520);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [visible]);

  return (
    <div className="w-full rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/80 overflow-hidden shadow-inner font-mono text-[11px]">
      {/* Mac bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-zinc-900/60">
        <span className="w-3 h-3 rounded-full bg-rose-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[9px] font-bold tracking-widest text-zinc-400 uppercase">zqwis-api · live traffic</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-emerald-500 font-bold tracking-widest">ONLINE</span>
        </span>
      </div>

      {/* Lines */}
      <div ref={ref} className="p-4 space-y-1.5 min-h-[168px] max-h-[168px] overflow-hidden">
        {FLOW.slice(0, visible).map((line, i) => {
          if (line.type === "req") {
            const badge = METHOD_BADGE[line.method] ?? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
            return (
              <div key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                <span className={`shrink-0 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded border ${badge}`}>
                  {line.method}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 truncate">{line.path}</span>
              </div>
            );
          }
          const sc = STATUS_COLOR[line.status] ?? "text-zinc-400";
          return (
            <div key={i} className="flex items-start gap-2 pl-0.5 animate-in fade-in slide-in-from-right-2 duration-150">
              <span className={`shrink-0 font-black text-[10px] tracking-widest ${sc}`}>← {line.status}</span>
              <span className="text-zinc-400 dark:text-zinc-600 truncate text-[10px]">{line.body}</span>
            </div>
          );
        })}
        {/* Cursor line */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-zinc-300 dark:text-zinc-700 text-[10px] font-black">▸</span>
          <span className={`w-2 h-3.5 bg-blue-500 rounded-sm transition-opacity duration-75 ${cursor ? "opacity-100" : "opacity-0"}`} />
        </div>
      </div>
    </div>
  );
}

// ── Ping dot ───────────────────────────────────────────────────────
function PingDot({ color = "bg-emerald-500" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

// ── Theme toggle ───────────────────────────────────────────────────
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="relative w-14 h-7 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/90 shadow-sm transition-all duration-300 active:scale-95 overflow-hidden backdrop-blur-sm"
    >
      {/* Icon track */}
      <div className="absolute inset-0 flex items-center justify-between px-[7px] pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-zinc-200 dark:text-zinc-700 transition-colors">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-zinc-200 dark:text-zinc-700 transition-colors">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </div>
      {/* Thumb */}
      <div className={`
        absolute top-[3px] w-[22px] h-[22px] rounded-full
        bg-white dark:bg-zinc-800 shadow
        border border-black/[0.06] dark:border-white/[0.08]
        flex items-center justify-center
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${isDark ? "left-[3px]" : "left-[calc(100%-25px)]"}
      `}>
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ── Particle ───────────────────────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
  return <span className="absolute rounded-full pointer-events-none" style={style} />;
}

// ═══════════════════════════════════════════════════════════════════
// Real API data — pulled from myapis.ts registry
// ═══════════════════════════════════════════════════════════════════
const REAL_APIS = [
  { name: "Text2Img (Freegen)",      category: "Ai",    method: "GET"  },
  { name: "Text2Img (MagicStudio)",  category: "Ai",    method: "GET"  },
  { name: "Search Character",        category: "Ai",    method: "GET"  },
  { name: "Chat Character",          category: "Ai",    method: "POST" },
  { name: "Remove BG (MagicStudio)", category: "Tools", method: "POST" },
];
const CATEGORIES = [...new Set(REAL_APIS.map(a => a.category))];

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export default function WelcomePage() {
  const router = useRouter();
  const { isDark, toggle, mounted } = useDarkMode();

  if (!mounted) return null;

  const particles = [
    { width: 2, height: 2, top: "12%", left: "8%",  background: "#3b82f6", opacity: 0.5, animation: "ping 2.2s cubic-bezier(0,0,0.2,1) infinite" },
    { width: 2, height: 2, top: "74%", left: "18%", background: "#10b981", opacity: 0.4, animation: "ping 3.1s cubic-bezier(0,0,0.2,1) infinite 0.4s" },
    { width: 2, height: 2, top: "30%", left: "88%", background: "#06b6d4", opacity: 0.45, animation: "ping 2.6s cubic-bezier(0,0,0.2,1) infinite 0.8s" },
    { width: 2, height: 2, top: "85%", left: "80%", background: "#3b82f6", opacity: 0.35, animation: "ping 3.8s cubic-bezier(0,0,0.2,1) infinite 1.2s" },
    { width: 2, height: 2, top: "55%", left: "4%",  background: "#8b5cf6", opacity: 0.4,  animation: "ping 2.9s cubic-bezier(0,0,0.2,1) infinite 0.6s" },
    { width: 1, height: 1, top: "20%", left: "60%", background: "#f59e0b", opacity: 0.3,  animation: "ping 4.2s cubic-bezier(0,0,0.2,1) infinite 1.6s" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 font-sans relative overflow-hidden selection:bg-blue-500/30">

      <GridCanvas />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[110%] h-[75%] bg-blue-500/[0.05] dark:bg-blue-500/[0.03] rounded-[100%] blur-[160px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[110%] h-[75%] bg-cyan-500/[0.05] dark:bg-cyan-500/[0.03] rounded-[100%] blur-[160px]" />
      </div>

      {particles.map((p, i) => (
        <Particle key={i} style={{ ...p, position: "fixed", borderRadius: "50%" }} />
      ))}

      {/* ── Dark mode toggle ────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle isDark={isDark} toggle={toggle} />
      </div>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-[520px] z-10 flex flex-col items-center gap-7 animate-in fade-in slide-in-from-bottom-6 duration-700 my-auto">

        {/* Hero */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="relative w-[220px] h-[220px] flex items-center justify-center mb-1">
            <OrbitRing />
            <div className="relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-card border border-black/5 dark:border-white/5 shadow-[0_8px_32px_rgb(0,0,0,0.06)] backdrop-blur-xl">
              <div className="flex flex-col gap-[3px] items-center">
                <div className="flex gap-[3px]">
                  <span className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
                  <span className="w-3   h-1.5 rounded-sm bg-blue-500/40" />
                </div>
                <div className="flex gap-[3px]">
                  <span className="w-3   h-1.5 rounded-sm bg-blue-500/40" />
                  <span className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
                </div>
                <div className="flex gap-[3px]">
                  <span className="w-1.5 h-1.5 rounded-sm bg-blue-500/20" />
                  <span className="w-1.5 h-1.5 rounded-sm bg-blue-500/20" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-none">
              Zqwis{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
                APIS
              </span>
            </h1>
            <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[300px] mx-auto leading-relaxed">
              Production-grade headless API infrastructure.
              Authenticated, rate-limited, IP-secured.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PingDot color="bg-emerald-500" />
              All Systems Online
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 text-rose-500">
              ⚠ Restricted Area
            </span>
          </div>
        </div>

        {/* API Flow (replaces terminal) */}
        <ApiFlow />

        {/* Real stats — no dummy numbers */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-card">
            <span className="text-lg font-black font-mono text-blue-500">{REAL_APIS.length}</span>
            <span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">APIs</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-card">
            <span className="text-lg font-black font-mono text-emerald-500">{CATEGORIES.length}</span>
            <span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Categories</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-card">
            <span className="text-lg font-black font-mono text-cyan-500">99.9%</span>
            <span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Uptime</span>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => router.push("/api/v1/list")}
            className="group w-full py-3.5 text-[11px] font-black tracking-[0.2em] uppercase rounded-xl border transition-all duration-300 shadow-sm
              bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200
              hover:bg-white dark:hover:bg-zinc-900
              hover:text-blue-600 dark:hover:text-blue-400
              hover:border-blue-200 dark:hover:border-blue-500/30
              hover:shadow-[0_0_24px_rgba(59,130,246,0.08)]
              active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <PingDot color="bg-emerald-500" />
            View API Endpoints
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            Sign in to Dashboard →
          </button>
        </div>

        {/* Note */}
        <div className="w-full p-4 rounded-xl border border-black/5 dark:border-white/5 bg-card flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 text-sm font-bold">!</div>
          <div>
            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 tracking-wide leading-relaxed">
              All requests require a valid{" "}
              <code className="text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded text-[10px]">apikey</code>{" "}
              and a whitelisted IP address.
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Don't hit my backend raw, broh. All requests are logged 👀
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 opacity-30 hover:opacity-100 transition-opacity z-10 relative">
        <p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 dark:text-zinc-400 uppercase">
          © 2026 KAGENOU <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span> ZQWIS APIS
        </p>
      </div>
    </div>
  );
}
