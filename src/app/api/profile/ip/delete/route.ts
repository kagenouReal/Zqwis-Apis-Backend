import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, updateUserWhitelist } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const { ip } = await req.json();
if (!ip) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
const user = getUserByUsername(token.name);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
const list = user.whitelistIp.filter((i: string) => i !== ip);
updateUserWhitelist(user.username, list);
return NextResponse.json({ status: true, message: message.status.success, whitelistIp: list });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}