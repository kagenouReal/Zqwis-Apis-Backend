"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
const [isDark, setIsDark] = useState(false);
const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, lastCrash: null });
useEffect(() => {
const loadStats = async () => {
try {
const res = await fetch("/api/stats", {
cache: 'no-store' 
});
if (res.ok) {
const data = await res.json();
setStats(data);
}
} catch (err) {
}
};
loadStats(); 
}, []);
useEffect(() => {
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
document.documentElement.classList.toggle("dark", savedTheme === "dark");
setIsDark(savedTheme === "dark");
} else {
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", systemDark);
setIsDark(systemDark);
}
}, []);
const formatTime = (iso: string | null) => {
if (!iso) return "STABLE";
const d = new Date(iso);
return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};
const ratio = stats.total === 0 ? 100 : ((stats.success / stats.total) * 100).toFixed(1);
return (
<>
{/*==============*/}
<div className="relative group overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 bg-card backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all flex flex-col md:flex-row items-center gap-5 p-5 sm:p-6">
<div className="relative w-full md:w-64 h-40 md:h-36 bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 shadow-sm group-hover:shadow-md transition-all">
<img
src="/api/assets/Mmarika.jpg"
alt="Banner"
className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
/>
<div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
</div>
<div className="text-center md:text-left w-full space-y-2.5">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
<span className="relative flex h-2 w-2 shrink-0">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
</span>
System Active
</div>
<h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
Zqwis
<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
Apis
</span>
</h2>
<p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-md">
kage nyscrep web ampe keluat mani.
</p>
</div>
</div>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase mb-4 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1 h-1 rounded-full bg-blue-500"></span> Live Metrics
</h3>
<div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
<div className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-card hover:bg-white dark:hover:bg-zinc-900 shadow-sm transition-all group">
<div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">⊞</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Total</span>
<span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100 leading-none mt-0.5">{stats.total}</span>
</div>
</div>
<div className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 shadow-sm transition-all group">
<div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">✓</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Success</span>
<span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{stats.success}</span>
</div>
</div>
<div className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-rose-50 dark:hover:bg-rose-500/5 shadow-sm transition-all group">
<div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">✕</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Failed</span>
<span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-none mt-0.5">{stats.failed}</span>
</div>
</div>
<div className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 shadow-sm transition-all group">
<div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">◷</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Crash</span>
<span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400 leading-none mt-0.5">{formatTime(stats.lastCrash)}</span>
</div>
</div>
</div>
<div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
<div className="flex justify-between items-center mb-2 gap-2">
<span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">System Health</span>
<span className="font-mono text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md shrink-0 border border-blue-200/50 dark:border-blue-500/20">{ratio}%</span>
</div>
<div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
<div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${ratio}%` }} />
</div>
</div>
</div>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase mb-4 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span> Project Info
</h3>
<div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
<div className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 shadow-sm transition-all group">
<div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Creator</span>
<span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-100 leading-none mt-0.5 truncate">Kagenou?</span>
</div>
</div>
<a href="https://github.com/kagenouReal" target="_blank" rel="noopener noreferrer" className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 shadow-sm transition-all group cursor-pointer">
<div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
</div>
<div className="flex flex-col min-w-0 w-full relative">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Github</span>
<span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5 truncate relative pr-4">
kagenouReal
<span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">↗</span>
</span>
</div>
</a>
<a href="https://wa.me/601112260297" target="_blank" rel="noopener noreferrer" className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 shadow-sm transition-all group cursor-pointer">
<div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</div>
<div className="flex flex-col min-w-0 w-full relative">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">WhatsApp</span>
<span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5 truncate relative pr-4">
+60 111...
<span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">↗</span>
</span>
</div>
</a>
<a href="https://t.me/Kagenouonly" target="_blank" rel="noopener noreferrer" className="p-2.5 border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2.5 bg-white/50 dark:bg-zinc-900/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 shadow-sm transition-all group cursor-pointer">
<div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-sm group-hover:scale-105 transition-transform shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
</div>
<div className="flex flex-col min-w-0 w-full relative">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Telegram</span>
<span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 leading-none mt-0.5 truncate relative pr-4">
@Kagenouonly
<span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">↗</span>
</span>
</div>
</a>
</div>
</div>
{/*==============*/}
</>
);
}