"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
export default function Profile() {
const { data: session } = useSession();
const [profile, setProfile] = useState<any>(null);
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [ip, setIp] = useState("");
const[isExpanded,setIsExpanded]=useState(false);
const[loadingRegen,setLoadingRegen]=useState(false);
const[regenSuccess,setRegenSuccess]=useState(false);
const[loadingSave,setLoadingSave]=useState(false);
const[saveSuccess,setSaveSuccess]=useState(false);
const handleAction=async(action:string,payload:any={})=>{
try{
if(action==="reset_apikey")setLoadingRegen(true);
if(action==="update_security")setLoadingSave(true);
const res=await fetch("/api/profile",{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({action,payload})
});
const data=await res.json();
if(data.status){
fetchProfile();
if(action==="reset_apikey"){
setRegenSuccess(true);
setTimeout(()=>setRegenSuccess(false),2000);
}
if(action==="update_security"){
setUsername("");
setPassword("");
setSaveSuccess(true);
setTimeout(()=>setSaveSuccess(false),2000);
}
}else{
alert(data.message);
}
}catch(e){
alert("Error");
}finally{
setLoadingRegen(false);
setLoadingSave(false);
}
};
const fetchProfile = async () => {
try {
const res = await fetch("/api/profile");
const data = await res.json();
setProfile(data);
} catch (e) {
alert("Error");
}
};
useEffect(() => {
fetchProfile();
}, []);
const handleCopy = (text: string) => {
if (navigator.clipboard && window.isSecureContext) {
navigator.clipboard.writeText(text);
} else {
const textArea = document.createElement("textarea");
textArea.value = text;
textArea.style.position = "absolute";
textArea.style.left = "-999999px";
document.body.prepend(textArea);
textArea.select();
try { document.execCommand("copy"); } catch (error) {}
textArea.remove();
}
};
if (!profile) return
return (
<>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full">
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
<div>
<h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
Account <span className="text-blue-600 dark:text-blue-500">Profile</span>
</h1>
<p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium max-w-xl">
Manage your account credentials, quota, and IP whitelist.
</p>
</div>
<div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/5 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
PRIVILEGE: ADMIN
</div>
</div>
</div>
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl rounded-2xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full overflow-hidden">
<div className="p-5 sm:p-6 relative overflow-hidden">
<div className="absolute inset-0 bg-black/[0.01] dark:bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
<div className="flex items-center justify-between gap-4 relative z-10 mb-5">
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Account Info & Security
</h3>
<div onClick={()=>setIsExpanded(!isExpanded)} className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1">
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isExpanded?"rotate-180":""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
</div>
</div>
<div className="space-y-4 relative z-10">
<div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Username</span>
<span className="text-xs font-black text-zinc-800 dark:text-zinc-200">@{profile.username}</span>
</div>
<div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</span>
<span className="text-[9px] px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-black uppercase tracking-widest">{profile.role}</span>
</div>
<div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Limit</span>
<span className="text-xs font-black text-blue-600 dark:text-blue-400">{profile.limit}</span>
</div>
<div className="space-y-1.5 pt-2 md:col-span-2">
<label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">API Key</label>
<div className="flex gap-2">
<div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<code className="text-[10px] font-mono text-zinc-800 dark:text-zinc-200 break-all">{profile.apikey}</code>
<button onClick={()=>handleCopy(profile.apikey)} className="ml-3 text-zinc-400 hover:text-blue-500 transition-colors shrink-0 active:scale-95" title="Copy API Key">
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
</button>
</div>
<button onClick={()=>handleAction("reset_apikey")} disabled={loadingRegen} className="px-3 py-2.5 font-black text-[9px] tracking-[0.15em] uppercase rounded border transition-all duration-300 shadow-sm bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5 shrink-0">
{loadingRegen?<span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>:null}
{loadingRegen?"Wait":regenSuccess?"Done":"Reset"}
</button>
</div>
</div>
{isExpanded && (
<div className="px-5 sm:px-6 pb-6 pt-4 animate-in slide-in-from-top-4 fade-in duration-500 border-t border-black/5 dark:border-white/5">
<h4 className="text-[9px] font-black tracking-[0.2em] uppercase mb-4 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Credentials
</h4>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">New Username</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="text" placeholder="new_username" value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20"" autoComplete="off" spellCheck="false" autoCapitalize="none" autoCorrect="off" />
</div>
</div>
<div className="space-y-1.5">
<label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 pl-1">New Password</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20"" autoComplete="off" spellCheck="false" autoCapitalize="none" autoCorrect="off" />
</div>
</div>
<div className="md:col-span-2 mt-2">
<button 
onClick={()=>handleAction("update_security",{newUsername:username,newPassword:password})} 
disabled={(!username && !password)||loadingSave} 
className="w-full py-2.5 font-black text-[9px] tracking-[0.15em] uppercase rounded border transition-all duration-300 shadow-sm bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 disabled:opacity-50 active:scale-95 flex justify-center items-center gap-2"
>
{loadingSave?
<span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
:null}
{loadingSave?"Processing...":saveSuccess?"Done ✓":"Save Changes"}
</button>
</div>

</div> 
</div>
)}
</div>
</div> 
</div> 
{/*==============*/}
<div className="lg:col-span-5 bg-card backdrop-blur-3xl rounded-2xl p-5 border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all h-full overflow-hidden">
<div className="flex items-center justify-between mb-5">
<h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> IP Whitelist
</h3>
<span className="text-[9px] font-bold px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] rounded text-zinc-500 uppercase tracking-widest">
{profile.whitelistIp?.length || 0} Registered
</span>
</div>
<div className="flex gap-2 mb-5">
<div className="flex-1 space-y-1.5">
<label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">IP Address</label>
<div className="bg-card border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 rounded shadow-inner focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-all">
<input type="text" placeholder="192.168.1.1" value={ip} onChange={(e)=>setIp(e.target.value)} className="w-full px-4 py-2.5 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400/20" autoComplete="off" spellCheck="false" />
</div>
</div>
<div className="flex flex-col justify-end">
<button onClick={()=>handleAction("add_ip",{ip})} disabled={!ip} className="h-[38px] px-3 font-black text-[9px] tracking-[0.15em] uppercase rounded border transition-all duration-300 shadow-sm bg-card border-black/5 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/30 disabled:opacity-50 active:scale-95 shrink-0">
Add IP
</button>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
{profile.whitelistIp?.map((wIp:string,i:number)=>(
<div key={i} className="flex items-center justify-between p-2.5 rounded border border-black/5 dark:border-white/5 bg-card hover:bg-white dark:hover:bg-zinc-900 transition-all group">
<span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 ml-1">{wIp}</span>
<button onClick={()=>handleAction("delete_ip",{ip:wIp})} className="inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold transition-all duration-300 border bg-card border-transparent text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 active:scale-90" title="Remove IP">
✕
</button>
</div>
))}
{(!profile.whitelistIp||profile.whitelistIp.length===0)&&(
<div className="col-span-full py-6 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-dashed border-black/10 dark:border-white/10 rounded">
No IP whitelisted yet
</div>
)}
</div>
</div>

</>
);
}
