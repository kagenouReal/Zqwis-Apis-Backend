"use client";
import AuthProvider from "@/system/lib/AuthProvider";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Suspense } from "react";
//================
function DashboardLayout({ children }: { children: React.ReactNode }) {
return (
<div className="relative w-full min-h-screen space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto p-4 overflow-x-hidden sm:overflow-visible">
<div className="fixed -top-[20%] -left-[25%] w-[120vw] h-[60vh] bg-blue-500/[0.05] dark:bg-blue-500/[0.03] rounded-[100%] blur-[180px] pointer-events-none -z-10" />
<div className="fixed -bottom-[20%] -right-[25%] w-[120vw] h-[60vh] bg-cyan-500/[0.05] dark:bg-cyan-500/[0.03] rounded-[100%] blur-[180px] pointer-events-none -z-10" />
{/*==============*/}
{children}
{/*==============*/}
<div className="text-center py-4 opacity-40 hover:opacity-100 transition-opacity">
<p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 dark:text-zinc-400 uppercase truncate">
© 2026 KAGENOU <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span> ZQWIS APIS
</p>
</div>
</div>
);}
//================
function LayoutWrapper({ children }: { children: React.ReactNode }) {
const { data: session } = useSession();
const role = (session?.user as any)?.role || "GUEST";
const username = (session?.user as any)?.name || "Unknown Node";
const [isOpen, setIsOpen] = useState(false);
const [isDark, setIsDark] = useState(false);
const [mounted, setMounted] = useState(false);
const [categories, setCategories] = useState<string[]>([]);
const pathname = usePathname();
const searchParams = useSearchParams();
const router = useRouter(); 
const currentCat = searchParams.get("c");
useEffect(() => {
setMounted(true); 
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
document.documentElement.classList.add("dark");
setIsDark(true);
} else {
document.documentElement.classList.remove("dark");
setIsDark(false);
localStorage.setItem("theme", "light");
}
}, []);
const handleLogout = async () => {
await signOut({ callbackUrl: "/" });
};
const toggleTheme = () => {
const css = document.createElement("style");
css.type = "text/css";
css.appendChild(
document.createTextNode(
"* { -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; -ms-transition: none !important; transition: none !important; }"
)
);
document.head.appendChild(css);
const now = document.documentElement.classList.toggle("dark");
setIsDark(now);
localStorage.setItem("theme", now ? "dark" : "light");
const _ = window.getComputedStyle(css).opacity;
setTimeout(() => document.head.removeChild(css), 10);
};
//================
useEffect(() => {
if ((session?.user as any)?.isDead) {
signOut({ callbackUrl: "/" });
}
}, [session]);
useEffect(() => {
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
document.documentElement.classList.add("dark");
setIsDark(true);
} else {
document.documentElement.classList.remove("dark");
setIsDark(false);
}
}, []);
useEffect(() => {
fetch("/api/v1/list")
.then((res) => res.json())
.then((data) => {
const cats = Array.from(new Set(data.map((item: any) => item.category || "Uncategorized")));
setCategories(cats as string[]);
})
.catch((err) => console.error("Menu Fetch Error:", err));
}, []);
//================
const NavLink = ({ href, icon, text, isSub = false }: { href: string; icon: string; text: string; isSub?: boolean }) => {
const isCategoryLink = href.includes("?c=");
const targetCat = isCategoryLink ? href.split("?c=")[1] : null;
const active = isCategoryLink ? currentCat === targetCat : pathname === href && !currentCat;
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
setIsOpen(false);
if (pathname === href && currentCat && !href.includes("?")) {
e.preventDefault();
window.location.href = href; 
} else if (pathname === href.split("?")[0]) {
e.preventDefault();
router.push(href);
}
};
return (
<Link
href={href}
onClick={handleClick}
className={`group relative flex items-center gap-3 rounded-xl transition-all duration-300 ease-out w-full overflow-hidden
${isSub ? "px-3 py-2" : "px-3.5 py-2.5"}
${active
? "text-zinc-900 dark:text-zinc-100 bg-transparent"
: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}
`}
>
{active && (
<div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] bg-zinc-800 dark:bg-zinc-200 rounded-r-full shadow-sm ${isSub ? "h-3.5" : "h-5"}`} />
)}
<span className={`${isSub ? "text-sm opacity-80" : "text-base"} font-mono transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : ""}`}>
{icon}
</span>
<span className={`font-mono uppercase tracking-[0.15em] transition-transform duration-300 group-hover:translate-x-1 truncate ${isSub ? "text-[9px]" : "text-[10px]"} ${active ? "font-black" : "font-bold"}`}>
{text}
</span>
</Link>
);
};

//================
if (pathname === "/") {
return <div className="w-full">{children}</div>;
}
return (
<>
<script
dangerouslySetInnerHTML={{
__html: `
try {
if (localStorage.getItem('theme') === 'dark') {
document.documentElement.classList.add('dark');
} else {
document.documentElement.classList.remove('dark');
}
} catch (_) {}
`,
}}
/>
{/*==============*/}
<div className="flex min-h-screen bg-background text-foreground selection:bg-blue-500/30 font-sans">
{/*==============*/}
{isOpen && (
<div
className="fixed inset-0 bg-zinc-900/20 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
onClick={() => setIsOpen(false)}
/>
)}
{/*==============*/}
<aside
className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col
bg-background backdrop-blur-3xl
border-r border-black/5 dark:border-white/5 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
>
<div className="flex items-center justify-between px-6 h-24 border-b border-black/5 dark:border-white/5 shrink-0 bg-card z-10 relative">
<div className="flex flex-col justify-center">
<img src="/api/assets/zqwis.png" className="h-12 w-auto object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105 origin-left" alt="logo" />
<div className="flex items-center gap-2 mt-1.5 pl-1">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
<span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold tracking-[0.2em] uppercase">Menu Panel</span>
</div>
</div>
<button 
onClick={toggleTheme}
className="relative w-16 h-8 rounded-2xl bg-background border border-black/5 dark:border-white/5 shadow-sm shrink-0 active:scale-95 overflow-hidden"
title="Toggle Theme"
>
{mounted && (
<>
<div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-700">
<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-700">
<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
</svg>
</div>
<div 
className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-card shadow-sm border border-black/5 dark:border-white/5 transition-none
${!isDark 
? "left-[36px] text-amber-500" 
: "left-1 text-blue-400"
}`}
>
{!isDark ? (
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
</svg>
) : (
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>
)}
</div>
</>
)}
</button>
</div>
{/*==============*/}
<div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
<div>
<p className="px-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-[0.15em] mb-3 flex items-center gap-2">
<span className="w-2 h-[1px] bg-zinc-300 dark:bg-zinc-700"></span> OVERVIEW
</p>
<div className="space-y-1">
<NavLink href="/home" icon="⊞" text="Dashboard" />
</div>
</div>
{/*==============*/}
<div>
{/*==============*/}
<p className="px-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-[0.15em] mb-3 flex items-center gap-2">
<span className="w-2 h-[1px] bg-zinc-300 dark:bg-zinc-700"></span> MODULES
</p>
<div className="space-y-0.5">
<NavLink href="/docsmenu" icon="◈" text="Docs Menu" />
{categories.length > 0 && (
<div className="pl-3 ml-3.5 border-l border-black/5 dark:border-white/10 space-y-0.5 mt-0.5">
{categories.map((cat) => (
<NavLink key={cat} href={`/docsmenu?c=${cat}`} icon="↳" text={cat} isSub />
))}
</div>
)}
</div>
{/*==============*/}
</div>
{/*==============*/}
<div>
<p className="px-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-[0.15em] mb-3 flex items-center gap-2">
<span className="w-2 h-[1px] bg-zinc-300 dark:bg-zinc-700"></span> ROOT
</p>
<div className="space-y-0.5">
<NavLink href="/profile" icon="⚉" text="User Profile" />
{(role === "admin" || role === "owner") && (
<div className="pl-3 ml-3.5 border-l border-black/5 dark:border-white/10 space-y-0.5 mt-0.5">
<NavLink href="/adminmenu" icon="↳" text="Admin Panel" isSub />
{role === "owner" && (
<NavLink href="/ownermenu" icon="↳" text="Owner Panel" isSub />
)}
</div>
)}
</div>
</div>
{/*==============*/}
</div>
{/*==============*/}
<div className="shrink-0 border-t border-black/5 dark:border-white/5 p-4 md:p-5 flex items-center justify-between bg-card backdrop-blur-md">
<div className="flex items-center gap-3 min-w-0">
<div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shrink-0 shadow-sm">
<span className="text-xs font-black text-blue-600 dark:text-blue-400">
{username ? username.charAt(0).toUpperCase() : "?"}
</span>
<span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090b]"></span>
</div>
<div className="flex flex-col min-w-0">
<span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate max-w-[110px]">@{username}</span>
<span className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 truncate">ROLE: {role}</span>
</div>
</div>
<button onClick={handleLogout} title="Logout" className="group w-9 h-9 flex items-center justify-center rounded-xl bg-background border border-black/5 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shadow-sm active:scale-95 shrink-0">
<span className="text-xl font-mono text-rose-500 transition-transform group-hover:rotate-12">⎋</span>
</button>
</div>
</aside>
{/*==============*/}
<main className="flex-1 md:ml-72 min-h-screen flex flex-col relative z-10">
{/*==============*/}
<header className="md:hidden flex items-center justify-between px-5 h-16 bg-card backdrop-blur-2xl border-b border-black/5 dark:border-white/5 sticky top-0 z-30">
<img src="/api/assets/zqwis.png" className="h-12 drop-shadow-sm object-contain" alt="logo" />
<button onClick={() => setIsOpen(true)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all active:scale-95">
<span className="text-2xl leading-none">≡</span>
</button>
</header>
{/*==============*/}
<div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
<DashboardLayout>
{children}
</DashboardLayout>
</div>
{/*==============*/}
</main>
{/*==============*/}
</div>
{/*==============*/}
</>
);
}
//================
export default function MainLayout({ children }: { children: React.ReactNode }) {
return (
<AuthProvider>
<Suspense fallback={
<div className="flex min-h-screen bg-background items-center justify-center w-full">
<div className="flex flex-col items-center gap-3">
<span className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></span>
<span className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase animate-pulse">
Zqwis - Apis
</span>
</div>
</div>
}>
<LayoutWrapper>{children}</LayoutWrapper>
</Suspense>
</AuthProvider>
);
}
