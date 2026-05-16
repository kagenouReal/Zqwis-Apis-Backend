"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function useStats() {
const [stats, setStats] = useState({
total: 0,
success: 0,
failed: 0,
apis: 0,
categories: 0,
lastCrash: "SECURE"
});
useEffect(() => {
fetch('/api/stats')
.then(res => res.json())
.then(data => {
let crashText = "SECURE";
if (data.lastCrash) {
const date = new Date(data.lastCrash);
crashText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

setStats(prev => ({
...prev,
total: data.total || 0,
success: data.success || 0,
failed: data.failed || 0,
lastCrash: crashText
}));
})
.catch(() => console.error("Failed to fetch traffic stats"));
fetch('/api/v1/list')
.then(res => res.json())
.then(data => {
if (Array.isArray(data)) {
const uniqueCategories = new Set(data.map((item: any) => item.category)).size;
setStats(prev => ({
...prev,
apis: data.length,
categories: uniqueCategories
}));
}
})
.catch(() => console.error("Failed to fetch API list"));
}, []);

return stats;
}
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
function OrbitRing() {
return (
<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
<style>{`
@keyframes orbit{ from{transform:rotate(0deg) translateX(88px) rotate(0deg)} to{transform:rotate(360deg) translateX(88px) rotate(-360deg)} }
@keyframes orbit2 { from{transform:rotate(120deg) translateX(68px) rotate(-120deg)} to{transform:rotate(480deg) translateX(68px) rotate(-480deg)} }
@keyframes orbit3 { from{transform:rotate(240deg) translateX(108px) rotate(-240deg)} to{transform:rotate(600deg) translateX(108px) rotate(-600deg)} }
@keyframes spin-cw{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
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
function LiveTrafficGraph() {
const [bars, setBars] = useState<number[]>(Array(24).fill(10));
useEffect(() => {
const interval = setInterval(() => {
setBars(prev => prev.map(() => 15 + Math.random() * 85));
}, 600);
return () => clearInterval(interval);
}, []);
return (
<div className="w-full rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col">
<div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-zinc-900/60">
<div className="flex items-center gap-2">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
</span>
<span className="text-[9px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">
NETWORK TRAFFIC
</span>
</div>
<span className="text-[9px] font-mono font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
LIVE
</span>
</div>
<div className="relative h-[120px] w-full p-4 flex items-end justify-between gap-1">
<div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none" />
{bars.map((height, i) => (
<div key={i} className="relative w-full flex justify-center group h-full items-end">
<div 
style={{ height: `${height}%` }}
className="w-full max-w-[8px] bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-blue-500 dark:to-cyan-300 rounded-t-sm transition-all duration-[600ms] ease-out opacity-80 group-hover:opacity-100"
/>
</div>
))}
<div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-4 opacity-20 dark:opacity-30">
<div className="w-full h-px border-t border-dashed border-zinc-400 dark:border-zinc-500" />
<div className="w-full h-px border-t border-dashed border-zinc-400 dark:border-zinc-500" />
<div className="w-full h-px border-t border-dashed border-zinc-400 dark:border-zinc-500" />
</div>
</div>
</div>
);
}
function PingDot({ color = "bg-emerald-500" }: { color?: string }) {
return (
<span className="relative flex h-2.5 w-2.5 shrink-0">
<span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
<span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
</span>
);
}
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
return (
<button
onClick={toggle}
aria-label="Toggle dark mode"
className="relative w-14 h-7 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-900/90 shadow-sm transition-all duration-300 active:scale-95 overflow-hidden backdrop-blur-sm"
>
<div className="absolute inset-0 flex items-center justify-between px-[7px] pointer-events-none">
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-200 dark:text-zinc-700 transition-colors">
<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-200 dark:text-zinc-700 transition-colors">
<circle cx="12" cy="12" r="4"/>
<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
</svg>
</div>
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
function Particle({ style }: { style: React.CSSProperties }) {
return <span className="absolute rounded-full pointer-events-none" style={style} />;
}
export default function WelcomePage() {
const router = useRouter();
const { isDark, toggle, mounted } = useDarkMode();
const apiStats = useStats();
if (!mounted) return null;
const particles = [
{ width: 2, height: 2, top: "12%", left: "8%",background: "#3b82f6", opacity: 0.5, animation: "ping 2.2s cubic-bezier(0,0,0.2,1) infinite" },
{ width: 2, height: 2, top: "74%", left: "18%", background: "#10b981", opacity: 0.4, animation: "ping 3.1s cubic-bezier(0,0,0.2,1) infinite 0.4s" },
{ width: 2, height: 2, top: "30%", left: "88%", background: "#06b6d4", opacity: 0.45, animation: "ping 2.6s cubic-bezier(0,0,0.2,1) infinite 0.8s" },
{ width: 2, height: 2, top: "85%", left: "80%", background: "#3b82f6", opacity: 0.35, animation: "ping 3.8s cubic-bezier(0,0,0.2,1) infinite 1.2s" },
{ width: 2, height: 2, top: "55%", left: "4%",background: "#8b5cf6", opacity: 0.4,animation: "ping 2.9s cubic-bezier(0,0,0.2,1) infinite 0.6s" },
{ width: 1, height: 1, top: "20%", left: "60%", background: "#f59e0b", opacity: 0.3,animation: "ping 4.2s cubic-bezier(0,0,0.2,1) infinite 1.6s" },
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
{/*==============*/}
<div className="fixed top-4 right-4 z-50">
<ThemeToggle isDark={isDark} toggle={toggle} />
</div>
{/*==============*/}
<div className="w-full max-w-[520px] z-10 flex flex-col items-center gap-7 animate-in fade-in slide-in-from-bottom-6 duration-700 my-auto">
<div className="text-center flex flex-col items-center gap-4">
<div className="relative w-[220px] h-[220px] flex items-center justify-center mb-1">
<OrbitRing />
<div className="relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-card border border-black/5 dark:border-white/5 shadow-[0_8px_32px_rgb(0,0,0,0.06)] backdrop-blur-xl">
<div className="flex flex-col gap-[3px] items-center">
<div className="flex gap-[3px]">
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
<span className="w-3 h-1.5 rounded-sm bg-blue-500/40" />
</div>
<div className="flex gap-[3px]">
<span className="w-3 h-1.5 rounded-sm bg-blue-500/40" />
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
</div>
<div className="flex gap-[3px]">
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500/20" />
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500/20" />
</div>
</div>
</div>
</div>
{/*==============*/}
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
<LiveTrafficGraph />
{/*==============*/}
<div className="w-full grid grid-cols-3 gap-3">
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-blue-500/30 transition-colors">
<span className="text-xl font-black font-mono text-blue-500">{apiStats.total.toLocaleString()}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Total Req</span>
</div>
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-emerald-500/30 transition-colors">
<span className="text-xl font-black font-mono text-emerald-500">{apiStats.success.toLocaleString()}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Success</span>
</div>
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-rose-500/30 transition-colors">
<span className="text-xl font-black font-mono text-rose-500">{apiStats.failed.toLocaleString()}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Failed</span>
</div>
{/*==============*/}
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-purple-500/30 transition-colors">
<span className="text-xl font-black font-mono text-purple-500">{apiStats.apis}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Total APIs</span>
</div>
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-amber-500/30 transition-colors">
<span className="text-xl font-black font-mono text-amber-500">{apiStats.categories}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Categories</span>
</div>
<div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-card hover:border-zinc-500/30 transition-colors">
<span className={`text-sm md:text-base font-black font-mono mt-1 ${apiStats.lastCrash === "SECURE" ? "text-emerald-500" : "text-rose-500"}`}>{apiStats.lastCrash}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center mt-1">Last Crash</span>
</div>
</div>
{/*==============*/}
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
</div>
{/*==============*/}
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
{/*==============*/}
<div className="text-center py-8 opacity-30 hover:opacity-100 transition-opacity z-10 relative">
<p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 dark:text-zinc-400 uppercase">
© 2026 KAGENOU <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span> ZQWIS APIS
</p>
</div>
</div>
);
}
