import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { WABot } from "@/system/lib/whatsapp-bot";
import { message } from "@/system/lib/message";
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
  try {
    let { username, phoneNumber } = await req.json();
    const role = (token.role as string) || "user";
    if (role !== "admin" && role !== "owner") username = token.name;
    username = username || token.name;
    if (!phoneNumber) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
    const res = await WABot.disconnect(username, phoneNumber);
    if (!res) return NextResponse.json({ status: false, message: message.whatsapp.notFound }, { status: 404 });
    return NextResponse.json({ status: true, message: message.whatsapp.disconnected });
  } catch (e: any) {
    return NextResponse.json({ status: false, message: e.message || message.status.error }, { status: 500 });
  }
}
