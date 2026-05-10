import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB, generateApiKey } from "@/system/lib/db";

const LIMIT_USER = parseInt(process.env.LIMIT_USER || "10", 10);
const LIMIT_ADMIN = parseInt(process.env.LIMIT_ADMIN || "1000", 10);
const LIMIT_RESET_TIME = parseInt(process.env.LIMIT_RESET_TIME || "3600000", 10);
const AUTO_RESET_LIMIT = process.env.AUTO_RESET_LIMIT === "true";
const LIMIT_IP_USER = parseInt(process.env.LIMIT_IP_USER || "3", 10);
const LIMIT_IP_ADMIN = parseInt(process.env.LIMIT_IP_ADMIN || "10", 10);

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
const rootOwner = process.env.OWNER_USER || "owner";
if (token.name === rootOwner) {
return NextResponse.json({
username: rootOwner,
role: "owner",
apikey: process.env.OWNER_APIKEY || "owner-master-key",
limit: "UNLIMITED",
whitelistIp: [],
isRoot: true
});
}
let users = await readDB();
const userIndex = users.findIndex((u: any) => u.username === token.name);
if (userIndex === -1) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
if (AUTO_RESET_LIMIT) {
const now = Date.now();
if (!users[userIndex].lastReset || (now - users[userIndex].lastReset > LIMIT_RESET_TIME)) {
const defaultLimit = users[userIndex].role === "admin" ? LIMIT_ADMIN : LIMIT_USER;
if (users[userIndex].limit < defaultLimit) {
users[userIndex].limit = defaultLimit;
}
users[userIndex].lastReset = now;
await writeDB(users);
}
}
return NextResponse.json({
username: users[userIndex].username,
role: users[userIndex].role,
apikey: users[userIndex].apikey,
limit: users[userIndex].role === "admin" ? LIMIT_ADMIN : users[userIndex].limit,
whitelistIp: users[userIndex].whitelistIp || [],
isRoot: false
});
}

export async function PUT(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
try {
const { action, payload } = await req.json();
const rootOwner = process.env.OWNER_USER || "owner";
if (token.name === rootOwner) return NextResponse.json({ status: false, message: "Root owner config is locked." }, { status: 403 });
let users = await readDB();
const userIndex = users.findIndex((u: any) => u.username === token.name);
if (userIndex === -1) return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
if (!users[userIndex].whitelistIp) users[userIndex].whitelistIp = [];
if (action === "change_password") {
if (!payload?.newPassword) return NextResponse.json({ status: false, message: "New password is required" }, { status: 400 });
users[userIndex].password = payload.newPassword;
await writeDB(users);
return NextResponse.json({ status: true, message: "Password updated successfully." });
}
if (action === "change_username") {
const newUsername = payload?.newUsername;
if (!newUsername) return NextResponse.json({ status: false, message: "New username is required" }, { status: 400 });
if (users.find((u: any) => u.username === newUsername)) return NextResponse.json({ status: false, message: "Username already exists." }, { status: 400 });
users[userIndex].username = newUsername;
await writeDB(users);
return NextResponse.json({ status: true, message: "Username updated. System will log you out." });
}
if (action === "reset_apikey") {
users[userIndex].apikey = generateApiKey();
await writeDB(users);
return NextResponse.json({ status: true, message: "API Key regenerated.", apikey: users[userIndex].apikey });
}
if (action === "add_ip") {
const newIp = payload?.ip;
if (!newIp) return NextResponse.json({ status: false, message: "IP is required." }, { status: 400 });
if (users[userIndex].whitelistIp.includes(newIp)) {
return NextResponse.json({ status: false, message: "IP is already whitelisted." }, { status: 400 });
}
const customQuota = users[userIndex].maxIpQuota;
const defaultQuota = users[userIndex].role === "admin" ? LIMIT_IP_ADMIN : LIMIT_IP_USER;
const finalQuota = (typeof customQuota === "number") ? customQuota : defaultQuota;

if (users[userIndex].whitelistIp.length >= finalQuota) {
return NextResponse.json({ status: false, message: `Maximum ${finalQuota} IPs allowed.` }, { status: 400 });
}
users[userIndex].whitelistIp.push(newIp);
await writeDB(users);
return NextResponse.json({ status: true, message: `IP ${newIp} whitelisted.`, whitelistIp: users[userIndex].whitelistIp });
}

if (action === "delete_ip") {
const delIp = payload?.ip;
if (!delIp) return NextResponse.json({ status: false, message: "IP is required." }, { status: 400 });
users[userIndex].whitelistIp = users[userIndex].whitelistIp.filter((ip: string) => ip !== delIp);
await writeDB(users);
return NextResponse.json({ status: true, message: `IP ${delIp} removed.`, whitelistIp: users[userIndex].whitelistIp });
}
return NextResponse.json({ status: false, message: "Invalid action." }, { status: 400 });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
