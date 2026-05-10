"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { message } from "@/system/lib/message";

export default function Dashboard() {
const { data: session } = useSession();
const role = (session?.user as any)?.role || "user";
const [users, setUsers] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [formLoading, setFormLoading] = useState(false);
const [msg, setMsg] = useState({ type: "", text: "" });
const [expandedUser, setExpandedUser] = useState<string | null>(null);
const [showAll, setShowAll] = useState(false);
const [showCreateForm, setShowCreateForm] = useState(false);
const [form, setForm] = useState({ username: "", password: "", retypePassword: "", role: "user" });
const handleCreate = async (e: React.FormEvent) => {
e.preventDefault();
if (form.password !== form.retypePassword) {
setMsg({ type: "error", text: "Password does not match!" });
setTimeout(() => setMsg({ type: "", text: "" }), 1500);
return;
}
setFormLoading(true);
setMsg({ type: "", text: "" });
try {
const res = await axios.post("/api/admin/cuser", {
username: form.username,
password: form.password,
role: form.role
});
setMsg({ type: "success", text: res.data.message || message.status.success });
setForm({ username: "", password: "", retypePassword: "", role: "user" });
fetchUsers(); 
setTimeout(() => setMsg({ type: "", text: "" }), 1500); 
} catch (err: any) {
setMsg({ type: "error", text: err.response?.data?.message || message.status.error });
setTimeout(() => setMsg({ type: "", text: "" }), 1500);
}
setFormLoading(false);
};
const handleCopy = (text: string, type: string) => {
if (navigator.clipboard && window.isSecureContext) {
navigator.clipboard.writeText(text);
} else {
const textArea = document.createElement("textarea");
textArea.value = text;
textArea.style.position = "absolute";
textArea.style.left = "-999999px";
document.body.prepend(textArea);
textArea.select();
try { document.execCommand("copy"); } catch (error) { console.error(error); }
textArea.remove();
}
};
const handleSetLimit = async (username: string, currentLimit: number) => {
const promptVal = window.prompt(`Set new limit for @${username}`, currentLimit.toString());
if (promptVal === null || promptVal === "") return;
const newLimit = parseInt(promptVal, 10);
if (isNaN(newLimit)) {
setMsg({ type: "error", text: message.input.missing });
return;
}
const amount = newLimit - currentLimit;
if (amount === 0) return; 
try {
const res = await axios.post("/api/admin/setlimit", { username, amount });
setMsg({ type: "success", text: res.data.message });
fetchUsers(); 
} catch (err: any) {
setMsg({ type: "error", text: err.response?.data?.message || message.status.error });
}
};
const handleSetIpQuota = async (username: string, currentQuota: number) => {
const newQuota = prompt(`Set new IP Quota for @${username}:`, currentQuota?.toString() || "0");
if (newQuota === null || newQuota === "" || isNaN(Number(newQuota))) return;
try {
const res = await fetch("/api/admin/setipquota", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ username, quota: parseInt(newQuota, 10) }),
});
const data = await res.json();
if (data.status) {
alert(data.message);
fetchUsers();
} else {
alert(data.message);
}
} catch (err) {
alert("Server error.");
}
};
const fetchUsers = async () => {
try {
const res = await axios.get("/api/admin/listuser");
setUsers(res.data);
} catch (err: any) {
console.error("error:", err.response?.data?.message || message.api.serverError);
} finally {
setLoading(false);
}
};
useEffect(() => {
if (role === "admin" || role === "owner") {
fetchUsers();
} else {
setLoading(false);
}
}, [role]);
const handleDelete = async (username: string) => {
if (!confirm(`Delete @${username}? Cannot be undone.`)) return;
try {
const res = await axios.delete(`/api/admin/duser?username=${username}`);
setMsg({ type: "success", text: res.data.message || message.status.success });
fetchUsers(); 
} catch (err: any) {
setMsg({ type: "error", text: err.response?.data?.message || message.status.error });
}
};
return (
<>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
<div>
<h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
Admin <span className="text-blue-600 dark:text-blue-500">Panel</span>
</h1>
<p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium max-w-xl">
Manage nodes, privileges, and system access.
</p>
</div>
<div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/5 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
PRIVILEGE: ADMIN
</div>
</div>
</div>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase mb-5 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Active Users
</h3>

{loading ? null : users.length === 0 ? (
<p className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide">{message.user.notFound}</p>
) : (
<>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
{(showAll ? users : users.slice(0, 5)).map((u, i) => (
<div 
key={i} 
className={`flex flex-col transition-all group rounded shadow-sm hover:shadow-md ${
expandedUser === u.username 
/* PAS KEBUKA: Border nyatu kyk kotak folder (rounded-b-none) */
? "bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded-b-none" 
/* PAS NUTUP: Melengkung normal (rounded) */
: "bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded"
}`}
>
<div 
onClick={() => setExpandedUser(expandedUser === u.username ? null : u.username)}
className={`flex items-center justify-between p-2.5 cursor-pointer ${expandedUser === u.username ? "border-b border-black/5 dark:border-white/5" : ""}`}
>
<div className="flex items-center gap-3 overflow-hidden">
<div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${u.role === "admin" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"}`}>
{u.username.charAt(0).toUpperCase()}
</div>
<div className="flex flex-col min-w-0">
<span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">@{u.username}</span>
<span className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">[{u.role}]</span>
</div>
</div>
<div className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 pr-1 transition-colors shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${expandedUser === u.username ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
</div>
</div>
{expandedUser === u.username && (
<div className="p-4 space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300 cursor-text border-t-0 border-black/5 dark:border-white/5 rounded-b-lg" onClick={(e) => e.stopPropagation()}>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">ROLE</span>
<span className="font-mono text-[10px] font-bold uppercase text-zinc-800 dark:text-zinc-200">
{u.role || "user"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">USERNAME</span>
<span 
onClick={(e) => { e.stopPropagation(); handleCopy(u.username || "", "Username"); }}
className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] cursor-pointer hover:underline hover:bg-zinc-500/10 px-1 py-0.5 rounded transition-all"
title="Click to copy"
>
@{u.username || "N/A"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">PASSWORD</span>
<span 
onClick={(e) => { e.stopPropagation(); handleCopy(u.password || "", "Password"); }}
className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] cursor-pointer hover:underline hover:bg-zinc-500/10 px-1 py-0.5 rounded transition-all"
title="Click to copy"
>
{u.password || "N/A"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">API KEY</span>
<span 
onClick={(e) => { e.stopPropagation(); handleCopy(u.apikey || "", "API Key"); }}
className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] cursor-pointer hover:underline hover:bg-zinc-500/10 px-1 py-0.5 rounded transition-all"
title="Click to copy"
>
{u.apikey || "N/A"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">LIMIT</span>
<span 
onClick={(e) => { e.stopPropagation(); handleSetLimit(u.username, u.limit ?? 0); }}
className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] cursor-pointer hover:underline hover:bg-zinc-500/10 px-1 py-0.5 rounded transition-all"
title="Click to edit limit"
>
{u.limit ?? "0"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">IP QUOTA</span>
<span 
onClick={(e) => { e.stopPropagation(); handleSetIpQuota(u.username, u.maxIpQuota); }}
className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] cursor-pointer hover:underline hover:bg-zinc-500/10 px-1 py-0.5 rounded transition-all"
>
{u.maxIpQuota ?? "N/A"}
</span>
</div>
<div className="flex justify-between items-center px-1">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">WHITELIST IP</span>
<span className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
{(!u.whitelistIp || u.whitelistIp.length === 0) ? "N/A" : u.whitelistIp.join(", ")}
</span>
</div>
<div className="flex justify-between items-center px-1 border-b border-black/5 dark:border-white/5 pb-2">
<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">CREATED</span>
<span className="font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "N/A"}
</span>
</div>
<div className="flex items-center justify-end pt-1"> 
<button 
onClick={(e) => { e.stopPropagation(); handleDelete(u.username); }} 
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-[0.15em] uppercase transition-all duration-300 border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 shadow-sm active:scale-95"
title="delete acc"
>
✕
</button>
</div>
</div>
)}
</div>
))}
</div>
{users.length > 5 && (
<div className="-mt-2 pt-6 flex justify-center">
<button 
onClick={() => setShowAll(!showAll)}
className="group flex items-center gap-1 text-[10px] font-bold font-mono text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 uppercase tracking-widest transition-colors active:scale-95"
>
{showAll ? "Show Less" : `View All (${users.length - 5})`}
<svg 
xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
className={`transition-transform duration-300 ${showAll ? "rotate-180" : "group-hover:translate-y-0.5"}`}
>
<polyline points="6 9 12 15 18 9"></polyline>
</svg>
</button>
</div>
)}
</>
)}
</div>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full overflow-hidden">
<div 
onClick={() => setShowCreateForm(!showCreateForm)}
className={`p-6 cursor-pointer group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors border-b ${showCreateForm ? "border-black/5 dark:border-white/5" : "border-transparent"}`}
>
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase mb-5 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span> Deploy Node
</h3>
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg shrink-0 border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-400 bg-card group-hover:text-blue-500 transition-colors">
+
</div>
<div className="flex flex-col">
<span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Create New Account</span>
<span className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">REGISTER NEW NODE</span>
</div>
</div>
<div className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showCreateForm ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
</div>
</div>
</div>
{showCreateForm && (
<form onSubmit={handleCreate} className="p-6 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300 bg-zinc-50/50 dark:bg-zinc-950/30">
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">Username</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="new_user" className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20" required autoComplete="off" spellCheck="false" autoCapitalize="none" autoCorrect="off" />
</div>
</div>
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">Password</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20" required />
</div>
</div>
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">Retype Password</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="password" value={form.retypePassword} onChange={(e) => setForm({ ...form, retypePassword: e.target.value })} placeholder="••••••••" className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20" required />
</div>
</div>
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">Privilege Level</label>
<div className="grid grid-cols-2 gap-3">
<button
type="button"
onClick={() => setForm({ ...form, role: "user" })}
className={`active:scale-95 w-full px-3 py-2 rounded text-[10px] focus:outline-none transition-all shadow-sm font-mono tracking-widest uppercase border bg-card hover:bg-white dark:hover:bg-zinc-900 ${
form.role === "user"
? "border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold opacity-100"
: "border-black/5 dark:border-white/5 text-zinc-500 dark:text-zinc-400 font-bold opacity-50 hover:opacity-80"
}`}
>
User
</button>
<button
type="button"
onClick={() => setForm({ ...form, role: "admin" })}
className={`active:scale-95 w-full px-3 py-2 rounded text-[10px] focus:outline-none transition-all shadow-sm font-mono tracking-widest uppercase border bg-card hover:bg-white dark:hover:bg-zinc-900 ${
form.role === "admin"
? "border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold opacity-100"
: "border-black/5 dark:border-white/5 text-zinc-500 dark:text-zinc-400 font-bold opacity-50 hover:opacity-80"
}`}
>
Admin
</button>
</div>
</div>

<button
type="submit"
disabled={formLoading || !!msg.type} 
className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 border shadow-sm bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
>
{formLoading ? (
<>
<span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"></span>
<span className="font-mono text-[9px] translate-y-[0.5px]">Processing..</span>
</>
) : msg.type === "success" ? (
<>
<span className="font-mono text-[9px] translate-y-[0.5px]">Done ✓</span>
</>
) : msg.type === "error" ? (
<>
<span className="font-mono text-[9px] translate-y-[0.5px]">Failed ✕</span>
</>
) : (
<>
<span className="font-mono text-[9px] translate-y-[0.5px]">Create Account</span>
</>
)}
</button>
</form>
)}
</div>
{/*==============*/}
</>
);
}