"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

function Particle({ style }: { style: React.CSSProperties }) {
return (
<span
className="absolute rounded-full pointer-events-none"
style={style}
/>
);
}
{/*==============*/}
function GridCanvas() {
return (
<div className="absolute inset-0 overflow-hidden pointer-events-none">
{[...Array(12)].map((_, i) => (
<div
key={`v${i}`}
className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200/30 dark:via-zinc-700/20 to-transparent"
style={{ left: `${(i + 1) * (100 / 13)}%` }}
/>
))}
{[...Array(8)].map((_, i) => (
<div
key={`h${i}`}
className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200/30 dark:via-zinc-700/20 to-transparent"
style={{ top: `${(i + 1) * (100 / 9)}%` }}
/>
))}
</div>
);
}
{/*==============*/}
const LINES = [
{ prefix: "GET", text: "/api/v1/ai/text2img@freegen", color: "text-blue-500" },
{ prefix: "POST", text: "/api/v1/tools/removebg", color: "text-emerald-500" },
{ prefix: "200", text: '{ "status": true, "creator": "@Zqwis-Apis" }', color: "text-zinc-400 dark:text-zinc-500" },
{ prefix: "GET", text: "/api/v1/ai/text2img@magicstudio", color: "text-blue-500" },
{ prefix: "200", text: '{ "status": true, "data": { "buffer": "..." } }', color: "text-zinc-400 dark:text-zinc-500" },
{ prefix: "401", text: "Invalid API Key.", color: "text-rose-500" },
{ prefix: "GET", text: "/api/v1/list", color: "text-blue-500" },
{ prefix: "200", text: "[{ name: ... }, { name: ... }]", color: "text-zinc-400 dark:text-zinc-500" },
];
{/*==============*/}
function Terminal() {
const [visibleLines, setVisibleLines] = useState(0);
const [cursor, setCursor] = useState(true);
useEffect(() => {
if (visibleLines < LINES.length) {
const t = setTimeout(() => setVisibleLines((v) => v + 1), 520);
return () => clearTimeout(t);
} else {
const t = setTimeout(() => setVisibleLines(0), 2400);
return () => clearTimeout(t);
}
}, [visibleLines]);
useEffect(() => {
const t = setInterval(() => setCursor((c) => !c), 530);
return () => clearInterval(t);
}, []);
{/*==============*/}
const prefixColor = (p: string) => {
if (p === "GET") return "text-blue-500";
if (p === "POST") return "text-emerald-500";
if (p === "200") return "text-emerald-400";
if (p === "401" || p === "403") return "text-rose-500";
return "text-zinc-400";
};
{/*==============*/}
return (
<div className="w-full rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/80 overflow-hidden shadow-inner font-mono text-[11px]">
<div className="flex items-center gap-2 px-4 py-3 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50">
<span className="w-3 h-3 rounded-full bg-rose-400" />
<span className="w-3 h-3 rounded-full bg-amber-400" />
<span className="w-3 h-3 rounded-full bg-emerald-400" />
<span className="ml-3 text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
zqwis-api — live
</span>
<span className="ml-auto flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
<span className="text-[9px] text-emerald-500 font-bold tracking-widest">ONLINE</span>
</span>
</div>
<div className="p-4 space-y-2 min-h-[160px]">
{LINES.slice(0, visibleLines).map((line, i) => (
<div
key={i}
className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-200"
>
<span className={`shrink-0 font-black text-[10px] tracking-widest w-10 ${prefixColor(line.prefix)}`}>
{line.prefix}
</span>
<span className={`${line.color} break-all leading-relaxed`}>{line.text}</span>
</div>
))}
<div className="flex items-center gap-3">
<span className="shrink-0 text-zinc-300 dark:text-zinc-700 font-black text-[10px] w-10">$</span>
<span
className={`w-2 h-4 bg-blue-500 rounded-sm transition-opacity duration-75 ${cursor ? "opacity-100" : "opacity-0"}`}
/>
</div>
</div>
</div>
);
}
{/*==============*/}
function StatBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
return (
<div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-card">
<span className={`text-lg font-black font-mono ${accent}`}>{value}</span>
<span className="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase">{label}</span>
</div>
);
}
{/*==============*/}
function PingDot({ color = "bg-emerald-500" }: { color?: string }) {
return (
<span className="relative flex h-2.5 w-2.5 shrink-0">
<span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
<span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
</span>
);
}
{/*==============*/}
function OrbitRing() {
return (
<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
<style>{`
@keyframes orbit {
from { transform: rotate(0deg) translateX(88px) rotate(0deg); }
to { transform: rotate(360deg) translateX(88px) rotate(-360deg); }
}
@keyframes orbit2 {
from { transform: rotate(120deg) translateX(68px) rotate(-120deg); }
to { transform: rotate(480deg) translateX(68px) rotate(-480deg); }
}
@keyframes orbit3 {
from { transform: rotate(240deg) translateX(108px) rotate(-240deg); }
to { transform: rotate(600deg) translateX(108px) rotate(-600deg); }
}
@keyframes spin-ring {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}
@keyframes spin-ring-rev {
from { transform: rotate(0deg); }
to { transform: rotate(-360deg); }
}
`}</style>
<div className="absolute w-44 h-44 rounded-full border border-dashed border-blue-300/30 dark:border-blue-500/10"
 style={{ animation: "spin-ring 12s linear infinite" }} />
<div className="absolute w-56 h-56 rounded-full border border-dashed border-zinc-200/40 dark:border-zinc-700/20"
 style={{ animation: "spin-ring-rev 18s linear infinite" }} />
<div className="absolute w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_4px_rgba(59,130,246,0.4)]"
 style={{ animation: "orbit 6s linear infinite" }} />
<div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_3px_rgba(52,211,153,0.4)]"
 style={{ animation: "orbit2 9s linear infinite" }} />
<div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.3)]"
 style={{ animation: "orbit3 14s linear infinite" }} />
