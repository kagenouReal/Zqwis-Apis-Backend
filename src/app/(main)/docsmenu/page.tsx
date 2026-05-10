"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { message } from "@/system/lib/message";

const ApiCard = ({ api, apikey }: { api: any, apikey: string }) => {
const [inputs, setInputs] = useState<Record<string, string>>({});
const [result, setResult] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [copied, setCopied] = useState(false);
const [copiedCurl, setCopiedCurl] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
const [status, setStatus] = useState<number | null>(null); 
const [copiedJson, setCopiedJson] = useState(false);
const exampleUrl = api.example ? api.example.replace("<apikey>", apikey || "<apikey>") : "";
const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
const curlCmd = api.curl 
? api.curl.replace(/<DOMAIN>/g, baseUrl).replace(/<apikey>/g, apikey || "<apikey>")
: `curl -X ${api.method || "GET"} "${baseUrl}${exampleUrl}" -H "Accept: application/json"`;
const handleTest = async () => {
setLoading(true);
setResult(null);
setStatus(null);
try {
let finalUrl = api.path;
const options: RequestInit = { method: api.method || "GET" };
if (api.method === "GET") {
const queryParams = new URLSearchParams(inputs).toString();
if (queryParams) finalUrl = `${api.path}?${queryParams}&apikey=${apikey || ""}`;
else finalUrl = `${api.path}?apikey=${apikey || ""}`;
} else {
finalUrl = `${api.path}?apikey=${apikey || ""}`;
options.headers = { "Content-Type": "application/json" };
options.body = JSON.stringify(inputs);
}
const res = await fetch(finalUrl, options);
setStatus(res.status); 
const data = await res.json();
setResult(data);
} catch (err) {
setStatus(500);
setResult({ error: message.api.notFound });
}
setLoading(false);
};
const handleCopyJson = () => {
if (!result) return;
const jsonText = JSON.stringify(result, null, 2);
if (navigator.clipboard && window.isSecureContext) {
navigator.clipboard.writeText(jsonText);
} else {
const textArea = document.createElement("textarea");
textArea.value = jsonText;
textArea.style.position = "absolute";
textArea.style.left = "-999999px";
document.body.prepend(textArea);
textArea.select();
try { document.execCommand("copy"); } catch (error) { console.error(error); }
textArea.remove();
}
setCopiedJson(true);
setTimeout(() => setCopiedJson(false), 2000);
};
const handleCopy = () => {
if (navigator.clipboard && window.isSecureContext) {
navigator.clipboard.writeText(exampleUrl);
} else {
const textArea = document.createElement("textarea");
textArea.value = exampleUrl;
textArea.style.position = "absolute";
textArea.style.left = "-999999px";
document.body.prepend(textArea);
textArea.select();
try { document.execCommand("copy"); } catch (error) { console.error(error); }
textArea.remove();
}
setCopied(true);
setTimeout(() => setCopied(false), 2000);
};
const handleCopyCurl = () => {
if (navigator.clipboard && window.isSecureContext) {
navigator.clipboard.writeText(curlCmd);
} else {
const textArea = document.createElement("textarea");
textArea.value = curlCmd;
textArea.style.position = "absolute";
textArea.style.left = "-999999px";
document.body.prepend(textArea);
textArea.select();
try { document.execCommand("copy"); } catch (error) { console.error(error); }
textArea.remove();
}
setCopiedCurl(true);
setTimeout(() => setCopiedCurl(false), 2000);
};
const methodColor = 
api.method === "POST" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
api.method === "PUT" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
api.method === "DELETE" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
"bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
const paramsList = api.method === "GET" ? (api.query || []) : (api.body || api.query || []);
const isFormValid = paramsList.every((q: string) => inputs[q]?.trim());
return (
<>
{/*==============*/}
<div className="w-full bg-card backdrop-blur-3xl rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group overflow-hidden">
<div onClick={() => setIsExpanded(!isExpanded)} className="p-5 sm:p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden">
<div className="absolute inset-0 bg-black/[0.01] dark:bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-start justify-between gap-4 relative z-10">
<div className="flex flex-col gap-2.5">
<div className="flex items-center gap-3">
<span className={`px-3 py-1 text-[11px] font-black rounded-full border shadow-sm uppercase tracking-widest ${methodColor} bg-white dark:bg-black`}>
{api.method}
</span>
<span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
Online
</span>
</div>
<code className="text-lg md:text-xl font-mono font-black text-zinc-800 dark:text-zinc-200 tracking-tight break-all">
{api.path}
</code>
</div>
<div className="pt-2 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`}>
<polyline points="6 9 12 15 18 9"></polyline>
</svg>
</div>
</div>
<p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium relative z-10 leading-relaxed">
{api.desc}
</p>
</div>
{isExpanded && (
<div className="px-5 sm:px-6 pb-6 pt-2 animate-in slide-in-from-top-4 fade-in duration-500">
<div className="relative pl-6 md:pl-8 border-l-2 border-black/5 dark:border-white/10 space-y-10">
<div className="relative">
<div className="absolute -left-[35px] md:-left-[43px] w-6 h-6 rounded-full bg-card border-2 border-black/5 dark:border-white/10 flex items-center justify-center">
<div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
</div>
<h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">1. Routing Target</h4>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded p-4 flex flex-col gap-3 shadow-inner">
<div className="flex items-center justify-between gap-4">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12">URL</span>
<code className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate flex-1">{baseUrl}{exampleUrl}</code>
<button onClick={handleCopy} className="text-zinc-400 hover:text-blue-500">{copied ? "✓" : "⎘"}</button>
</div>
<div className="w-full h-px bg-black/5 dark:bg-white/5"></div>
<div className="flex items-start justify-between gap-4">
<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 pt-0.5">cURL</span>
<code className="text-[11px] font-mono text-zinc-500 flex-1 whitespace-pre-wrap break-all leading-relaxed">{curlCmd}</code>
<button onClick={handleCopyCurl} className="text-zinc-400 hover:text-blue-500 pt-0.5">{copiedCurl ? "✓" : "⎘"}</button>
</div>
</div>
</div>
{paramsList.length > 0 && (
<div className="relative">
<div className="absolute -left-[35px] md:-left-[43px] w-6 h-6 rounded-full bg-card border-2 border-black/5 dark:border-white/10 flex items-center justify-center">
<div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
</div>
<h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">2. {api.method === "GET" ? "Parameters" : "Body (JSON)"}</h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
{paramsList.map((q: string) => (
<div key={q} className="relative bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<label className="absolute top-2 left-3 text-[8px] font-bold text-zinc-400 uppercase tracking-wider">{q}</label>
<input type="text" placeholder={`Required...`} onChange={(e) => setInputs({ ...inputs, [q]: e.target.value })} className="w-full pt-6 pb-2.5 px-3 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20" />
</div>
))}
</div>
</div>
)}
<div className="relative">
<div className="absolute -left-[35px] md:-left-[43px] w-6 h-6 rounded-full bg-card border-2 border-blue-500 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">
<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
</div>
<div className="flex items-center justify-between mb-4">
<h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{paramsList.length > 0 ? "3." : "2."} Output Terminal</h4>
{status !== null && (
<span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${status >= 200 && status < 300 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-rose-600 bg-rose-500/10 border-rose-500/20"}`}>HTTP {status}</span>
)}
</div>
<div className="flex flex-col rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm bg-card">
<div className="flex items-center justify-between px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
<div className="flex items-center gap-1.5">
<div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
<div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
<div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
</div>
<button onClick={handleCopyJson} disabled={!result || loading} className={`text-[9px] font-bold tracking-widest uppercase transition-colors ${!result || loading ? "text-zinc-300" : "text-zinc-400 hover:text-blue-500"}`}>{copiedJson ? "✓ Copied" : "Copy JSON"}</button>
</div>
<div className="relative min-h-[200px] bg-transparent">
{!result && !loading ? (
<div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
<span className="text-zinc-400/30 font-mono text-[9px] uppercase tracking-[0.2em]">~ Awaiting Response ~</span>
</div>
) : loading ? (
<div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse">Calling Server...</div>
) : (
<pre className="p-5 text-[11px] font-mono text-zinc-800 dark:text-zinc-300 overflow-auto scrollbar-hide max-h-[350px]">
<code>{JSON.stringify(result, null, 2)}</code>
</pre>
)}
</div>
<button onClick={handleTest} disabled={loading || !isFormValid} className={`w-full py-2.5 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 border-t border-black/5 dark:border-white/5 ${(loading || !isFormValid) ? "bg-black/[0.01] dark:bg-white/[0.01] text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50" : "bg-black/[0.02] dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black active:scale-[0.99]"}`}>
{loading ? (
<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
) : !isFormValid && paramsList.length > 0 ? (
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
) : (
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
)}
<span>{loading ? "Processing..." : (!isFormValid && paramsList.length > 0) ? "Send Request" : "Send Request"}</span>
</button>
</div>
</div>
</div>
</div>
)}
</div>

{/*==============*/}
</>
);
};
export default function Dashboard() {
const { data: session } = useSession();
const userApiKey = (session?.user as any)?.apikey || ""; 
const [apis, setApis] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const searchParams = useSearchParams();
const currentCategory = searchParams.get("c");
useEffect(() => {
fetch("/api/v1/list")
.then((res) => res.json())
.then((data) => {
setApis(data);
setLoading(false);
})
.catch(() => setLoading(false));
}, []);
const groupedApis = useMemo(() => {
const filtered = currentCategory
? apis.filter((api) => (api.category || "Uncategorized") === currentCategory)
: apis;
return filtered.reduce((acc: any, api: any) => {
const category = api.category || "Uncategorized";
if (!acc[category]) acc[category] = [];
acc[category].push(api);
return acc;
}, {});
}, [apis, currentCategory]);
return (
<>
{/*==============*/}
<div className="w-full space-y-5">
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
<div>
<h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
{currentCategory ? (
<>
<span className="text-blue-600 dark:text-blue-500">{currentCategory}</span> API
</>
) : (
<>
Docs <span className="text-blue-600 dark:text-blue-500">Menu</span>
</>
)}
</h1>
<p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium max-w-xl">
Browse, configure, and test APIs directly from the dashboard.
</p>
</div>
<div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded-xl font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
ROUTER: ONLINE
</div>
</div>
</div>
<div className="space-y-12 relative z-10">
{loading ? null : Object.keys(groupedApis).length > 0 ? (
Object.keys(groupedApis).map((category) => (
<div key={category} className="space-y-6">
<div className="flex items-center gap-4">
<h2 className="text-lg font-black tracking-widest uppercase text-zinc-800 dark:text-zinc-200">
{category}
</h2>
<div className="flex-1 h-[1px] bg-gradient-to-r from-black/5 dark:from-white/5 to-transparent"></div>
</div>
<div className="grid grid-cols-1 gap-6">
{groupedApis[category].map((api: any, i: number) => (
<ApiCard key={i} api={api} apikey={userApiKey} />
))}
</div>
</div>
))
) : (
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<p className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide">{message.api.notFound}</p>
</div>
)}
</div>
</div>
{/*==============*/}
</>
);
}