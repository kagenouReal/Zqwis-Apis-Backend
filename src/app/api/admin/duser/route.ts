import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB } from "@/system/lib/db";

export async function DELETE(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
const requesterRole = token?.role as string;
if (!token || token.isDead || (requesterRole !== "admin" && requesterRole !== "owner")) {
return NextResponse.json({ status: false, message: message.auth.owner }, { status: 403 });
}
try {
const { searchParams } = new URL(req.url);
const username = searchParams.get("username");
if (!username) {
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const rootOwner = process.env.OWNER_USER || "owner";
if (username.toLowerCase() === rootOwner.toLowerCase()) {
return NextResponse.json({ status: false, message: message.api.forbidden }, { status: 403 });
}
let users = await readDB();
const targetUser = users.find((u: any) => u.username === username);
if (!targetUser) {
return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
}
if (requesterRole === "admin" && targetUser.role === "owner") {
return NextResponse.json({ status: false, message: message.api.forbidden }, { status: 403 });
}
users = users.filter((u: any) => u.username !== username);
await writeDB(users);
return NextResponse.json({ status: true, message: message.status.success });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
