import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getCoins } from "@/system/database/products";

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