import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, updateUserLimit } from "@/system/lib/account-db";
//==================
export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const requesterRole = token?.role as string;
if (!token || token.isDead || (requesterRole !== "admin" && requesterRole !== "owner")) {
return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
}
try {
const { username, amount } = await req.json();
if (!username || typeof amount !== "number") {
return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
}
const user = getUserByUsername(username);
if (!user) {
return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
}
const newLimit = (user.limit || 0) + amount;
updateUserLimit(username, newLimit);
return NextResponse.json({ status: true, message: message.status.success });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}