import { NextResponse } from "next/server";
import { message } from "@/system/lib/message";
import { readDB, writeDB, generateApiKey } from "@/system/lib/db";
import bcrypt from "bcryptjs";

const userLimit = parseInt(process.env.LIMIT_USER || "10", 10);
const ipLimit = parseInt(process.env.LIMIT_IP_USER || "3", 10);

export async function POST(req: Request) {
try {
const { username, password } = await req.json();
if (!username || !password) {
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const cleanUsername = username.trim();
if (cleanUsername.length < 4 || password.length < 6) {
return NextResponse.json({ status: false, message: message.input.invalidFormat }, { status: 400 });
}
const rootOwner = process.env.OWNER_USER || "owner";
if (cleanUsername.toLowerCase() === rootOwner.toLowerCase() || cleanUsername.toLowerCase() === "admin") {
return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
}
const users = await readDB();
if (users.find((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
}
const hashedPassword = await bcrypt.hash(password, 10);
users.push({ 
username: cleanUsername, 
password: hashedPassword,
role: "user",
apikey: generateApiKey(),
limit: userLimit, 
maxIpQuota: ipLimit, 
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
