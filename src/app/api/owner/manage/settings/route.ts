import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getSettings, updateSetting } from "@/system/lib/owner";

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
return NextResponse.json({ status: true, data: getSettings() });
}

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { key, value } = await req.json();
if (!key) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
updateSetting(key, value);
return NextResponse.json({ status: true, message: message.status.updated });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}