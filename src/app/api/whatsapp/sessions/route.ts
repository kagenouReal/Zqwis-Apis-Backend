import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { getAllSessions } from "@/system/lib/whatsapp-session";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string;

  if (!token || (role !== "admin" && role !== "owner")) {
    return NextResponse.json(
      { status: false, message: message.auth.denied },
      { status: 403 }
    );
  }

  try {
    const sessions = getAllSessions();

    return NextResponse.json({
      status: true,
      total: sessions.length,
      sessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err.message || message.api.serverError },
      { status: 500 }
    );
  }
}