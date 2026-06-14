import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, updateUserAccount } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const { newUsername } = await req.json();
if (!newUsername) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
if (getUserByUsername(newUsername)) return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
updateUserAccount(token.name, { username: newUsername });
return NextResponse.json({ status: true, message: message.status.success });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}