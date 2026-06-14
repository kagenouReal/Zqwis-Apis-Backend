import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { buyPremium } from "@/system/database/products";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const { packageId } = await req.json();
if (!packageId) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
const res = await buyPremium(token.name, packageId);
if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
return NextResponse.json({ status: true, message: res.message });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}