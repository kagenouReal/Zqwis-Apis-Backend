import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getCoins, addCoins } from "@/system/lib/premium";
//==================
export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const res: any = await getCoins(token.name);
if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
return NextResponse.json({ status: true, data: res.coins });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
//==================
export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token || (token.role !== "admin" && token.role !== "owner")) return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { username, amount, reason } = await req.json();
if (!username || typeof amount !== "number" || amount <= 0) return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
const res: any = await addCoins(username, amount, reason || "Admin reward");
if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
return NextResponse.json({ status: true, message: message.coins.added, data: res.coins });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}