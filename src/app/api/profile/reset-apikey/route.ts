import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, generateApiKey, updateUserAccount } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const key = generateApiKey();
updateUserAccount(token.name, { apikey: key });
return NextResponse.json({ status: true, message: message.status.success, apikey: key });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}