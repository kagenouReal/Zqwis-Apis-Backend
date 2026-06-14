import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { readDB } from "@/system/lib/account-db";

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "admin" && token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
const users = await readDB();
return NextResponse.json(users.map((u: any) => { delete u.password; return u; }));
}