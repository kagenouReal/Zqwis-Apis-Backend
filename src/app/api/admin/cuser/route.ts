import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB, generateApiKey } from "@/system/lib/db";

const userLimit = parseInt(process.env.LIMIT_USER || "10", 10);
const adminLimitStr = process.env.LIMIT_ADMIN || "1000";
const adminLimit = adminLimitStr === "UNLIMITED" ? 999999 : parseInt(adminLimitStr, 10);
const LIMIT_IP_USER = parseInt(process.env.LIMIT_IP_USER || "3", 10);
const LIMIT_IP_ADMIN = parseInt(process.env.LIMIT_IP_ADMIN || "10", 10);

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const requesterRole = token?.role as string;
if (!token || token.isDead || (requesterRole !== "admin" && requesterRole !== "owner")) {
return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
}
try {
const { username, password, role } = await req.json();
if (!username || !password) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
if (requesterRole === "admin" && role === "owner") return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
const rootOwner = process.env.OWNER_USER || "owner";
if (username.toLowerCase() === rootOwner.toLowerCase()) {
return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
}
const users = await readDB();
if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
}
const targetRole = role || "user";
users.push({
username,
password, 
role: targetRole,
apikey: generateApiKey(),
limit: targetRole === "admin" ? adminLimit : userLimit,
maxIpQuota: targetRole === "admin" ? LIMIT_IP_ADMIN : LIMIT_IP_USER,
whitelistIp: [],
lastReset: Date.now(),
createdAt: new Date().toISOString()
});
await writeDB(users);
return NextResponse.json({ status: true, message: message.status.success });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
