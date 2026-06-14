import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, updateUserWhitelist } from "@/system/lib/account-db";

const IP_USER = parseInt(process.env.LIMIT_IP_USER || "3", 10);
const IP_PREMIUM = parseInt(process.env.LIMIT_IP_PREMIUM || "8", 10);
const IP_ADMIN = parseInt(process.env.LIMIT_IP_ADMIN || "10", 10);

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const { ip } = await req.json();
if (!ip) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
const user = getUserByUsername(token.name);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
if (user.whitelistIp.includes(ip)) return NextResponse.json({ status: false, message: message.ip.exists }, { status: 400 });

// Dynamic quota selection
let quota = user.maxIpQuota;
if (!quota) {
    if (user.role === "admin") quota = IP_ADMIN;
    else if (user.role === "premium" || user.premiumStatus?.isPremium) quota = IP_PREMIUM;
    else quota = IP_USER;
}

if (user.whitelistIp.length >= quota) return NextResponse.json({ status: false, message: message.ip.quotaFull }, { status: 400 });
user.whitelistIp.push(ip);
updateUserWhitelist(user.username, user.whitelistIp);
return NextResponse.json({ status: true, message: message.status.success, whitelistIp: user.whitelistIp });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}