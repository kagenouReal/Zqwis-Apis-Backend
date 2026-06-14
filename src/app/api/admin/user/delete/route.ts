import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, deleteUser } from "@/system/lib/account-db";

export async function DELETE(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const username = req.nextUrl.searchParams.get("username");
if (!username) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });

const userToDelete = getUserByUsername(username);
if (!userToDelete) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

// Prevent deleting self or owner if not owner
if (username === token.name) return NextResponse.json({ status: false, message: "Cannot delete self" }, { status: 403 });
if (userToDelete.role === "owner" && token.role !== "owner") return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });

deleteUser(username);
return NextResponse.json({ status: true, message: message.user.deleted });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}