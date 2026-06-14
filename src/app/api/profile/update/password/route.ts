import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, hashPassword, updateUserAccount } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const { newPassword } = await req.json();
if (!newPassword) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
const hashed = await hashPassword(newPassword);
updateUserAccount(token.name, { password: hashed });
return NextResponse.json({ status: true, message: message.status.success });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}