"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
export default function Auth() {
const router = useRouter();
const [isLogin, setIsLogin] = useState(true);
const [form, setForm] = useState({ username: "", password: "", retypePassword: "" });
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const handleAuth = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
setError("");
if (isLogin) {
const res = await signIn("credentials", {
username: form.username,
password: form.password,
redirect: false,
});
if (res?.error) {
setError("Invalid username or password.");
setLoading(false);
} else {
router.push("/home");
router.refresh();
}
} else {
if (form.password !== form.retypePassword) {
setError("Passwords do not match.");
setLoading(false);
return;
}
try {
const res = await axios.post("/api/register", form);
if (res.data.status) {
const autoRes = await signIn("credentials", {
username: form.username,
password: form.password,
redirect: false,
});
if (autoRes?.ok) {
router.push("/home");
router.refresh();
} else {
setIsLogin(true);
setError("Account created. Please sign in.");
setLoading(false);
}
}
} catch (err: any) {
setError(err.response?.data?.message || "Registration failed. Try again.");
setLoading(false);
}
}
};
return (
<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 font-sans relative overflow-hidden transition-none selection:bg-blue-500/30">
<div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
<div className="absolute -top-[20%] -left-[10%] w-[120%] h-[80%] bg-blue-500/[0.05] dark:bg-blue-500/[0.03] rounded-[100%] blur-[150px]" />
<div className="absolute -bottom-[20%] -right-[10%] w-[120%] h-[80%] bg-cyan-500/[0.05] dark:bg-cyan-500/[0.03] rounded-[100%] blur-[150px]" />
</div>
<div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 my-auto">
<div className="bg-card backdrop-blur-3xl p-8 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
<div className="mb-8 text-center flex flex-col items-center">
<img src="/api/assets/zqwis.png" alt="Logo" className="h-12 mb-0 object-contain drop-shadow-sm" />
<img src="/api/assets/login.gif" alt="Gif" className="h-24 mb-0 object-contain rounded-xl drop-shadow-sm" />
<h1 className="text-2xl font-black tracking-tight">{isLogin ? "Welcome Back" : "Create Account"}</h1>
<p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mt-2">
{isLogin ? "Sign in to your account" : "Register to get started"}
</p>
</div>
<form onSubmit={handleAuth} className="space-y-4">
<div className="space-y-1.5">
<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">
Username
</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="text" placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-5 py-3.5 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/30" required autoComplete="off" spellCheck={false} autoCapitalize="none" autoCorrect="off" />
</div>
</div>
<div className="space-y-1.5">
<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Password</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type={isLogin ? "password" : "text"} placeholder={isLogin ? "••••••••" : "Enter password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-5 py-3.5 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/30 tracking-widest" required />
</div>
</div>
{!isLogin && (
<div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Retype Password</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="text" placeholder="Retype password" value={form.retypePassword} onChange={(e) => setForm({ ...form, retypePassword: e.target.value })} className="w-full px-5 py-3.5 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/30 tracking-widest" required autoComplete="off" spellCheck={false} autoCapitalize="none" autoCorrect="off" />
</div>
</div>
)}
{error && (
<div className={`p-4 rounded-xl border text-[10px] font-bold text-center uppercase tracking-widest animate-in shake duration-300 ${error.includes("created") ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"}`}>
{error}
</div>
)}

<button type="submit" disabled={loading} className="w-full py-3.5 mt-6 text-[11px] font-black tracking-[0.2em] uppercase rounded border transition-all duration-300 shadow-sm bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
{loading ? (
<>
<span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
Authenticating...
</>
) : (
<>
{isLogin ? "Sign In to Dashboard" : "Create Free Account"}
</>
)}
</button>

</form>
<div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 text-center">
<button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); setForm({ username: "", password: "", retypePassword: "" }); }} className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-[0.15em]">
{isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
</button>
</div>
</div>
</div>
<div className="text-center pb-2 pt-6 opacity-40 hover:opacity-100 transition-opacity z-10 relative">
<p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 dark:text-zinc-400 uppercase truncate">
© 2026 KAGENOU <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span> ZQWIS APIS
</p>
</div>
</div>
);
}
