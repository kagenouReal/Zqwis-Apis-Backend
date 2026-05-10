import {NextResponse} from "next/server";
import {readDB,writeDB} from "@/system/lib/db";

const systemIps=[
"127.0.0.1",
"::1",
"::ffff:127.0.0.1",
"localhost"
];
const rateLimitMap=new Map<string,{count:number,resetTime:number}>();
const apiRateConfig=(process.env.API_MAX_REQUESTS||"10,2000").split(",");
const MAX_REQUESTS=parseInt(apiRateConfig[0],10);
const WINDOW_MS=parseInt(apiRateConfig[1],10);
const LIMIT_USER=parseInt(process.env.LIMIT_USER||"10",10);
const LIMIT_ADMIN=parseInt(process.env.LIMIT_ADMIN||"1000",10);
const LIMIT_RESET_TIME=parseInt(process.env.LIMIT_RESET_TIME||"3600000",10);
const AUTO_RESET_LIMIT=process.env.AUTO_RESET_LIMIT==="true";
function checkRateLimit(ip:string){
if(rateLimitMap.size>5000)rateLimitMap.clear();
const now=Date.now();
const record=rateLimitMap.get(ip);
if(!record||now>record.resetTime){
rateLimitMap.set(ip,{count:1,resetTime:now+WINDOW_MS});
return true;
}
if(record.count>=MAX_REQUESTS)return false;
record.count+=1;
rateLimitMap.set(ip,record);
return true;
}
export async function checkApikey(req:Request){
const forwardedFor=req.headers.get("x-forwarded-for");
const clientIp=forwardedFor?forwardedFor.split(",")[0].trim():(req.headers.get("x-real-ip")||"Unknown IP");
if(!checkRateLimit(clientIp)){
return{status:false,response:NextResponse.json({status:false,message:"Rate Limited"},{status:429})};
}
const nextUrl=(req as any).nextUrl;
const apikey=nextUrl?.searchParams.get("apikey")||new URL(req.url).searchParams.get("apikey")||req.headers.get("apikey")||req.headers.get("authorization")?.replace("Bearer ","");
if(!apikey)return{status:false,response:NextResponse.json({status:false,message:"API Key is required."},{status:401})};
if(process.env.OWNER_APIKEY&&apikey===process.env.OWNER_APIKEY)return{status:true,user:{username:"owner",role:"owner",limit:"UNLIMITED"}};
let users=await readDB();
const userIndex=users.findIndex((u:any)=>u.apikey===apikey);
if(userIndex===-1)return{status:false,response:NextResponse.json({status:false,message:"Invalid API Key."},{status:401})};
let user=users[userIndex];
if(AUTO_RESET_LIMIT){
const now=Date.now();
if(!user.lastReset||(now-user.lastReset>LIMIT_RESET_TIME)){
const defaultLimit=user.role==="admin"?LIMIT_ADMIN:LIMIT_USER;
if(user.limit<defaultLimit)user.limit=defaultLimit;
user.lastReset=now;
}
}
if(!user.whitelistIp||!Array.isArray(user.whitelistIp)||user.whitelistIp.length===0){
return{status:false,response:NextResponse.json({status:false,message:"No IP Whitelisted."},{status:403})};
}
if(
!systemIps.includes(clientIp) &&
!user.whitelistIp.includes(clientIp)
){
return{
status:false,
response:NextResponse.json(
{status:false,message:"IP not whitelisted."},
{status:403}
)
};
}
if(user.limit<=0){
users[userIndex]=user;
await writeDB(users);
return{status:false,response:NextResponse.json({status:false,message:"Limit exhausted."},{status:429})};
}
user.limit-=1;
users[userIndex]=user;
await writeDB(users);
return{status:true,user};
}
