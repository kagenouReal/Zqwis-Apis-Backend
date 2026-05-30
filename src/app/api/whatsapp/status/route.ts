import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { WABot } from "@/system/lib/whatsapp-bot";
import { message } from "@/system/lib/message";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.name) return NextResponse.json({ status: false, message: message.auth.unauthorized }, { status: 401 });
    const user = token.name;
    const role = (token.role as string) || "user";
    const max = WABot.getMaxBots(role);
    const bots = WABot.getBots().filter(v => v.username === user);
    return NextResponse.json({
      status: true,
      user: { user, role },
      limits: { used: bots.length, max, remaining: max === Infinity ? "Infinity" : max - bots.length },
      bots: bots.map(b => ({ id: `${b.username}:${b.phoneNumber}`, connected: b.connected, phoneNumber: b.phoneNumber || null, createdAt: b.connectedAt || null }))
    });
  } catch (e: any) {
    return NextResponse.json({ status: false, message: e.message || message.api.serverError }, { status: 500 });
  }
}
