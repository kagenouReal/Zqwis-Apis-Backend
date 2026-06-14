import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { hashPassword, writeDB, getUserByUsername, generateApiKey } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { username, password, role } = await req.json();
if (!username || !password) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
if (getUserByUsername(username)) return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
const hashed = await hashPassword(password);
const newUser = {
    username, password: hashed, role: role || "user", apikey: generateApiKey(),
    limit: parseInt(process.env.LIMIT_USER || "10"), maxIpQuota: 3, whitelistIp: [],
    createdAt: new Date().toISOString(), coins: { total: 50, earned: 50, spent: 0 },
    premiumStatus: { isPremium: false }, missions: { completed: [] }, activity: {}
};
await writeDB([newUser]);
return NextResponse.json({ status: true, message: message.status.success });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}