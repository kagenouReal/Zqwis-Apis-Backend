import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { addCoins } from "@/system/database/products";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { username, amount, reason } = await req.json();
if (!username) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
const res = await addCoins(username, amount, reason || "Admin gift");
return NextResponse.json(res);
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}