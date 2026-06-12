import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { WABot } from "@/system/lib/whatsapp";
import { message } from "@/system/lib/responses";
import { bootstrapSystem } from "@/system/lib/bootstrap";
import { getUserByUsername } from "@/system/lib/account-db";

//==================
export const runtime = "nodejs";
//==================
export const dynamic = "force-dynamic";
//==================
export async function GET(req: NextRequest) {
try {
await bootstrapSystem();
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.unauthorized }, { status: 401 });

const username = token.name;
const dbUser = getUserByUsername(username);
if (!dbUser) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

// Determine effective role for WhatsApp limits
let effectiveRole = dbUser.role || "user";
if (effectiveRole === "user" && dbUser.premiumStatus?.isPremium) {
    effectiveRole = "premium";
}

const max = WABot.getMaxBots(effectiveRole);
const allBots = WABot.getBots();

// System filtering: Only show bots that belong to THIS user
const userBots = allBots.filter(v => v.username && v.username.toLowerCase() === username.toLowerCase());

return NextResponse.json({
status: true,
user: { username, role: effectiveRole },
limits: { used: userBots.length, max, remaining: max === Infinity ? "Infinity" : max - userBots.length },
bots: userBots.map(b => ({ 
    id: `${b.username}:${b.phoneNumber}`, 
    connected: b.connected, 
    phoneNumber: b.phoneNumber || null, 
    createdAt: b.connectedAt || null 
}))
});
} catch (e: any) {
return NextResponse.json({ status: false, message: e.message || message.api.serverError }, { status: 500 });
}
}