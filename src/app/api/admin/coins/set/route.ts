import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { adminSetCoins } from "@/system/database/products";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { username, amount, reason } = await req.json();
const res = await adminSetCoins(username, amount, "set", reason || "Admin adjustment");
return NextResponse.json(res);
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}