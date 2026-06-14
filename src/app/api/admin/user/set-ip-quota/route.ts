import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { updateUserIpQuota, getUserByUsername } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const { username, quota } = await req.json();
if (!username) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });

const user = getUserByUsername(username);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

updateUserIpQuota(username, quota);
return NextResponse.json({ status: true, message: message.status.success });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}