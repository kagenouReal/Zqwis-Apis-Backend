import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getSystemInfo } from "@/system/lib/owner";

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
return NextResponse.json({ status: true, data: getSystemInfo() });
}