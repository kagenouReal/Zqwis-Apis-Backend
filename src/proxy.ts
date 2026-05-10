import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {getToken} from "next-auth/jwt";
const rateLimitMap=new Map<string,{count:number,resetTime:number}>();
const globalRateConfig=(process.env.RATE_MAX_REQUESTS||"30,10000").split(",");
const MAX_REQUESTS=parseInt(globalRateConfig[0],10);
const WINDOW_MS=parseInt(globalRateConfig[1],10);
const protectedPaths=["/home","/adminmenu","/docsmenu","/ownermenu","/profile"];
export async function proxy(request:NextRequest){
if(rateLimitMap.size>5000)rateLimitMap.clear();
const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")?.split(",")[0].trim()||"Unknown IP";
const now=Date.now();
const record=rateLimitMap.get(ip);
if(!record||now>record.resetTime){
rateLimitMap.set(ip,{count:1,resetTime:now+WINDOW_MS});
}else{
if(record.count>=MAX_REQUESTS){
return new NextResponse(JSON.stringify({status:false,message:"SYSTEM DEFENSE ACTIVE: Too Many Requests."}),{status:429,headers:{"content-type":"application/json"}});
}
record.count+=1;
rateLimitMap.set(ip,record);
}
const path=request.nextUrl.pathname;
if(protectedPaths.some(p=>path.startsWith(p))){
const token=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
if(!token)return NextResponse.redirect(new URL("/",request.url));
}
return NextResponse.next();
}
export const config={
matcher:["/((?!_next/static|_next/image|favicon.ico).*)"],
};