</div>
);
}
{/*==============*/}
export default function WelcomePage() {
const router = useRouter();
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null;
const particles = [
{ width: 2, height: 2, top: "12%", left: "8%",background: "#3b82f6", opacity: 0.5, animation: "ping 2.2s cubic-bezier(0,0,0.2,1) infinite" },
{ width: 2, height: 2, top: "74%", left: "18%", background: "#10b981", opacity: 0.4, animation: "ping 3.1s cubic-bezier(0,0,0.2,1) infinite 0.4s" },
{ width: 2, height: 2, top: "30%", left: "88%", background: "#06b6d4", opacity: 0.45, animation: "ping 2.6s cubic-bezier(0,0,0.2,1) infinite 0.8s" },
{ width: 2, height: 2, top: "85%", left: "80%", background: "#3b82f6", opacity: 0.35, animation: "ping 3.8s cubic-bezier(0,0,0.2,1) infinite 1.2s" },
{ width: 2, height: 2, top: "55%", left: "4%",background: "#8b5cf6", opacity: 0.4, animation: "ping 2.9s cubic-bezier(0,0,0.2,1) infinite 0.6s" },
{ width: 1, height: 1, top: "20%", left: "60%", background: "#f59e0b", opacity: 0.3, animation: "ping 4.2s cubic-bezier(0,0,0.2,1) infinite 1.6s" },
];
{/*==============*/}
return (
<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 font-sans relative overflow-hidden selection:bg-blue-500/30">
{/*==============*/}
<GridCanvas />
{/*==============*/}
<div className="fixed inset-0 pointer-events-none -z-10">
<div className="absolute -top-[20%] -left-[10%] w-[110%] h-[75%] bg-blue-500/[0.05] dark:bg-blue-500/[0.03] rounded-[100%] blur-[160px]" />
<div className="absolute -bottom-[20%] -right-[10%] w-[110%] h-[75%] bg-cyan-500/[0.05] dark:bg-cyan-500/[0.03] rounded-[100%] blur-[160px]" />
</div>
{/*==============*/}
{particles.map((p, i) => (
<Particle key={i} style={{ ...p, position: "fixed", borderRadius: "50%" }} />
))}
{/*==============*/}
<div className="w-full max-w-[520px] z-10 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 my-auto">
{/*==============*/}
<div className="text-center flex flex-col items-center gap-4">
{/*==============*/}
<div className="relative w-[220px] h-[220px] flex items-center justify-center mb-2">
<OrbitRing />
{/*==============*/}
<div className="relative z-10 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-card border border-black/5 dark:border-white/5 shadow-[0_8px_32px_rgb(0,0,0,0.06)] backdrop-blur-xl">
{/*==============*/}
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
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500/40" />
<span className="w-1.5 h-1.5 rounded-sm bg-blue-500/40" />
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
{/*==============*/}
<div className="flex flex-wrap items-center justify-center gap-2 mt-1">
<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
<PingDot color="bg-emerald-500" />
All Systems Online
</span>
<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 text-rose-500">
⚠ Restricted Area
</span>
</div>
</div>
{/*==============*/}
<Terminal />
{/*==============*/}
<div className="w-full grid grid-cols-3 gap-3">
<StatBadge label="APIs" value="99+" accent="text-blue-500" />
<StatBadge label="Uptime" value="99.9%" accent="text-emerald-500" />
<StatBadge label="Latency" value="~20ms" accent="text-cyan-500" />
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
<svg
xmlns="http://www.w3.org/2000/svg"
width="13" height="13"
viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
>
<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
</svg>
</button>
</div>
{/*==============*/}
<div className="w-full p-4 rounded-xl border border-black/5 dark:border-white/5 bg-card flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 text-sm font-bold">!</div>
<div>
<p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 tracking-wide leading-relaxed">
All API requests require a valid <code className="text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded text-[10px]">apikey</code> parameter and a whitelisted IP address.
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