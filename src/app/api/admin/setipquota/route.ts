import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB } from "@/system/lib/db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const requesterRole = token?.role as string;
if (!token || token.isDead || (requesterRole !== "admin" && requesterRole !== "owner")) {
return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
}
try {
const { username, quota } = await req.json();
if (!username || typeof quota !== "number") {
return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
}
let users = await readDB();
const userIndex = users.findIndex((u: any) => u.username === username);
if (userIndex === -1) {
return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
}
users[userIndex].maxIpQuota = quota;
await writeDB(users);
return NextResponse.json({ status: true, message: message.status.success });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
