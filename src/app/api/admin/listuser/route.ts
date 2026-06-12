import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { readDB } from "@/system/lib/account-db";
//==================
export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const role = token?.role as string;
if (!token || token.isDead || (role !== "admin" && role !== "owner")) {
return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
}
try {
const users = await readDB();
let safeUsers = users.map((u: any) => ({
username: u.username,
role: u.role || "user",
createdAt: u.createdAt,
password: (role === "admin" && u.role === "owner") ? "******" : u.password,
apikey: (role === "admin" && u.role === "owner") ? "******" : u.apikey,
limit: u.limit,
whitelistIp: (role === "admin" && u.role === "owner") ? [] : (u.whitelistIp || []),
maxIpQuota: u.maxIpQuota || null,
coins: u.coins || { total: 0, earned: 0, spent: 0 },
premium: u.premium || { isPremium: false, type: "free" }
}));
const rootUsername = process.env.OWNER_USER || "owner";
const rootOwner = {
username: rootUsername,
role: "owner",
createdAt: null,
password: role === "admin" ? "******" : (process.env.OWNER_PASS || "HIDDEN"),
apikey: role === "admin" ? "******" : (process.env.OWNER_APIKEY || "MyOwner"),
limit: 999999,
whitelistIp: [],
maxIpQuota: 999999,
coins: { total: 999999, earned: 999999, spent: 0 },
premium: { isPremium: true, type: "permanent" }
};
if (!safeUsers.some((u: any) => u.username === rootUsername)) {
safeUsers.unshift(rootOwner);
}
return NextResponse.json(safeUsers);
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}