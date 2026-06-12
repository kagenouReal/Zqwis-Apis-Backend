import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { WABot } from "@/system/lib/whatsapp";
import { readDB } from "@/system/lib/account-db";
import { message } from "@/system/lib/responses";
//==================
export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) {
return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
}
try {
const { phoneNumber } = await req.json();
if (!phoneNumber) {
return NextResponse.json({ status: false, message: message.ip.missing }, { status: 400 });
}
const user = token.name;
const role = (token.role as string) || "user";
const users = await readDB();
const uDoc = users.find((u: any) => u.username === user);
const rLimit = (role === "user" && uDoc?.premiumStatus?.isPremium) ? "premium" : role;
const max = WABot.getMaxBots(rLimit as string);
const bots = WABot.getBots().filter(b => b.username === user);
// Validasi Limit
if (bots.length >= max) {
return NextResponse.json({
status: false,
message: message.limit.exceeded,
current: bots.length,
max
}, { status: 400 });
}
// Validasi apakah nomor tersebut sudah terhubung di memori aktif
if (bots.find(b => b.phoneNumber === phoneNumber)) {
return NextResponse.json({ status: false, message: message.whatsapp.alreadyConnected }, { status: 400 });
}
// Eksekusi pemanggilan bot
const res = await WABot.connect(user, phoneNumber);
if (res.status === "already_connected") {
return NextResponse.json({ status: true, message: message.whatsapp.alreadyConnected, data: res });
}
return NextResponse.json({ status: true, message: message.whatsapp.pairingCode, data: res });
} catch (e: any) {
return NextResponse.json({ status: false, message: e.message || message.status.error }, { status: 500 });
}
}